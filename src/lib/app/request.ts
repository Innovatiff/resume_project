import "server-only";
import { ApiError } from "./errors";
import { config } from "./config";

/* Multipart / JSON request helpers shared by route handlers. */

export interface UploadedFile {
  buffer: Buffer;
  name: string;
  type?: string;
}

export async function readForm(req: Request): Promise<FormData> {
  try {
    return await req.formData();
  } catch {
    throw new ApiError(400, "bad_form", "Expected a multipart form.");
  }
}

export async function fileFromForm(form: FormData, field = "file", required = true): Promise<UploadedFile | null> {
  const f = form.get(field);
  if (!f || typeof f === "string") {
    if (required) throw new ApiError(400, "missing_file", "Attach your resume as a PDF or DOCX.");
    return null;
  }
  const file = f as File;
  if (file.size > config.limits.maxUploadBytes) throw new ApiError(413, "file_too_large", "Resumes must be 4 MB or smaller.");
  if (file.size === 0) throw new ApiError(400, "empty_file", "That file is empty.");
  return { buffer: Buffer.from(await file.arrayBuffer()), name: file.name || "resume", type: file.type || undefined };
}

export function textField(form: FormData, field: string, opts: { min?: number; max?: number; required?: boolean } = {}): string {
  const v = form.get(field);
  const s = typeof v === "string" ? v.trim() : "";
  if (opts.required !== false && !s) throw new ApiError(400, `missing_${field}`, `${field} is required.`);
  if (opts.min && s.length < opts.min) throw new ApiError(400, `${field}_too_short`, field === "posting" ? "Paste the full job posting, not just the title." : `${field} is too short.`);
  if (opts.max && s.length > opts.max) throw new ApiError(400, `${field}_too_long`, `${field} is too long.`);
  return s;
}

export async function readJson<T extends object>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new ApiError(400, "invalid_json", "The request body must be JSON.");
  }
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export function validEmail(s: string): boolean {
  return EMAIL.test(s);
}
