/* Message contracts between the popup, the background worker and the content scripts. */

import type { ExtensionApplication, ExtensionFillData, ExtensionMe } from "@/lib/app/types";
import type { Ats } from "@/lib/extension/ats";

export interface StoredState {
  key?: string;
  baseUrl?: string;
  email?: string;
  connectedAt?: string;
}

export interface FilePayload {
  name: string;
  type: string;
  base64: string;
}

export interface PageInfo {
  url: string;
  title: string;
  company?: string;
  ats: Ats;
  /** Inputs visible in the top frame. */
  inputs: number;
  /** Frame with the most inputs, when any frame has one. */
  formFrameId?: number;
  postingChars: number;
}

export interface ScrapeResult {
  url: string;
  title: string;
  company?: string;
  text: string;
}

export interface FillSummary {
  ats: Ats;
  url: string;
  formFound: boolean;
  filled: { kind: string; label: string }[];
  flagged: { label: string; reason: string }[];
  hinted: number;
  skipped: number;
  attachedResume: boolean;
  attachedCover: boolean;
  coverLetterTyped: boolean;
}

export type BgRequest =
  | { type: "state" }
  | { type: "connect"; key: string; baseUrl: string }
  | { type: "disconnect" }
  | { type: "me" }
  | { type: "page"; tabId: number }
  | { type: "applications"; url?: string; title?: string }
  | { type: "score"; tabId: number }
  | { type: "fill"; tabId: number; frameId?: number; applicationId: string }
  | { type: "undo"; tabId: number; frameId?: number }
  | { type: "applied"; applicationId: string };

export type ContentRequest = { type: "ping" } | { type: "detect" } | { type: "scrape" } | { type: "fill"; data: ExtensionFillData; files: { resume?: FilePayload; cover?: FilePayload } } | { type: "undo" };

export type Fail = { ok: false; error: string; code?: string };
export type Ok<T> = { ok: true } & T;
export type Reply<T> = Ok<T> | Fail;

export type StateReply = Reply<{ state: StoredState }>;
export type MeReply = Reply<{ me: ExtensionMe }>;
export type PageReply = Reply<{ page: PageInfo }>;
export type ApplicationsReply = Reply<{ applications: ExtensionApplication[]; match: { id: string; score: number } | null }>;
export type ScoreReply = Reply<{ application: ExtensionApplication }>;
export type FillReply = Reply<{ summary: FillSummary }>;
