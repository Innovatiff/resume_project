/* ------------------------------------------------------------------
   The popup. One screen per situation: connect, no pass, a job page
   to score, a form to fill, the result of a fill. Talks only to the
   background worker.
------------------------------------------------------------------- */

import type { ExtensionApplication, ExtensionMe, Verdict } from "@/lib/app/types";
import { ATS_LABEL } from "@/lib/extension/ats";
import type { ApplicationsReply, BgRequest, FillReply, FillSummary, MeReply, PageInfo, PageReply, ScoreReply, StateReply, StoredState } from "../lib/messages";

const app = document.getElementById("app") as HTMLElement;
const DEFAULT_SITE = "https://orvenic.com";

type Attrs = Record<string, string | boolean | ((e: Event) => void) | undefined>;
type Child = Node | string | null | undefined | false;

function h(tag: string, attrs: Attrs = {}, ...children: Child[]): HTMLElement {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (typeof v === "function") el.addEventListener(k.replace(/^on/, "").toLowerCase(), v);
    else if (v === true) el.setAttribute(k, "");
    else el.setAttribute(k, v);
  }
  for (const c of children) {
    if (c == null || c === false) continue;
    el.append(typeof c === "string" ? document.createTextNode(c) : c);
  }
  return el;
}

function bg<T>(msg: BgRequest): Promise<T> {
  return chrome.runtime.sendMessage(msg) as Promise<T>;
}

async function must<T extends { ok: boolean }>(p: Promise<T>): Promise<Extract<T, { ok: true }>> {
  const r = await p;
  if (!r || r.ok === false) {
    const f = r as { error?: string; code?: string } | undefined;
    const err = new Error(f?.error ?? "Something went wrong.") as Error & { code?: string };
    err.code = f?.code;
    throw err;
  }
  return r as Extract<T, { ok: true }>;
}

function render(...nodes: Child[]): void {
  app.replaceChildren();
  for (const n of nodes) if (n) app.append(typeof n === "string" ? document.createTextNode(n) : n);
}

/* ---------- pieces ---------- */

const MARK = '<svg viewBox="0 0 64 64" width="26" height="26" aria-hidden="true"><rect width="64" height="64" rx="18" fill="#0d0d10"/><circle cx="32" cy="32" r="17" stroke="#8b5cf6" stroke-width="6.5" fill="none"/><path d="M30 37.5l9 8.5L56 26" stroke="#0d0d10" stroke-width="13" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M30 37.5l9 8.5L56 26" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>';

function header(sub?: string): HTMLElement {
  const mark = h("span", { class: "mark" });
  mark.innerHTML = MARK;
  return h("header", { class: "head" }, mark, h("div", {}, h("b", {}, "Orvenic"), sub ? h("span", { class: "sub" }, sub) : null));
}

function ring(score: number, verdict: Verdict): HTMLElement {
  const color = verdict === "apply" ? "#22b573" : verdict === "borderline" ? "#f6c52e" : "#ef4f42";
  const r = 26;
  const c = 2 * Math.PI * r;
  const wrap = h("div", { class: "ring" });
  wrap.innerHTML = `<svg viewBox="0 0 64 64" width="64" height="64"><circle cx="32" cy="32" r="${r}" stroke="#ededf1" stroke-width="7" fill="none"/><circle cx="32" cy="32" r="${r}" stroke="${color}" stroke-width="7" fill="none" stroke-linecap="round" stroke-dasharray="${(c * Math.max(0, Math.min(100, score))) / 100} ${c}" transform="rotate(-90 32 32)"/><text x="32" y="37" text-anchor="middle" font-size="18" font-weight="700" fill="#0d0d10">${Math.round(score)}</text></svg>`;
  return wrap;
}

function chip(verdict: Verdict): HTMLElement {
  const label = verdict === "apply" ? "Apply" : verdict === "borderline" ? "Borderline" : "Skip";
  return h("span", { class: `chip chip--${verdict}` }, label);
}

const STATUS: Record<string, string> = { scored: "Scored", needs_input: "Needs your answers", building: "Building", ready: "Package ready", applied: "Applied", interview: "Interview", offer: "Offer", rejected: "Rejected", archived: "Archived" };

function payLine(a: ExtensionApplication): string | null {
  const p = a.pay;
  if (!p || p.low == null || p.high == null) return null;
  const f = (n: number) => Math.round(n).toLocaleString("en-CA");
  return `${p.currency.toUpperCase()} ${f(p.low)} to ${f(p.high)}${p.median != null ? `, median ${f(p.median)}` : ""}`;
}

function notice(text: string, kind: "error" | "info" | "success" = "info"): HTMLElement {
  return h("div", { class: `notice notice--${kind}` }, text);
}

function footer(state: StoredState | undefined, me?: ExtensionMe): HTMLElement {
  const site = me?.siteUrl || state?.baseUrl || DEFAULT_SITE;
  return h(
    "footer",
    { class: "foot" },
    h("span", {}, "Never submits for you."),
    h("span", { class: "links" }, h("a", { href: `${site}/app`, target: "_blank", rel: "noreferrer" }, "Dashboard"), state?.key ? h("a", { href: "#", onClick: (e) => void disconnect(e) }, "Disconnect") : null),
  );
}

async function disconnect(e: Event): Promise<void> {
  e.preventDefault();
  await bg({ type: "disconnect" });
  void main();
}

/* ---------- screens ---------- */

function connectScreen(state: StoredState | undefined, message?: string): void {
  const site = state?.baseUrl || DEFAULT_SITE;
  const code = h("input", { class: "input", placeholder: "Paste a connection code (ovx_…)", spellcheck: "false", autocomplete: "off" }) as HTMLInputElement;
  const url = h("input", { class: "input input--small", value: site, spellcheck: "false" }) as HTMLInputElement;
  const status = h("div", {});
  const submit = async () => {
    status.replaceChildren(notice("Connecting…"));
    try {
      const r = await must(bg<MeReply>({ type: "connect", key: code.value.trim(), baseUrl: url.value.trim() }));
      status.replaceChildren(notice(`Connected as ${r.me.email}.`, "success"));
      setTimeout(() => void main(), 500);
    } catch (err) {
      status.replaceChildren(notice((err as Error).message, "error"));
    }
  };
  render(
    header("Connect this browser"),
    message ? notice(message, "error") : null,
    h("section", { class: "card" }, h("p", { class: "lead" }, "Open the Extension page in your Orvenic account and click Connect this browser. This popup updates by itself."), h("a", { class: "btn btn--coral", href: `${site}/app/extension`, target: "_blank", rel: "noreferrer" }, "Open the Extension page")),
    h("details", { class: "card card--soft" }, h("summary", {}, "Or paste a connection code"), h("div", { class: "stack" }, code, h("label", { class: "small" }, "Site", url), h("button", { class: "btn btn--ink", onClick: () => void submit() }, "Connect"), status)),
    footer(state),
  );
}

function noPassScreen(state: StoredState, me: ExtensionMe): void {
  render(
    header(me.email),
    h("section", { class: "card" }, h("h2", {}, "The extension comes with the 30-Day Pass and Landed."), h("p", { class: "lead" }, "Your account is connected. Once a pass is active, this popup scores postings from the page and fills application forms for your review."), h("a", { class: "btn btn--coral", href: `${me.siteUrl}/checkout?plan=pass`, target: "_blank", rel: "noreferrer" }, "See the passes")),
    footer(state, me),
  );
}

/** A field label as shown in the summary: no required-mark, no site noise, one line. */
function tidy(label: string): string {
  const t = label.replace(/\s*[*✱]+\s*$/, "").replace(/\s+/g, " ").trim();
  return t.length > 90 ? `${t.slice(0, 87)}…` : t;
}

function summaryScreen(ctx: Ctx, a: ExtensionApplication, s: FillSummary): void {
  const items: HTMLElement[] = [];
  const li = (text: string, cls = "") => items.push(h("li", { class: cls }, h("i"), h("span", {}, text)));
  if (s.attachedResume) li("Tailored resume attached");
  if (s.attachedCover) li("Cover letter attached");
  if (s.coverLetterTyped) li("Cover letter typed in");
  for (const f of s.filled.filter((x) => x.kind !== "resume" && x.kind !== "cover_letter")) li(tidy(f.label), "");
  for (const f of s.flagged) li(`${tidy(f.label)}: ${f.reason}`, "flag");
  if (s.hinted) li("Pay report shown beside the salary ask", "hint");
  if (s.skipped) li(`${s.skipped} field${s.skipped === 1 ? "" : "s"} left for you`, "muted");
  render(
    header(ctx.me.email),
    h(
      "section",
      { class: "card" },
      h("h2", {}, s.formFound ? `Filled ${s.filled.length} field${s.filled.length === 1 ? "" : "s"} on ${ATS_LABEL[s.ats]}` : "No application form on this page"),
      h("ul", { class: "list" }, ...items),
      h("p", { class: "small" }, "Review every field, then use the site's own submit button. Orvenic never submits for you."),
      h("div", { class: "row" }, h("button", { class: "btn btn--ghost", onClick: () => void undoFill(ctx) }, "Undo"), a.status === "applied" ? null : h("button", { class: "btn btn--ink", onClick: () => void markApplied(ctx, a) }, "I submitted it")),
    ),
    footer(ctx.state, ctx.me),
  );
}

async function undoFill(ctx: Ctx): Promise<void> {
  if (ctx.tabId != null) await bg({ type: "undo", tabId: ctx.tabId, frameId: ctx.page?.formFrameId }).catch(() => undefined);
  void main();
}

async function markApplied(ctx: Ctx, a: ExtensionApplication): Promise<void> {
  try {
    await must(bg<{ ok: boolean }>({ type: "applied", applicationId: a.id }));
    render(header(ctx.me.email), h("section", { class: "card" }, h("h2", {}, "Marked as applied."), h("p", { class: "lead" }, "It is on your tracker. Good luck."), h("a", { class: "btn btn--ink", href: `${ctx.me.siteUrl}/app/applications/${a.id}`, target: "_blank", rel: "noreferrer" }, "Open in Orvenic")), footer(ctx.state, ctx.me));
  } catch (err) {
    render(header(ctx.me.email), notice((err as Error).message, "error"), footer(ctx.state, ctx.me));
  }
}

interface Ctx {
  state: StoredState;
  me: ExtensionMe;
  tabId?: number;
  tabUrl?: string;
  page: PageInfo | null;
  apps: ExtensionApplication[];
  matchId: string | null;
}

function appCard(ctx: Ctx, a: ExtensionApplication, opts: { fresh?: boolean } = {}): HTMLElement {
  const hasForm = Boolean(ctx.page && (ctx.page.inputs > 0 || ctx.page.formFrameId != null));
  const pay = payLine(a);
  const actions: HTMLElement[] = [];
  if (a.hasPackage && hasForm && ctx.tabId != null) actions.push(h("button", { class: "btn btn--coral", onClick: () => void runFill(ctx, a) }, "Fill this application"));
  else if (a.hasPackage) actions.push(h("p", { class: "small" }, "Open the application form on this site, then come back here to fill it."));
  else actions.push(h("a", { class: "btn btn--coral", href: `${ctx.me.siteUrl}/app/applications/${a.id}`, target: "_blank", rel: "noreferrer" }, a.status === "needs_input" ? "Answer the metric interview" : "Build the package"));
  actions.push(h("a", { class: "btn btn--ghost", href: `${ctx.me.siteUrl}/app/applications/${a.id}`, target: "_blank", rel: "noreferrer" }, "Open in Orvenic"));
  return h(
    "section",
    { class: "card" },
    opts.fresh ? h("div", { class: "eyebrow" }, "Scored just now") : h("div", { class: "eyebrow" }, "This posting is on your shortlist"),
    h("div", { class: "verdict" }, ring(a.hasPackage && a.scoreAfter != null ? a.scoreAfter : a.score, a.verdict), h("div", { class: "verdict__copy" }, h("b", {}, a.title), h("span", { class: "sub" }, [a.company, a.location].filter(Boolean).join(" · ")), h("div", { class: "chips" }, chip(a.verdict), h("span", { class: "status" }, STATUS[a.status] ?? a.status), a.hasPackage && a.scoreAfter != null ? h("span", { class: "status" }, `${a.score} before rewrite`) : null))),
    a.reasons.length && !a.hasPackage ? h("ol", { class: "reasons" }, ...a.reasons.map((r) => h("li", {}, r))) : null,
    pay ? h("p", { class: "pay" }, h("b", {}, "Pay report "), pay) : null,
    a.redFlags ? h("p", { class: "small" }, `${a.redFlags} red flag${a.redFlags === 1 ? "" : "s"} on this posting. See them in Orvenic.`) : null,
    h("div", { class: "stack" }, ...actions),
  );
}

async function runFill(ctx: Ctx, a: ExtensionApplication): Promise<void> {
  render(header(ctx.me.email), h("section", { class: "card" }, h("div", { class: "spinner" }), h("p", { class: "lead" }, "Filling the form from your package…")), footer(ctx.state, ctx.me));
  try {
    const r = await must(bg<FillReply>({ type: "fill", tabId: ctx.tabId!, frameId: ctx.page?.formFrameId, applicationId: a.id }));
    summaryScreen(ctx, a, r.summary);
  } catch (err) {
    render(header(ctx.me.email), notice((err as Error).message, "error"), h("button", { class: "btn btn--ghost", onClick: () => void main() }, "Back"), footer(ctx.state, ctx.me));
  }
}

async function runScore(ctx: Ctx): Promise<void> {
  render(header(ctx.me.email), h("section", { class: "card" }, h("div", { class: "spinner" }), h("p", { class: "lead" }, "Reading the posting and scoring it against your resume…"), h("p", { class: "small" }, "Verdict, pay report and red flags, same as the app.")), footer(ctx.state, ctx.me));
  try {
    const r = await must(bg<ScoreReply>({ type: "score", tabId: ctx.tabId! }));
    const next: Ctx = { ...ctx, apps: [r.application, ...ctx.apps], matchId: r.application.id };
    render(header(ctx.me.email), appCard(next, r.application, { fresh: true }), footer(ctx.state, ctx.me));
  } catch (err) {
    render(header(ctx.me.email), notice((err as Error).message, "error"), h("button", { class: "btn btn--ghost", onClick: () => void main() }, "Back"), footer(ctx.state, ctx.me));
  }
}

function mainScreen(ctx: Ctx): void {
  const matched = ctx.matchId ? ctx.apps.find((a) => a.id === ctx.matchId) : undefined;
  const hasForm = Boolean(ctx.page && (ctx.page.inputs > 0 || ctx.page.formFrameId != null));
  const canScore = Boolean(ctx.page && ctx.page.postingChars >= 300 && ctx.tabId != null);
  const parts: Child[] = [header(ctx.me.email)];

  if (!ctx.me.hasProfile) parts.push(notice("Upload your resume in Orvenic first; every score and every fill starts from it.", "info"));

  if (matched) parts.push(appCard(ctx, matched));
  else if (canScore) {
    parts.push(
      h(
        "section",
        { class: "card" },
        h("div", { class: "eyebrow" }, ctx.page?.ats && ctx.page.ats !== "other" ? `${ATS_LABEL[ctx.page.ats]} posting` : "Job posting"),
        h("b", { class: "title" }, ctx.page?.title || "This page"),
        h("p", { class: "lead" }, "Score it against your resume before you spend the evening on it."),
        h("button", { class: "btn btn--coral", onClick: () => void runScore(ctx) }, "Score this posting"),
      ),
    );
  } else parts.push(h("section", { class: "card card--soft" }, h("p", { class: "lead" }, "Open a job posting to score it, or an application form to fill it from your package.")));

  // A form with no matched posting: the candidate picks which package to fill from.
  const ready = ctx.apps.filter((a) => a.hasPackage);
  if (!matched && hasForm && ready.length && ctx.tabId != null) {
    const select = h("select", { class: "input" }, ...ready.map((a) => h("option", { value: a.id }, `${a.title}${a.company ? ` · ${a.company}` : ""}`))) as HTMLSelectElement;
    parts.push(h("section", { class: "card" }, h("div", { class: "eyebrow" }, "Application form on this page"), h("label", { class: "small" }, "Fill it from", select), h("button", { class: "btn btn--ink", onClick: () => void runFill(ctx, ready.find((a) => a.id === select.value)!) }, "Fill this form")));
  }

  if (ctx.apps.length && !matched) {
    parts.push(
      h(
        "section",
        { class: "card card--soft" },
        h("div", { class: "eyebrow" }, "Recent"),
        h("ul", { class: "recent" }, ...ctx.apps.slice(0, 4).map((a) => h("li", {}, h("a", { href: `${ctx.me.siteUrl}/app/applications/${a.id}`, target: "_blank", rel: "noreferrer" }, a.title), h("span", { class: `dot dot--${a.verdict}` }), h("span", { class: "muted" }, `${a.score} · ${STATUS[a.status] ?? a.status}`)))),
      ),
    );
  }
  parts.push(footer(ctx.state, ctx.me));
  render(...parts);
}

/* ---------- which tab ---------- */

async function targetTab(): Promise<{ id?: number; url?: string; title?: string }> {
  const override = new URLSearchParams(location.search).get("url");
  if (override) {
    const tabs = await chrome.tabs.query({ url: `${override}*` }).catch(() => []);
    if (tabs[0]) return { id: tabs[0].id, url: tabs[0].url, title: tabs[0].title };
  }
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab ? { id: tab.id, url: tab.url, title: tab.title } : {};
}

async function main(): Promise<void> {
  render(h("div", { class: "spinner" }));
  const { state } = await must(bg<StateReply>({ type: "state" }));
  if (!state.key) return connectScreen(state);
  let me: ExtensionMe;
  try {
    me = (await must(bg<MeReply>({ type: "me" }))).me;
  } catch (err) {
    const e = err as Error & { code?: string };
    if (e.code === "invalid_key" || e.code === "invalid_token") return connectScreen(state, e.message);
    return render(header(), notice(e.message, "error"), footer(state));
  }
  if (!me.extension) return noPassScreen(state, me);

  const tab = await targetTab();
  let page: PageInfo | null = null;
  if (tab.id != null && tab.url && /^https?:/.test(tab.url)) {
    page = await bg<PageReply>({ type: "page", tabId: tab.id })
      .then((r) => (r.ok ? r.page : null))
      .catch(() => null);
  }
  const url = page?.url ?? tab.url;
  const title = page?.title ?? tab.title;
  let apps: ExtensionApplication[] = [];
  let matchId: string | null = null;
  try {
    const r = await must(bg<ApplicationsReply>({ type: "applications", url, title }));
    apps = r.applications;
    matchId = r.match?.id ?? null;
  } catch (err) {
    return render(header(me.email), notice((err as Error).message, "error"), footer(state, me));
  }
  mainScreen({ state, me, tabId: tab.id, tabUrl: tab.url, page, apps, matchId });
}

void main();
