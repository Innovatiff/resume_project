/* The background worker's client for the Orvenic API. The key never leaves the worker. */

import type { FilePayload, StoredState } from "./messages";

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function base(state: StoredState): string {
  return (state.baseUrl || "https://orvenic.com").replace(/\/$/, "");
}

export async function api<T>(state: StoredState, path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${state.key ?? ""}`);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  let res: Response;
  try {
    res = await fetch(base(state) + path, { ...init, headers });
  } catch {
    throw new ApiError(0, "network", "Could not reach Orvenic. Check your connection and try again.");
  }
  const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; message?: string } & T;
  if (!res.ok || data.ok === false) throw new ApiError(res.status, data.error ?? "error", data.message ?? `Request failed (${res.status}).`);
  return data;
}

function toBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let out = "";
  for (let i = 0; i < bytes.length; i += 0x8000) out += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(out);
}

/** A generated document, as bytes the content script can turn into a File. */
export async function apiFile(state: StoredState, path: string, fallbackName: string): Promise<FilePayload> {
  const res = await fetch(base(state) + path, { headers: { Authorization: `Bearer ${state.key ?? ""}` } });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
    throw new ApiError(res.status, data.error ?? "download_failed", data.message ?? "Could not generate the file.");
  }
  const name = res.headers.get("content-disposition")?.match(/filename="([^"]+)"/)?.[1] ?? fallbackName;
  return { name, type: res.headers.get("content-type") ?? "application/octet-stream", base64: toBase64(await res.arrayBuffer()) };
}
