/* ------------------------------------------------------------------
   Background service worker. Holds the connection key, talks to the
   Orvenic API, and drives the content script in the current tab. It
   never submits anything: the only writes are "score this posting",
   "we filled a form" and "the candidate says they applied".
------------------------------------------------------------------- */

import { api, apiFile, ApiError } from "./lib/api";
import type { BgRequest, ContentRequest, FillSummary, PageInfo, ScrapeResult, StoredState } from "./lib/messages";
import type { ExtensionApplication, ExtensionFillData, ExtensionMe } from "@/lib/app/types";
import { detectAts } from "@/lib/extension/ats";

async function getState(): Promise<StoredState> {
  const { state } = (await chrome.storage.local.get("state")) as { state?: StoredState };
  return state ?? {};
}

async function requireState(): Promise<StoredState> {
  const state = await getState();
  if (!state.key) throw new ApiError(401, "not_connected", "Connect this browser from the Extension page in your Orvenic account.");
  return state;
}

/* ---------- talking to the page ---------- */

async function ping(tabId: number, frameId?: number): Promise<boolean> {
  try {
    const r = (await chrome.tabs.sendMessage(tabId, { type: "ping" } satisfies ContentRequest, frameId == null ? {} : { frameId })) as { ok?: boolean } | undefined;
    return r?.ok === true;
  } catch {
    return false;
  }
}

/** The content script is declared for the known ATS hosts; anywhere else it is injected on demand (activeTab). */
async function ensureContent(tabId: number, frameId?: number): Promise<void> {
  if (await ping(tabId, frameId)) return;
  const target = frameId == null ? { tabId } : { tabId, frameIds: [frameId] };
  await chrome.scripting.insertCSS({ target, files: ["content.css"] }).catch(() => undefined);
  await chrome.scripting.executeScript({ target, files: ["page.js"] });
  if (!(await ping(tabId, frameId))) throw new ApiError(0, "no_page", "Orvenic cannot run on this page.");
}

async function ask<T>(tabId: number, msg: ContentRequest, frameId?: number): Promise<T> {
  await ensureContent(tabId, frameId);
  const r = (await chrome.tabs.sendMessage(tabId, msg, frameId == null ? {} : { frameId })) as ({ ok: true } & T) | { ok: false; error: string } | undefined;
  if (!r) throw new ApiError(0, "no_reply", "The page did not answer.");
  if (r.ok === false) throw new ApiError(0, "page_error", r.error);
  return r;
}

/** Count visible inputs in every frame so embedded application forms (an ATS inside a company page) are found. */
async function probeFrames(tabId: number): Promise<{ frameId: number; inputs: number }[]> {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId, allFrames: true },
      func: () => {
        let n = 0;
        for (const el of Array.from(document.querySelectorAll("input, textarea, select")) as HTMLElement[]) {
          const type = (el as HTMLInputElement).type;
          if (type === "hidden" || type === "submit" || type === "button") continue;
          if (type === "file" || el.offsetParent !== null) n++;
        }
        return n;
      },
    });
    return results.map((r) => ({ frameId: r.frameId, inputs: Number(r.result) || 0 }));
  } catch {
    return [];
  }
}

async function pageInfo(tabId: number): Promise<PageInfo> {
  const top = await ask<Omit<PageInfo, "formFrameId" | "inputs"> & { inputs: number }>(tabId, { type: "detect" }, 0);
  const frames = await probeFrames(tabId);
  const best = frames.filter((f) => f.inputs > 0).sort((a, b) => b.inputs - a.inputs)[0];
  return { ...top, formFrameId: best?.frameId };
}

/* ---------- requests from the popup ---------- */

async function handle(msg: BgRequest, sender: chrome.runtime.MessageSender): Promise<unknown> {
  switch (msg.type) {
    case "state":
      return { ok: true, state: await getState() };

    case "connect": {
      // From the bridge content script on the Orvenic site, or the popup's paste box. Never from a web page.
      if (sender.id !== chrome.runtime.id) throw new ApiError(403, "forbidden", "Not allowed.");
      const key = String(msg.key ?? "").trim();
      const baseUrl = String(msg.baseUrl ?? "").replace(/\/$/, "");
      if (!/^ovx_[A-Za-z0-9_-]{20,}$/.test(key)) throw new ApiError(400, "bad_key", "That does not look like an Orvenic connection code.");
      if (!/^https?:\/\//.test(baseUrl)) throw new ApiError(400, "bad_url", "Site address must start with https://");
      const probe: StoredState = { key, baseUrl };
      const { me } = await api<{ me: ExtensionMe }>(probe, "/api/extension/me");
      await chrome.storage.local.set({ state: { ...probe, email: me.email, connectedAt: new Date().toISOString() } satisfies StoredState });
      return { ok: true, me };
    }

    case "disconnect":
      await chrome.storage.local.remove("state");
      return { ok: true };

    case "me": {
      const state = await requireState();
      const { me } = await api<{ me: ExtensionMe }>(state, "/api/extension/me");
      return { ok: true, me };
    }

    case "page":
      return { ok: true, page: await pageInfo(msg.tabId) };

    case "applications": {
      const state = await requireState();
      const q = new URLSearchParams();
      if (msg.url) q.set("url", msg.url);
      if (msg.title) q.set("title", msg.title);
      const r = await api<{ applications: ExtensionApplication[]; match: { id: string; score: number } | null }>(state, `/api/extension/applications?${q}`);
      return { ok: true, applications: r.applications, match: r.match };
    }

    case "score": {
      const state = await requireState();
      const scrape = await ask<ScrapeResult>(msg.tabId, { type: "scrape" }, 0);
      const r = await api<{ application: ExtensionApplication }>(state, "/api/extension/applications", { method: "POST", body: JSON.stringify({ posting: scrape.text, url: scrape.url }) });
      return { ok: true, application: r.application };
    }

    case "fill": {
      const state = await requireState();
      const { fill } = await api<{ fill: ExtensionFillData }>(state, `/api/extension/applications/${msg.applicationId}/fill`);
      const [resume, cover] = await Promise.all([apiFile(state, fill.documents.resumePdf, "resume.pdf"), apiFile(state, fill.documents.coverPdf, "cover-letter.pdf").catch(() => undefined)]);
      const { summary } = await ask<{ summary: FillSummary }>(msg.tabId, { type: "fill", data: fill, files: { resume, cover } }, msg.frameId);
      await api(state, `/api/extension/applications/${msg.applicationId}/events`, {
        method: "POST",
        body: JSON.stringify({ event: "filled", ats: summary.ats || detectAts(summary.url), url: summary.url, filled: summary.filled.length, flagged: summary.flagged.length }),
      }).catch(() => undefined);
      return { ok: true, summary };
    }

    case "undo":
      await ask(msg.tabId, { type: "undo" }, msg.frameId);
      return { ok: true };

    case "applied": {
      const state = await requireState();
      await api(state, `/api/extension/applications/${msg.applicationId}/events`, { method: "POST", body: JSON.stringify({ event: "applied" }) });
      return { ok: true };
    }
  }
}

chrome.runtime.onMessage.addListener((msg: BgRequest, sender, sendResponse) => {
  handle(msg, sender).then(sendResponse, (e: unknown) => {
    const err = e as { message?: string; code?: string };
    sendResponse({ ok: false, error: err?.message ?? String(e), code: err?.code });
  });
  return true;
});
