/*
  End-to-end test of the browser extension against the development checkout,
  the emulators and three ATS look-alike pages served locally. Builds the
  extension in dev mode (extension/.dev), loads it into a persistent Chromium
  context, connects it from the account page, scores a posting from the page,
  fills a form, checks what was filled, what was flagged and that nothing was
  submitted, marks the application as applied and revokes the key.

  Needs the emulators (npm run emulators) and Chromium, like e2e/app.mjs.
  E2E_PORT (default 3132) for the app, E2E_FIXTURE_PORT (default 3149) for
  the ATS pages, E2E_CHROMIUM / E2E_CHANNEL to pick a browser.
*/

import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const OUT = path.join(HERE, "output");
const FX = path.join(HERE, "fixtures");
const EXT = path.join(ROOT, "extension", ".dev");
const PORT = Number(process.env.E2E_PORT || 3132);
const FX_PORT = Number(process.env.E2E_FIXTURE_PORT || 3149);
const BASE = `http://localhost:${PORT}`;
const FXBASE = `http://localhost:${FX_PORT}`;
const AUTH_EMULATOR = process.env.FIREBASE_AUTH_EMULATOR_HOST || "localhost:9099";
const FIRESTORE_EMULATOR = process.env.FIRESTORE_EMULATOR_HOST || "localhost:8080";

fs.mkdirSync(OUT, { recursive: true });
const shot = (name) => path.join(OUT, name);
const results = [];
const check = (name, ok, extra = "") => {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? "  — " + extra : ""}`);
};
const reachable = (url) => new Promise((res) => http.get(url, (r) => { r.resume(); res(true); }).on("error", () => res(false)));
const waitFor = async (url, tries = 240) => {
  for (let i = 0; i < tries; i++) {
    if (await reachable(url)) return;
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`server did not answer at ${url}`);
};

const posting = fs.readFileSync(path.join(FX, "posting.txt"), "utf8");
const email = `maria+ext${Date.now()}@example.com`;
const password = "correct-horse-battery";

(async () => {
  if (!(await reachable(`http://${AUTH_EMULATOR}/`)) || !(await reachable(`http://${FIRESTORE_EMULATOR}/`))) {
    console.error(`Firebase emulators are not running on ${AUTH_EMULATOR} / ${FIRESTORE_EMULATOR}. Start them with: npm run emulators`);
    process.exit(2);
  }

  // ---------- dev build of the extension ----------
  const built = spawnSync(process.execPath, [path.join(ROOT, "extension", "build.mjs"), "--dev"], { cwd: ROOT, stdio: "inherit" });
  if (built.status !== 0 || !fs.existsSync(path.join(EXT, "manifest.json"))) {
    console.error("extension build failed");
    process.exit(2);
  }

  // ---------- the ATS look-alikes ----------
  const escapeHtml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const fixtures = http.createServer((req, res) => {
    if (req.url === "/favicon.ico") {
      res.writeHead(204);
      res.end();
      return;
    }
    const name = (req.url || "/").split("?")[0].replace(/^\//, "") || "greenhouse.html";
    const file = path.join(FX, "ats", path.basename(name));
    if (!fs.existsSync(file)) {
      res.writeHead(404);
      res.end("not found");
      return;
    }
    const html = fs.readFileSync(file, "utf8").replace("{{POSTING}}", escapeHtml(posting));
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(html);
  });
  await new Promise((r) => fixtures.listen(FX_PORT, r));

  // ---------- the app ----------
  const env = {
    ...process.env,
    PORT: String(PORT),
    NEXT_PUBLIC_SITE_URL: BASE,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: "demo-orvenic",
    NEXT_PUBLIC_FIREBASE_USE_EMULATOR: "1",
    FIREBASE_PROJECT_ID: "demo-orvenic",
    FIRESTORE_EMULATOR_HOST: FIRESTORE_EMULATOR,
    FIREBASE_AUTH_EMULATOR_HOST: AUTH_EMULATOR,
    SHORTLIST_AI_MOCK: "1",
    SHORTLIST_DEV_CHECKOUT: "1",
    FREE_SCAN_SALT: "e2e",
  };
  delete env.NODE_ENV;
  const nextBin = path.join(ROOT, "node_modules", "next", "dist", "bin", "next");
  const server = spawn(process.execPath, [nextBin, "dev", "-p", String(PORT)], { cwd: ROOT, env, stdio: ["ignore", "pipe", "pipe"], detached: process.platform !== "win32" });
  let serverLog = "";
  server.stdout.on("data", (d) => (serverLog += d));
  server.stderr.on("data", (d) => (serverLog += d));

  // ---------- a browser with the extension ----------
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "orvenic-ext-"));
  const launch = {
    headless: true,
    viewport: { width: 1280, height: 900 },
    acceptDownloads: true,
    args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`],
    ignoreDefaultArgs: ["--disable-extensions"],
    ...(process.env.E2E_CHROMIUM ? { executablePath: process.env.E2E_CHROMIUM } : process.env.E2E_CHANNEL ? { channel: process.env.E2E_CHANNEL } : { channel: "chromium" }),
  };
  let context;
  try {
    context = await chromium.launchPersistentContext(userDataDir, launch);
  } catch (e) {
    console.error("Could not start Chromium with the extension:", e.message.split("\n")[0]);
    try { process.kill(-server.pid, "SIGTERM"); } catch {}
    fixtures.close();
    process.exit(2);
  }
  const errors = [];
  const watch = (p, tag) => {
    p.on("pageerror", (e) => errors.push(`${tag} pageerror: ${e.message}`));
    p.on("console", (m) => { if (m.type() === "error" && !/favicon|401|402|409|429/.test(m.text())) errors.push(`${tag} console: ${m.text()}`); });
  };

  try {
    let [sw] = context.serviceWorkers();
    if (!sw) sw = await context.waitForEvent("serviceworker", { timeout: 20000 });
    const extId = new URL(sw.url()).host;
    check("extension service worker started", /^[a-p]{32}$/.test(extId), extId);

    await waitFor(BASE + "/api/health");

    // ---------- account with a pass and a profile ----------
    const page = await context.newPage();
    watch(page, "app");
    await page.goto(BASE + "/sign-up?next=%2Fcheckout%3Fplan%3Dpass", { waitUntil: "networkidle" });
    await page.fill("#name", "Maria Rodriguez");
    await page.fill("#email", email);
    await page.fill("#password", password);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/checkout?plan=pass", { timeout: 20000 });
    await page.waitForSelector("text=Get 30-Day Pass", { timeout: 20000 });
    await page.click("text=Get 30-Day Pass");
    await page.waitForURL("**/checkout/success**", { timeout: 20000 });
    await page.goto(BASE + "/app/profile", { waitUntil: "networkidle" });
    await page.setInputFiles('input[type="file"]', path.join(FX, "maria-resume.docx"));
    await page.click("text=Upload and extract");
    await page.waitForSelector("text=Profile updated", { timeout: 60000 });
    check("account has the pass and a profile", await page.isVisible("text=Inventory Lead"));

    // ---------- connect from the account page ----------
    await page.goto(BASE + "/app/extension", { waitUntil: "networkidle" });
    await page.waitForSelector('[data-extension="detected"]', { timeout: 15000 });
    check("extension page detects the installed extension", true);
    await page.screenshot({ path: shot("ext-page.png"), fullPage: true });
    await page.click('button:has-text("Connect this browser")');
    await page.waitForSelector("text=This browser is connected", { timeout: 30000 });
    await page.waitForSelector("table.app-table >> text=Chrome", { timeout: 10000 }).catch(() => undefined);
    check("connect hands the key to the extension without copying", await page.isVisible("text=This browser is connected"));
    check("connected browsers table lists this browser", (await page.locator("table.app-table tbody tr").count()) === 1);

    // ---------- popup shows the account ----------
    const popupUrl = (target) => `chrome-extension://${extId}/popup.html?url=${encodeURIComponent(target)}`;
    const gh = await context.newPage();
    watch(gh, "greenhouse");
    await gh.goto(`${FXBASE}/greenhouse.html`, { waitUntil: "networkidle" });
    const popup = await context.newPage();
    watch(popup, "popup");
    await popup.goto(popupUrl(`${FXBASE}/greenhouse.html`));
    await popup.waitForSelector("text=Score this posting", { timeout: 20000 });
    check("popup offers to score the posting on the page", await popup.isVisible(`text=${"Score this posting"}`));
    await popup.screenshot({ path: shot("ext-popup-score.png") });

    // ---------- score from the page ----------
    await popup.click("text=Score this posting");
    await popup.waitForSelector("text=Scored just now", { timeout: 90000 });
    const ringText = (await popup.textContent(".ring text")) || "";
    check("posting scored from the page with a verdict", /^\d+$/.test(ringText.trim()) && (await popup.locator(".chip").count()) === 1, `score=${ringText}`);
    check("pay report shown in the popup", await popup.isVisible("text=Pay report"));
    await popup.screenshot({ path: shot("ext-popup-scored.png") });
    const buildHref = await popup.getAttribute("a.btn--coral", "href");
    check("popup links to build the package in the app", /\/app\/applications\/[0-9a-f-]{36}$/.test(buildHref || ""), buildHref || "");
    const appUrl = buildHref.replace(/^https?:\/\/[^/]+/, BASE);

    // ---------- build the package in the app ----------
    await page.goto(appUrl, { waitUntil: "networkidle" });
    await page.waitForSelector("text=Score breakdown", { timeout: 30000 });
    if (await page.isVisible("text=Long-shot strategy off.")) await page.click(".app-switch input");
    await page.click("text=Build my package");
    await page.waitForSelector("text=The metric interview", { timeout: 90000 });
    const inputs = page.locator(".app-qa__item input");
    const n = await inputs.count();
    for (let i = 0; i < n; i++) await inputs.nth(i).fill(i === 0 ? "about 120 orders a day" : "");
    await page.click("text=Use these answers");
    await page.waitForSelector("text=Your package", { timeout: 120000 });
    check("package built for the posting scored from the page", await page.isVisible(".app-resume"));

    // ---------- fill the Greenhouse form ----------
    await popup.reload();
    await popup.waitForSelector("text=This posting is on your shortlist", { timeout: 30000 });
    check("popup matches the page to the saved application", true);
    await popup.click("text=Fill this application");
    await popup.waitForSelector("text=Filled", { timeout: 60000 });
    await popup.screenshot({ path: shot("ext-popup-filled.png") });
    await gh.waitForTimeout(500);
    await gh.screenshot({ path: shot("ext-greenhouse-filled.png"), fullPage: true });

    const v = (sel) => gh.$eval(sel, (el) => el.value);
    check("first and last name filled from the package", (await v("#first_name")) === "Maria" && (await v("#last_name")) === "Rodriguez", `${await v("#first_name")} ${await v("#last_name")}`);
    check("email, phone and city filled", (await v("#email")).includes("@") && (await v("#phone")).length > 6 && (await v("#job_application_location")).length > 2, `${await v("#email")} · ${await v("#phone")} · ${await v("#job_application_location")}`);
    check("LinkedIn filled as a URL, website left alone", (await v("#linkedin")).startsWith("https://") && (await v("#website")) === "");
    const cover = await v("#cover_letter_text");
    check("cover letter typed into the textarea", cover.length > 200, `${cover.length} chars`);
    const resume = await gh.$eval("#resume", (el) => ({ n: el.files.length, name: el.files[0]?.name || "", type: el.files[0]?.type || "", size: el.files[0]?.size || 0 }));
    check("tailored resume attached as a PDF", resume.n === 1 && /\.pdf$/.test(resume.name) && resume.size > 2000, `${resume.name} (${resume.size} bytes)`);
    check("site's own change handler saw the attachment", (await gh.textContent(".attach")).startsWith("Attached:"));
    const flags = await gh.$$eval(".orvenic-badge--flag", (els) => els.map((e) => e.textContent));
    check("attestations and self-identification flagged, never filled", flags.length === 4 && flags.some((t) => /Work authorization/.test(t)) && flags.some((t) => /Sponsorship/.test(t)) && flags.some((t) => /Licence/.test(t)) && flags.some((t) => /self-identification/.test(t)), flags.join(" | "));
    const untouched = await gh.$$eval('input[type="radio"], #sponsor, #licence, #gender, #how', (els) => els.every((e) => (e.type === "radio" ? !e.checked : e.value === "")));
    check("no radio, sponsorship, licence, gender or referral choice was made", untouched);
    const hints = await gh.$$eval(".orvenic-badge--hint", (els) => els.map((e) => e.textContent));
    check("pay report shown beside the salary ask, field left empty", hints.length === 1 && /Pay report/.test(hints[0]) && (await v("#salary")) === "", hints[0] || "");
    check("custom question left for the candidate", (await v("#why")) === "");
    check("nothing was submitted", (await gh.evaluate(() => window.__submitted)) === false);
    check("on-page panel reports the fill and offers undo", (await gh.$eval("#orvenic-panel-host", (h) => h.shadowRoot.textContent)).includes("never submits"));

    // ---------- undo and refill ----------
    await popup.click("text=Undo");
    await popup.waitForSelector("text=This posting is on your shortlist", { timeout: 30000 });
    await gh.waitForTimeout(300);
    check("undo clears what the extension typed", (await v("#first_name")) === "" && (await v("#cover_letter_text")) === "" && (await gh.$$eval(".orvenic-badge", (els) => els.length)) === 0);
    await popup.click("text=Fill this application");
    await popup.waitForSelector("text=Filled", { timeout: 60000 });

    // ---------- the fill is on the tracker ----------
    await page.goto(appUrl, { waitUntil: "networkidle" });
    await page.waitForSelector("text=Your package", { timeout: 30000 });
    // The look-alikes run on localhost, so the record names "this site" rather than Greenhouse.
    check("application detail shows the fill record", await page.isVisible("text=filled by the extension on"));

    // ---------- Lever look-alike ----------
    const lv = await context.newPage();
    watch(lv, "lever");
    await lv.goto(`${FXBASE}/lever.html`, { waitUntil: "networkidle" });
    await popup.goto(popupUrl(`${FXBASE}/lever.html`));
    await popup.waitForSelector("text=Fill this application", { timeout: 30000 });
    await popup.click("text=Fill this application");
    await popup.waitForSelector("text=Filled", { timeout: 60000 });
    await lv.waitForTimeout(300);
    await lv.screenshot({ path: shot("ext-lever-filled.png"), fullPage: true });
    const lvv = (sel) => lv.$eval(sel, (el) => el.value);
    check("Lever: full name, current company and location filled", (await lvv('input[name="name"]')) === "Maria Rodriguez" && (await lvv('input[name="org"]')).length > 2 && (await lvv('input[name="location"]')).length > 2, `${await lvv('input[name="org"]')} · ${await lvv('input[name="location"]')}`);
    check("Lever: cover letter typed into the additional information box", (await lvv('textarea[name="comments"]')).length > 200);
    check("Lever: resume attached through the hidden input", (await lv.$eval('input[name="resume"]', (el) => el.files.length)) === 1);
    const lvFlags = await lv.$$eval(".orvenic-badge--flag", (els) => els.map((e) => e.textContent));
    check("Lever: criminal record and age questions flagged, pronouns and GitHub untouched", lvFlags.length === 2 && (await lvv('select[name="pronouns"]')) === "" && (await lvv('input[name="urls[GitHub]"]')) === "", lvFlags.join(" | "));
    check("Lever: nothing submitted", (await lv.evaluate(() => window.__submitted)) === false);

    // ---------- Workday look-alike ----------
    const wd = await context.newPage();
    watch(wd, "workday");
    await wd.goto(`${FXBASE}/workday.html`, { waitUntil: "networkidle" });
    await popup.goto(popupUrl(`${FXBASE}/workday.html`));
    await popup.waitForSelector("text=Fill this application", { timeout: 30000 });
    await popup.click("text=Fill this application");
    await popup.waitForSelector("text=Filled", { timeout: 60000 });
    await wd.waitForTimeout(300);
    await wd.screenshot({ path: shot("ext-workday-filled.png"), fullPage: true });
    const wdv = (sel) => wd.$eval(sel, (el) => el.value);
    check("Workday: names, email and city filled from data-automation-id fields", (await wdv("#name--legalName--firstName")) === "Maria" && (await wdv("#name--legalName--lastName")) === "Rodriguez" && (await wdv("#email")).includes("@") && (await wdv("#address--city")).length > 2);
    check("Workday: state and country selects chosen by full name", (await wdv("#address--region")) === "Ontario" && (await wdv("#country")) === "United States of America", `${await wdv("#address--region")} · ${await wdv("#country")}`);
    check("Workday: resume attached to the hidden upload input", (await wd.$eval('[data-automation-id="file-upload-input-ref"]', (el) => el.files.length)) === 1);
    const wdFlags = await wd.$$eval(".orvenic-badge--flag", (els) => els.map((e) => e.textContent));
    check("Workday: work authorization, veteran status and date of birth flagged", wdFlags.length === 3 && (await wd.$$eval('input[type="radio"]', (els) => els.every((e) => !e.checked))) && (await wdv("#dob")) === "", wdFlags.join(" | "));

    // ---------- mark as applied from the popup ----------
    await popup.click("text=I submitted it");
    await popup.waitForSelector("text=Marked as applied.", { timeout: 20000 });
    await page.goto(BASE + "/app/applications", { waitUntil: "networkidle" });
    await page.waitForSelector(".app-row", { timeout: 20000 });
    check("applied from the popup shows on the tracker", await page.isVisible("text=Applied"));

    // ---------- revoke ----------
    await page.goto(BASE + "/app/extension", { waitUntil: "networkidle" });
    await page.waitForSelector("table.app-table tbody tr", { timeout: 20000 });
    await page.click("table.app-table >> text=Disconnect");
    await page.waitForSelector("text=No browser is connected yet.", { timeout: 20000 });
    await popup.goto(popupUrl(`${FXBASE}/greenhouse.html`));
    await popup.waitForSelector("text=Connect this browser", { timeout: 20000 });
    check("revoked key sends the popup back to the connect screen", await popup.isVisible("text=no longer connected"));
    await popup.screenshot({ path: shot("ext-popup-disconnected.png") });

    check("no runtime errors", errors.length === 0, errors.slice(0, 3).join(" | "));
  } catch (e) {
    console.error("script error:", e);
    results.push({ name: "script", ok: false });
    console.log("--- server log tail ---\n" + serverLog.slice(-3000));
  } finally {
    await context.close().catch(() => undefined);
    fixtures.close();
    try {
      if (process.platform === "win32") server.kill();
      else process.kill(-server.pid, "SIGTERM");
    } catch {
      try { server.kill(); } catch {}
    }
    fs.rmSync(userDataDir, { recursive: true, force: true });
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  process.exit(failed.length ? 1 : 0);
})();
