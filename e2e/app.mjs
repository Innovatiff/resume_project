/*
  End-to-end check of the whole product against the Firebase emulators, the deterministic mock AI
  and the development checkout. Starts its own `next dev` on E2E_PORT (default 3131).

    npm run emulators      # in another terminal
    npm run e2e

  Browser: the Playwright-managed Chromium (`npx playwright install chromium`), or set
  E2E_CHROMIUM=/path/to/chrome, or E2E_CHANNEL=chrome to use the Chrome already on the machine.
  Screenshots land in e2e/output/.
*/
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const OUT = path.join(HERE, "output");
const FX = path.join(HERE, "fixtures");
const PORT = Number(process.env.E2E_PORT || 3131);
const BASE = `http://localhost:${PORT}`;
const AUTH_EMULATOR = process.env.FIREBASE_AUTH_EMULATOR_HOST || "localhost:9099";
const FIRESTORE_EMULATOR = process.env.FIRESTORE_EMULATOR_HOST || "localhost:8080";

fs.mkdirSync(OUT, { recursive: true });
const shot = (name) => path.join(OUT, name);
const results = [];
const check = (name, ok, extra = "") => {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? "  — " + extra : ""}`);
};
const reachable = (url) =>
  new Promise((res) => http.get(url, (r) => { r.resume(); res(true); }).on("error", () => res(false)));
const waitFor = async (url, tries = 240) => {
  for (let i = 0; i < tries; i++) {
    if (await reachable(url)) return;
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`server did not answer at ${url}`);
};
const launchOptions = process.env.E2E_CHROMIUM
  ? { executablePath: process.env.E2E_CHROMIUM }
  : process.env.E2E_CHANNEL
    ? { channel: process.env.E2E_CHANNEL }
    : {};

const posting = fs.readFileSync(path.join(FX, "posting.txt"), "utf8");
const postingUs = fs.readFileSync(path.join(FX, "posting-us.txt"), "utf8");
const email = `maria+${Date.now()}@example.com`;
const password = "correct-horse-battery";

(async () => {
  if (!(await reachable(`http://${AUTH_EMULATOR}/`)) || !(await reachable(`http://${FIRESTORE_EMULATOR}/`))) {
    console.error(`Firebase emulators are not running on ${AUTH_EMULATOR} / ${FIRESTORE_EMULATOR}. Start them with: npm run emulators`);
    process.exit(2);
  }

  const env = {
    ...process.env,
    PORT: String(PORT),
    NEXT_PUBLIC_SITE_URL: BASE,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: "demo-shortlist",
    NEXT_PUBLIC_FIREBASE_USE_EMULATOR: "1",
    FIREBASE_PROJECT_ID: "demo-shortlist",
    FIRESTORE_EMULATOR_HOST: FIRESTORE_EMULATOR,
    FIREBASE_AUTH_EMULATOR_HOST: AUTH_EMULATOR,
    SHORTLIST_AI_MOCK: "1",
    SHORTLIST_DEV_CHECKOUT: "1",
    FREE_SCAN_SALT: "e2e",
  };
  // Mock AI and the dev checkout are disabled under NODE_ENV=production by design, so this runs `next dev`.
  delete env.NODE_ENV;
  const nextBin = path.join(ROOT, "node_modules", "next", "dist", "bin", "next");
  const server = spawn(process.execPath, [nextBin, "dev", "-p", String(PORT)], {
    cwd: ROOT,
    env,
    stdio: ["ignore", "pipe", "pipe"],
    detached: process.platform !== "win32",
  });
  let serverLog = "";
  server.stdout.on("data", (d) => (serverLog += d));
  server.stderr.on("data", (d) => (serverLog += d));

  let browser;
  try {
    browser = await chromium.launch(launchOptions);
  } catch (e) {
    console.error("Could not start Chromium:", e.message.split("\n")[0]);
    console.error("Run `npx playwright install chromium`, or set E2E_CHROMIUM / E2E_CHANNEL (see the header of this file).");
    try { process.kill(server.pid); } catch {}
    process.exit(2);
  }
  const errors = [];

  try {
    await waitFor(BASE + "/api/health");
    const health = await fetch(BASE + "/api/health").then((r) => r.json());
    check("health reports mock AI, dev billing, emulator", health.ai === "mock" && health.billing === "dev" && health.firebase === "emulator", JSON.stringify(health));

    // ---------- Free scan via API (two-column PDF) ----------
    const fd = new FormData();
    fd.set("file", new Blob([fs.readFileSync(path.join(FX, "maria-resume-two-column.pdf"))], { type: "application/pdf" }), "maria-resume-two-column.pdf");
    fd.set("posting", posting);
    fd.set("email", `free+${Date.now()}@example.com`);
    const scanRes = await fetch(BASE + "/api/scan", { method: "POST", body: fd });
    const scan = await scanRes.json();
    check("free scan returns a scored result", scanRes.status === 200 && scan.ok && typeof scan.result?.score?.score === "number", `score=${scan.result?.score?.score} verdict=${scan.result?.score?.verdict}`);
    check("two-column PDF is flagged in the free scan", scan.result?.layout?.multiColumn === true && scan.result?.score?.reasons.some((r) => /two-column/i.test(r)));
    const again = await fetch(BASE + "/api/scan", { method: "POST", body: fd });
    check("second free scan within 7 days is rate limited", again.status === 429);
    const stored = await fetch(BASE + `/api/scan/${scan.result.id}`).then((r) => r.json());
    check("free scan result is retrievable by id", stored.ok && stored.result.id === scan.result.id);

    // ---------- Browser: sign up ----------
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
    const page = await ctx.newPage();
    page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
    page.on("console", (m) => { if (m.type() === "error" && !/favicon|401|402|429/.test(m.text())) errors.push("console: " + m.text()); });

    await page.goto(BASE + "/sign-up?next=%2Fcheckout%3Fplan%3Dpass", { waitUntil: "networkidle" });
    await page.fill("#name", "Maria Rodriguez");
    await page.fill("#email", email);
    await page.fill("#password", password);
    await page.screenshot({ path: shot("app-signup.png") });
    await page.click('button[type="submit"]');
    await page.waitForURL("**/checkout?plan=pass", { timeout: 20000 });
    await page.waitForSelector("text=Get 30-Day Pass", { timeout: 20000 });
    check("sign-up lands on checkout with the account", page.url().includes("/checkout?plan=pass"));
    await page.screenshot({ path: shot("app-checkout.png") });

    // ---------- Dev checkout ----------
    await page.click("text=Get 30-Day Pass");
    await page.waitForURL("**/checkout/success**", { timeout: 20000 });
    await page.waitForSelector("text=You're set.", { timeout: 20000 });
    check("dev checkout grants the pass and shows success", true);
    await page.screenshot({ path: shot("app-success.png") });

    // ---------- Dashboard ----------
    await page.goto(BASE + "/app", { waitUntil: "networkidle" });
    await page.waitForSelector("text=30-Day Pass", { timeout: 20000 });
    await page.waitForTimeout(800);
    await page.screenshot({ path: shot("app-dashboard.png") });
    check("dashboard shows the active pass", await page.isVisible("text=Unlimited postings until"));

    // ---------- Profile upload (DOCX) ----------
    await page.goto(BASE + "/app/profile", { waitUntil: "networkidle" });
    await page.setInputFiles('input[type="file"]', path.join(FX, "maria-resume.docx"));
    await page.click("text=Upload and extract");
    await page.waitForSelector("text=Profile updated", { timeout: 60000 });
    await page.waitForTimeout(600);
    check("resume upload extracts a profile", await page.isVisible("text=Inventory Lead"));
    await page.screenshot({ path: shot("app-profile.png"), fullPage: true });

    // ---------- New application ----------
    await page.goto(BASE + "/app/applications/new", { waitUntil: "networkidle" });
    await page.fill("#posting", posting);
    await page.screenshot({ path: shot("app-new.png") });
    await page.click("text=Score this posting");
    await page.waitForURL(/\/app\/applications\/[0-9a-f-]{36}$/, { timeout: 90000 });
    await page.waitForSelector("text=Score breakdown", { timeout: 30000 });
    await page.waitForTimeout(800);
    const appUrl = page.url();
    const scoreText = await page.textContent(".app-ring__value");
    check("application scored with a verdict page", /^\d+$/.test((scoreText || "").trim()), `score=${scoreText}`);
    await page.screenshot({ path: shot("app-detail-scored.png"), fullPage: true });
    check("pay report and red flags rendered", (await page.isVisible("text=Pay report")) && (await page.isVisible("text=Red flags")));

    // ---------- Build package -> metric interview ----------
    const build = page.locator("text=Build my package");
    if (await page.isVisible("text=Long-shot strategy off.")) await page.click(".app-switch input");
    await build.click();
    await page.waitForSelector("text=The metric interview", { timeout: 90000 });
    check("pass triggers the metric interview", true);
    await page.screenshot({ path: shot("app-interview.png"), fullPage: true });
    const inputs = page.locator(".app-qa__item input");
    const n = await inputs.count();
    for (let i = 0; i < n; i++) await inputs.nth(i).fill(i === 0 ? "about 120 orders a day" : "");
    await page.click("text=Use these answers");
    await page.waitForSelector("text=Your package", { timeout: 120000 });
    await page.waitForTimeout(800);
    check("package built with resume preview", await page.isVisible(".app-resume"));
    check("every figure verified against the source", await page.isVisible("text=Every figure verified"));
    check("after-rewrite score shown", await page.isVisible("text=after rewrite"));
    await page.screenshot({ path: shot("app-detail-ready.png"), fullPage: true });

    // ---------- Downloads ----------
    const [dl] = await Promise.all([page.waitForEvent("download", { timeout: 30000 }), page.click("text=Download .docx")]);
    const docxPath = await dl.path();
    check("resume .docx downloads", !!docxPath && fs.statSync(docxPath).size > 2000, dl.suggestedFilename());
    const [dl2] = await Promise.all([page.waitForEvent("download", { timeout: 30000 }), page.click("text=Download PDF")]);
    const pdfPath = await dl2.path();
    check("resume PDF downloads", !!pdfPath && fs.readFileSync(pdfPath).slice(0, 4).toString() === "%PDF", dl2.suggestedFilename());
    await page.click("text=Cover letter");
    await page.waitForTimeout(300);
    check("cover letter tab renders", await page.isVisible(".app-prose"));
    await page.click("text=Interview prep");
    await page.waitForTimeout(300);
    check("interview prep tab renders", (await page.locator(".app-qa__item").count()) > 3);

    // ---------- Status + list ----------
    await page.selectOption('select[aria-label="Application status"]', "applied");
    await page.waitForTimeout(600);
    await page.goto(BASE + "/app/applications", { waitUntil: "networkidle" });
    await page.waitForSelector(".app-row", { timeout: 20000 });
    check("applications list shows the application as applied", await page.isVisible("text=Applied"));
    await page.screenshot({ path: shot("app-list.png") });

    // ---------- Account ----------
    await page.goto(BASE + "/app/account", { waitUntil: "networkidle" });
    await page.waitForSelector("text=Purchases", { timeout: 20000 });
    await page.waitForTimeout(500);
    check("account lists the purchase", await page.isVisible("table.app-table >> text=30-Day Pass"));
    await page.screenshot({ path: shot("app-account.png"), fullPage: true });
    // Playwright's browser sends Accept-Language en-US, so the account's home market defaults to the United States.
    check("browser locale sets the default market and currency", await page.isVisible("text=All prices USD, one-time."));

    // ---------- Markets: switch the account to Canada, score a US posting ----------
    await page.goto(BASE + "/app/profile", { waitUntil: "networkidle" });
    await page.selectOption("#country", "CA");
    await page.click("text=Save preferences");
    await page.waitForSelector("text=Preferences saved", { timeout: 20000 });
    check("profile country select shows the province label", await page.isVisible("text=Province"));
    await page.goto(BASE + "/app/account", { waitUntil: "networkidle" });
    await page.waitForSelector("text=Purchases", { timeout: 20000 });
    check("account prices follow the chosen market", (await page.isVisible("text=All prices CAD, one-time.")) && (await page.isVisible("text=CAD, one-time")));
    await page.goto(BASE + "/app/applications/new", { waitUntil: "networkidle" });
    await page.fill("#posting", postingUs);
    await page.click("text=Score this posting");
    await page.waitForURL(/\/app\/applications\/[0-9a-f-]{36}$/, { timeout: 90000 });
    await page.waitForSelector("text=Score breakdown", { timeout: 30000 });
    await page.waitForTimeout(500);
    check("US posting gets a pay report in USD", (await page.isVisible("text=· USD")) && (await page.isVisible("text=Legally entitled to work in the United States")));
    await page.screenshot({ path: shot("app-detail-us.png"), fullPage: true });

    // ---------- Marketing navbar follows the session ----------
    await page.goto(BASE + "/pricing", { waitUntil: "networkidle" });
    const dashLink = await page.waitForSelector('nav[aria-label="Primary"] a[href="/app"]', { timeout: 15000 }).catch(() => null);
    check("marketing navbar shows Dashboard when signed in", !!dashLink);

    // ---------- Phone ----------
    const mctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const m = await mctx.newPage();
    await m.goto(BASE + "/sign-in", { waitUntil: "networkidle" });
    await m.fill("#email", email);
    await m.fill("#password", password);
    await m.click('button[type="submit"]');
    await m.waitForURL("**/app", { timeout: 20000 });
    await m.waitForSelector("text=Recent applications", { timeout: 20000 });
    await m.waitForTimeout(800);
    await m.screenshot({ path: shot("app-m-dashboard.png") });
    check("mobile app shell renders bottom tabs", await m.isVisible(".app-tabs"));
    await m.goto(appUrl, { waitUntil: "networkidle" });
    await m.waitForSelector("text=Your package", { timeout: 20000 });
    await m.waitForTimeout(600);
    await m.screenshot({ path: shot("app-m-detail.png"), fullPage: true });
    await m.goto(BASE + "/app/applications/new", { waitUntil: "networkidle" });
    await m.waitForTimeout(600);
    await m.screenshot({ path: shot("app-m-new.png") });
    await m.goto(BASE + "/sign-in", { waitUntil: "networkidle" });
    await m.waitForTimeout(400);
    await m.screenshot({ path: shot("app-m-signin.png") });
    await mctx.close();

    // ---------- Free scan through the marketing form (phone) ----------
    const sctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const sp = await sctx.newPage();
    await sp.goto(BASE + "/scan", { waitUntil: "networkidle" });
    await sp.setInputFiles('#scan input[type="file"]', path.join(FX, "maria-resume.docx"));
    await sp.fill("#scan textarea", posting);
    await sp.fill('#scan input[type="email"]', `scanform+${Date.now()}@example.com`);
    await sp.click('#scan button[type="submit"]');
    await sp.waitForSelector("#scan-result", { timeout: 90000 });
    await sp.waitForTimeout(600);
    check("free scan form shows the result card", await sp.isVisible("#scan-result .app-ring__value"));
    await sp.screenshot({ path: shot("app-m-scan-result.png") });
    await sctx.close();

    // ---------- Delete account ----------
    await page.goto(BASE + "/app/account", { waitUntil: "networkidle" });
    await page.click("text=Delete my account and data");
    await page.click("text=Yes, delete everything");
    await page.waitForURL((u) => u.search.includes("deleted=1"), { timeout: 20000 });
    check("account deletion signs out and returns home", true);
    await ctx.close();

    check("no runtime errors", errors.length === 0, errors.slice(0, 3).join(" | "));
  } catch (e) {
    console.error("script error:", e);
    results.push({ name: "script", ok: false });
    console.log("--- server log tail ---\n" + serverLog.slice(-3000));
  } finally {
    await browser.close();
    try {
      if (process.platform === "win32") server.kill();
      else process.kill(-server.pid, "SIGTERM");
    } catch {
      try { server.kill(); } catch {}
    }
    const failed = results.filter((r) => !r.ok).length;
    console.log(`\n${results.length - failed}/${results.length} checks passed`);
    setTimeout(() => process.exit(failed ? 1 : 0), 300);
  }
})();
