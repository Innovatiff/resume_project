/* ------------------------------------------------------------------
   Runs on application pages. Reads the posting for scoring, fills the
   form from the package for the candidate's review, marks in red what
   they must answer themselves, and can undo everything it typed.

   It never clicks. There is no code path that touches a submit button.
------------------------------------------------------------------- */

import { classify, payHint, pickOption, valueFor, type Classification, type FieldMeta } from "@/lib/extension/fields";
import { ATS_LABEL, detectAts, POSTING_SELECTORS } from "@/lib/extension/ats";
import type { ExtensionFillData } from "@/lib/app/types";
import type { ContentRequest, FilePayload, FillSummary, PageInfo, ScrapeResult } from "../lib/messages";

type Control = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

interface Field {
  el: Control;
  type: string;
  label: string;
  cls: Classification;
  container: HTMLElement;
}

declare global {
  interface Window {
    __orvenicPage?: boolean;
  }
}

const MAX_POSTING = 20000;
const originals = new Map<Control, string | null>();
let marks: HTMLElement[] = [];
let panelHost: HTMLElement | null = null;

/* ---------- reading the page ---------- */

function cleanText(s: string): string {
  return s
    .replace(/\r/g, "")
    .split("\n")
    .map((l) => l.replace(/[ \t]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function postingText(): string {
  const ats = detectAts(location.href);
  for (const sel of [...POSTING_SELECTORS[ats], ...POSTING_SELECTORS.other]) {
    const el = document.querySelector<HTMLElement>(sel);
    const t = el ? cleanText(el.innerText || "") : "";
    if (t.length > 300) return t.slice(0, MAX_POSTING);
  }
  return cleanText(document.body?.innerText || "").slice(0, MAX_POSTING);
}

function pageTitle(): string {
  const h1 = document.querySelector<HTMLElement>("h1");
  const t = h1?.innerText?.trim();
  return (t && t.length < 160 ? t : document.title).trim();
}

function pageCompany(): string | undefined {
  const meta = document.querySelector<HTMLMetaElement>('meta[property="og:site_name"]')?.content?.trim();
  if (meta) return meta;
  const gh = document.querySelector<HTMLElement>(".company-name")?.innerText?.trim();
  if (gh) return gh.replace(/^at\s+/i, "");
  const lever = document.querySelector<HTMLImageElement>(".main-header-logo img")?.alt?.trim();
  if (lever) return lever.replace(/\s*logo$/i, "");
  const host = location.hostname;
  const wd = host.match(/^([a-z0-9-]+)\.wd\d+\.myworkday(?:jobs|site)\.com$/i);
  if (wd) return wd[1];
  return undefined;
}

function detect(): Omit<PageInfo, "formFrameId"> {
  return { url: location.href, title: pageTitle(), company: pageCompany(), ats: detectAts(location.href), inputs: collectFields().length, postingChars: postingText().length };
}

function scrape(): ScrapeResult {
  return { url: location.href, title: pageTitle(), company: pageCompany(), text: postingText() };
}

/* ---------- finding fields ---------- */

function isVisible(el: HTMLElement): boolean {
  if (el.offsetParent !== null) return true;
  const cs = getComputedStyle(el);
  return cs.position === "fixed" && cs.display !== "none" && cs.visibility !== "hidden";
}

/** Text of a node without the text of any controls inside it (a label wrapping a select would otherwise carry every option). */
function textOf(node: Element | null): string {
  if (!node) return "";
  const clone = node.cloneNode(true) as Element;
  clone.querySelectorAll("input, select, textarea, option, button, script, style, .orvenic-badge").forEach((n) => n.remove());
  return (clone.textContent || "").replace(/\s+/g, " ").trim();
}

function labelFor(el: Control, type: string): string {
  const parts: string[] = [];
  if (el.id) {
    try {
      parts.push(textOf(document.querySelector(`label[for="${CSS.escape(el.id)}"]`)));
    } catch {
      // an id that cannot be escaped is not a label anyone reads
    }
  }
  parts.push(textOf(el.closest("label")));
  const by = el.getAttribute("aria-labelledby");
  if (by) parts.push(by.split(/\s+/).map((id) => textOf(document.getElementById(id))).join(" "));
  parts.push(el.getAttribute("aria-label") || "");
  if (type === "radio" || type === "checkbox" || type === "select") {
    const fs = el.closest("fieldset");
    parts.push(textOf(fs?.querySelector("legend") ?? null));
    const group = el.closest("[role='group'], [role='radiogroup']");
    if (group) {
      const gby = group.getAttribute("aria-labelledby");
      parts.push(group.getAttribute("aria-label") || (gby ? gby.split(/\s+/).map((id) => textOf(document.getElementById(id))).join(" ") : ""));
    }
  }
  const auto = el.getAttribute("data-automation-id") || el.closest("[data-automation-id]")?.getAttribute("data-automation-id");
  if (auto) parts.push(auto.replace(/[-_]+/g, " "));
  let label = parts.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
  if (type === "radio" || type === "checkbox") {
    // A choice carries only its own option text ("Yes"); the question is the group's legend, or failing that
    // the block around the options.
    const group = el.closest("fieldset, [role='group'], [role='radiogroup']");
    const legend = textOf(group?.querySelector("legend") ?? null) || group?.getAttribute("aria-label") || "";
    const wrap = el.closest("label");
    const block = textOf((wrap?.parentElement ?? el).closest("div, li, p, td, section, fieldset"));
    label = legend || (block && block.length <= 200 ? block : label);
  } else if (!label) {
    // Text fields fall back to the nearest block when nothing named them, as long as it reads like one question.
    const t = textOf(el.closest("div, li, p, td, section"));
    if (t && t.length <= 200) label = t;
  }
  return label.replace(/\s+/g, " ").trim().slice(0, 240);
}

function containerFor(el: Control, type: string): HTMLElement {
  if (type === "radio" || type === "checkbox") {
    const group = el.closest<HTMLElement>("fieldset, [role='group'], [role='radiogroup']");
    if (group) return group;
  }
  return el.closest<HTMLElement>("fieldset, [data-automation-id*='formField'], .field, .form-group, .application-question, .application-field, li, div") ?? (el.parentElement as HTMLElement) ?? el;
}

function collectFields(): Field[] {
  const els = Array.from(document.querySelectorAll<Control>("input, textarea, select"));
  const groups = new Set<string>();
  const out: Field[] = [];
  for (const el of els) {
    const type = el instanceof HTMLSelectElement ? "select" : el instanceof HTMLTextAreaElement ? "textarea" : (el.type || "text").toLowerCase();
    if (["hidden", "submit", "button", "reset", "image", "password"].includes(type)) continue;
    if (el.closest(".orvenic-panel, #orvenic-panel-host")) continue;
    if (type !== "file" && !isVisible(el)) continue;
    if ((el as HTMLInputElement).disabled) continue;
    if (type === "radio" || type === "checkbox") {
      const key = el.name || el.id;
      if (key) {
        if (groups.has(key)) continue;
        groups.add(key);
      }
    }
    const label = labelFor(el, type);
    const meta: FieldMeta = { label, name: el.name, id: el.id, placeholder: (el as HTMLInputElement).placeholder, autocomplete: el.getAttribute("autocomplete") ?? undefined, type };
    out.push({ el, type, label: label || el.name || el.id || type, cls: classify(meta), container: containerFor(el, type) });
  }
  return out;
}

/* ---------- writing ---------- */

function setValue(el: HTMLInputElement | HTMLTextAreaElement, value: string): void {
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
  if (!originals.has(el)) originals.set(el, el.value);
  el.focus({ preventScroll: true });
  if (setter) setter.call(el, value);
  else el.value = value;
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
  el.blur();
}

function setSelect(el: HTMLSelectElement, wanted: string[]): boolean {
  const options = Array.from(el.options).map((o) => ({ text: o.text, value: o.value }));
  const i = pickOption(options, wanted);
  if (i < 0) return false;
  if (!originals.has(el)) originals.set(el, el.value);
  el.selectedIndex = i;
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
}

function setFile(input: HTMLInputElement, payload: FilePayload): boolean {
  try {
    const bytes = Uint8Array.from(atob(payload.base64), (c) => c.charCodeAt(0));
    const file = new File([bytes], payload.name, { type: payload.type });
    const dt = new DataTransfer();
    dt.items.add(file);
    if (!originals.has(input)) originals.set(input, null);
    input.files = dt.files;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  } catch {
    return false;
  }
}

/* ---------- marks on the page ---------- */

function badge(kind: "flag" | "hint", text: string): HTMLElement {
  const b = document.createElement("div");
  b.className = `orvenic-badge orvenic-badge--${kind}`;
  const mark = document.createElement("span");
  mark.className = "orvenic-badge__mark";
  mark.textContent = kind === "flag" ? "!" : "$";
  const t = document.createElement("span");
  t.textContent = kind === "flag" ? `Answer this yourself: ${text}` : text;
  const who = document.createElement("span");
  who.className = "orvenic-badge__who";
  who.textContent = "Orvenic";
  b.append(mark, t, who);
  return b;
}

function mark(f: Field, kind: "flag" | "hint", text: string): void {
  f.container.classList.add(`orvenic-${kind}`);
  const b = badge(kind, text);
  f.container.prepend(b);
  marks.push(b);
}

function highlight(f: Field): void {
  f.el.classList.add("orvenic-filled");
  if (f.type === "file") f.container.classList.add("orvenic-filled-file");
}

function clearMarks(): void {
  marks.forEach((m) => m.remove());
  marks = [];
  document.querySelectorAll(".orvenic-flag, .orvenic-hint, .orvenic-filled-file").forEach((el) => el.classList.remove("orvenic-flag", "orvenic-hint", "orvenic-filled-file"));
  document.querySelectorAll(".orvenic-filled").forEach((el) => el.classList.remove("orvenic-filled"));
}

/* ---------- the fill itself ---------- */

async function fill(data: ExtensionFillData, files: { resume?: FilePayload; cover?: FilePayload }): Promise<FillSummary> {
  removePanel();
  clearMarks();
  originals.clear();
  const candidate = { ...data.candidate, coverLetter: data.coverLetter };
  const fields = collectFields();
  const summary: FillSummary = {
    ats: detectAts(location.href),
    url: location.href,
    formFound: fields.length > 0,
    filled: [],
    flagged: [],
    hinted: 0,
    skipped: 0,
    attachedResume: false,
    attachedCover: false,
    coverLetterTyped: false,
  };

  for (const f of fields) {
    const { cls } = f;
    if (cls.action === "flag") {
      mark(f, "flag", cls.reason ?? "This question");
      summary.flagged.push({ label: f.label, reason: cls.reason ?? "" });
      continue;
    }
    if (cls.action === "hint") {
      const hint = payHint(data.pay);
      if (hint) {
        mark(f, "hint", hint);
        summary.hinted++;
      } else summary.skipped++;
      continue;
    }
    if (cls.action === "skip") {
      summary.skipped++;
      continue;
    }

    if (f.type === "file") {
      const input = f.el as HTMLInputElement;
      const wantsCover = cls.kind === "cover_letter";
      const payload = wantsCover ? files.cover : files.resume;
      const already = wantsCover ? summary.attachedCover : summary.attachedResume;
      if (!payload || already || (input.files && input.files.length > 0)) {
        summary.skipped++;
        continue;
      }
      if (setFile(input, payload)) {
        if (wantsCover) summary.attachedCover = true;
        else summary.attachedResume = true;
        summary.filled.push({ kind: cls.kind, label: f.label });
        highlight(f);
      } else summary.skipped++;
      continue;
    }

    const value = valueFor(cls.kind, candidate);
    if (!value) {
      summary.skipped++;
      continue;
    }
    if (f.el instanceof HTMLSelectElement) {
      const wanted = cls.kind === "country" ? [...(candidate.countryNames ?? []), value] : cls.kind === "province" ? [...(candidate.provinceNames ?? []), candidate.province ?? "", value] : [value];
      if (setSelect(f.el, wanted)) {
        summary.filled.push({ kind: cls.kind, label: f.label });
        highlight(f);
      } else summary.skipped++;
      continue;
    }
    // Never overwrite something the candidate already typed.
    if (f.el.value && f.el.value.trim()) {
      summary.skipped++;
      continue;
    }
    setValue(f.el, value);
    summary.filled.push({ kind: cls.kind, label: f.label });
    if (cls.kind === "cover_letter") summary.coverLetterTyped = true;
    highlight(f);
  }

  showPanel(summary);
  return summary;
}

function undo(): void {
  for (const [el, original] of originals) {
    if (el instanceof HTMLInputElement && el.type === "file") {
      try {
        el.files = new DataTransfer().files;
        el.dispatchEvent(new Event("change", { bubbles: true }));
      } catch {
        // some sites lock the file list; nothing to restore then
      }
    } else if (el instanceof HTMLSelectElement) {
      el.value = original ?? "";
      el.dispatchEvent(new Event("change", { bubbles: true }));
    } else {
      setValue(el, original ?? "");
    }
  }
  originals.clear();
  clearMarks();
  removePanel();
}

/* ---------- the small panel that reports what happened ---------- */

function removePanel(): void {
  panelHost?.remove();
  panelHost = null;
}

function showPanel(s: FillSummary): void {
  removePanel();
  const host = document.createElement("div");
  host.id = "orvenic-panel-host";
  const root = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = `
    :host{all:initial}
    .p{position:fixed;right:18px;bottom:18px;z-index:2147483646;width:300px;box-sizing:border-box;padding:14px 16px 12px;border-radius:18px;background:#0d0d10;color:#fff;font:13px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",Inter,Roboto,sans-serif;box-shadow:0 24px 60px -20px rgba(13,13,16,.6)}
    .h{display:flex;align-items:center;gap:9px;margin-bottom:8px}
    .h b{font-size:14px;letter-spacing:-.01em}
    .m{width:22px;height:22px;border-radius:7px;background:#fff;display:grid;place-items:center;flex:none}
    ul{list-style:none;margin:0 0 10px;padding:0;display:flex;flex-direction:column;gap:4px}
    li{display:flex;gap:8px;align-items:flex-start;color:rgba(255,255,255,.85)}
    li i{flex:none;width:8px;height:8px;border-radius:50%;margin-top:6px;background:#8b5cf6}
    li.flag i{background:#ef4f42}
    li.hint i{background:#f6c52e}
    .n{font-size:12px;color:rgba(255,255,255,.62);margin:0 0 10px}
    .a{display:flex;gap:8px}
    button{all:unset;cursor:pointer;flex:1;text-align:center;padding:8px 10px;border-radius:999px;font-weight:600;font-size:12.5px;background:rgba(255,255,255,.12);color:#fff}
    button.x{flex:0 0 auto;padding:8px 14px}
    button:hover{background:rgba(255,255,255,.2)}
  `;
  const panel = document.createElement("div");
  panel.className = "p";
  const head = document.createElement("div");
  head.className = "h";
  const m = document.createElement("span");
  m.className = "m";
  m.innerHTML = '<svg viewBox="0 0 64 64" width="16" height="16" aria-hidden="true"><circle cx="32" cy="32" r="17" stroke="#8b5cf6" stroke-width="7" fill="none"/><path d="M30 37.5l9 8.5L56 26" stroke="#fff" stroke-width="13" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M30 37.5l9 8.5L56 26" stroke="#0d0d10" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>';
  const title = document.createElement("b");
  title.textContent = s.formFound ? `Orvenic filled ${s.filled.length} field${s.filled.length === 1 ? "" : "s"}` : "No application form here";
  head.append(m, title);
  const list = document.createElement("ul");
  const line = (text: string, cls = "") => {
    const li = document.createElement("li");
    if (cls) li.className = cls;
    const dot = document.createElement("i");
    const span = document.createElement("span");
    span.textContent = text;
    li.append(dot, span);
    list.append(li);
  };
  if (s.attachedResume) line("Tailored resume attached");
  if (s.attachedCover) line("Cover letter attached");
  if (s.coverLetterTyped) line("Cover letter typed in");
  if (s.flagged.length) line(`${s.flagged.length} question${s.flagged.length === 1 ? "" : "s"} marked in red for you to answer`, "flag");
  if (s.hinted) line("Pay report shown beside the salary ask", "hint");
  if (s.skipped) line(`${s.skipped} left for you`);
  const note = document.createElement("p");
  note.className = "n";
  note.textContent = `Review every field, then use ${ATS_LABEL[s.ats] === "this site" ? "the site's" : ATS_LABEL[s.ats] + "'s"} own submit button. Orvenic never submits for you.`;
  const actions = document.createElement("div");
  actions.className = "a";
  const undoBtn = document.createElement("button");
  undoBtn.textContent = "Undo what Orvenic typed";
  undoBtn.addEventListener("click", () => undo());
  const close = document.createElement("button");
  close.className = "x";
  close.textContent = "Close";
  close.addEventListener("click", () => removePanel());
  actions.append(undoBtn, close);
  panel.append(head, list, note, actions);
  root.append(style, panel);
  document.documentElement.append(host);
  panelHost = host;
}

/* ---------- wiring ---------- */

function init(): void {
  chrome.runtime.onMessage.addListener((msg: ContentRequest, _sender, sendResponse) => {
    try {
      switch (msg.type) {
        case "ping":
          sendResponse({ ok: true });
          return false;
        case "detect":
          sendResponse({ ok: true, ...detect() });
          return false;
        case "scrape":
          sendResponse({ ok: true, ...scrape() });
          return false;
        case "fill":
          fill(msg.data, msg.files).then(
            (summary) => sendResponse({ ok: true, summary }),
            (e: unknown) => sendResponse({ ok: false, error: String((e as Error)?.message ?? e) }),
          );
          return true;
        case "undo":
          undo();
          sendResponse({ ok: true });
          return false;
      }
    } catch (e) {
      sendResponse({ ok: false, error: String((e as Error)?.message ?? e) });
    }
    return false;
  });
}

if (!window.__orvenicPage) {
  window.__orvenicPage = true;
  init();
}
