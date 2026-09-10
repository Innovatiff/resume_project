/* ------------------------------------------------------------------
   Builds the browser extension with esbuild.
     node extension/build.mjs          -> extension/dist  (load unpacked, or zip for the store)
     node extension/build.mjs --dev    -> extension/.dev  (adds localhost, used by e2e/extension.mjs)
   Also writes public/downloads/orvenic-extension.zip from the release build.
------------------------------------------------------------------- */

import { build } from "esbuild";
import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { deflateRawSync, crc32 } from "node:zlib";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const dev = process.argv.includes("--dev");
const out = path.join(here, dev ? ".dev" : "dist");
const VERSION = "0.1.0";

// Mirrors ATS_HOSTS in src/lib/extension/ats.ts. Keep the two lists the same.
const ATS = [
  "https://boards.greenhouse.io/*",
  "https://job-boards.greenhouse.io/*",
  "https://boards.eu.greenhouse.io/*",
  "https://job-boards.eu.greenhouse.io/*",
  "https://jobs.lever.co/*",
  "https://jobs.eu.lever.co/*",
  "https://jobs.ashbyhq.com/*",
  "https://*.myworkdayjobs.com/*",
  "https://*.myworkdaysite.com/*",
];
const SITE = ["https://orvenic.com/*", "https://www.orvenic.com/*"];
const LOCAL = dev ? ["http://localhost/*", "http://127.0.0.1/*"] : [];
// The bridge is declared for the whole site: the app navigates client-side, so a script matched only on
// /app/extension would be missing whenever the candidate arrives there from the app's own navigation.
const bridgeMatches = [...SITE, ...LOCAL];

const manifest = {
  manifest_version: 3,
  name: dev ? "Orvenic (dev)" : "Orvenic",
  version: VERSION,
  // The store caps this at 132 characters.
  description: "Scores job postings against your resume and fills applications from your Orvenic package for your review. Never submits for you.",
  minimum_chrome_version: "116",
  icons: { 16: "icons/icon16.png", 32: "icons/icon32.png", 48: "icons/icon48.png", 128: "icons/icon128.png" },
  action: { default_title: "Orvenic", default_popup: "popup.html", default_icon: { 16: "icons/icon16.png", 32: "icons/icon32.png" } },
  background: { service_worker: "background.js" },
  permissions: ["storage", "activeTab", "scripting"],
  host_permissions: [...ATS, ...SITE, ...LOCAL],
  content_scripts: [
    { matches: [...ATS, ...LOCAL], js: ["page.js"], css: ["content.css"], all_frames: true, run_at: "document_idle" },
    { matches: bridgeMatches, js: ["bridge.js"], run_at: "document_idle" },
  ],
};

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

await build({
  entryPoints: {
    background: path.join(here, "src/background.ts"),
    page: path.join(here, "src/content/page.ts"),
    bridge: path.join(here, "src/content/bridge.ts"),
    popup: path.join(here, "src/popup/popup.ts"),
  },
  bundle: true,
  format: "iife",
  platform: "browser",
  target: ["chrome116"],
  outdir: out,
  minify: !dev,
  sourcemap: dev ? "inline" : false,
  legalComments: "none",
  tsconfig: path.join(root, "tsconfig.json"),
  define: { "process.env.NODE_ENV": JSON.stringify(dev ? "development" : "production") },
  logLevel: "warning",
});

cpSync(path.join(here, "static"), out, { recursive: true });
writeFileSync(path.join(out, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");

/* ---------- a zip for people who cannot clone the repo ---------- */

function zipDir(dir) {
  const files = [];
  const walk = (d, rel) => {
    for (const name of readdirSync(d).sort()) {
      const full = path.join(d, name);
      const r = rel ? `${rel}/${name}` : name;
      if (statSync(full).isDirectory()) walk(full, r);
      else files.push({ name: r, data: readFileSync(full) });
    }
  };
  walk(dir, "");
  const locals = [];
  const centrals = [];
  let offset = 0;
  const dosTime = 0x0000;
  const dosDate = (2024 - 1980) << 9 | (1 << 5) | 1; // a fixed date keeps the zip reproducible
  for (const f of files) {
    const name = Buffer.from(f.name, "utf8");
    const packed = deflateRawSync(f.data);
    const crc = crc32(f.data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6); // utf-8 names
    local.writeUInt16LE(8, 8); // deflate
    local.writeUInt16LE(dosTime, 10);
    local.writeUInt16LE(dosDate, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(packed.length, 18);
    local.writeUInt32LE(f.data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(8, 10);
    central.writeUInt16LE(dosTime, 12);
    central.writeUInt16LE(dosDate, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(packed.length, 20);
    central.writeUInt32LE(f.data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    locals.push(local, name, packed);
    centrals.push(central, name);
    offset += local.length + name.length + packed.length;
  }
  const centralSize = centrals.reduce((n, b) => n + b.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);
  return Buffer.concat([...locals, ...centrals, end]);
}

if (!dev) {
  const downloads = path.join(root, "public", "downloads");
  mkdirSync(downloads, { recursive: true });
  writeFileSync(path.join(downloads, "orvenic-extension.zip"), zipDir(out));
}

console.log(`extension built -> ${path.relative(root, out)}${dev ? "" : " and public/downloads/orvenic-extension.zip"}`);
