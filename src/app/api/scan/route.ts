import { NextResponse } from "next/server";

/**
 * Free scan intake.
 *
 * This build validates the request and returns 501 until the scoring
 * pipeline is connected. The intended flow, from the business plan:
 *
 *   1. Receive resume (PDF/DOCX, <= 5 MB) + pasted posting + email.
 *   2. Enforce one scan per email address per 7 days.
 *   3. Stage 1 extractor (Haiku) -> Candidate Profile with per-bullet metric flags.
 *   4. Deterministic scorer against the posting -> score + three reasons.
 *   5. Email the breakdown (Resend). Delete the file after scoring.
 *
 * The client currently sends file metadata only; the file bytes never
 * leave the browser until step 1 exists. Switch the client to multipart
 * FormData when wiring the extractor.
 */

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

interface ScanRequest {
  email?: unknown;
  postingLength?: unknown;
  file?: { name?: unknown; size?: unknown; type?: unknown };
}

function bad(error: string, message: string, status = 400) {
  return NextResponse.json({ ok: false, error, message }, { status });
}

export async function POST(request: Request) {
  let body: ScanRequest;
  try {
    body = (await request.json()) as ScanRequest;
  } catch {
    return bad("invalid_json", "The request body must be JSON.");
  }

  if (typeof body.email !== "string" || !EMAIL.test(body.email)) {
    return bad("invalid_email", "Enter a valid email address so we can send the breakdown.");
  }

  if (typeof body.postingLength !== "number" || body.postingLength < 80) {
    return bad("posting_too_short", "Paste the full job posting, not just the title.");
  }

  const file = body.file;
  if (!file || typeof file.name !== "string" || typeof file.size !== "number" || typeof file.type !== "string") {
    return bad("missing_file", "Attach your resume as a PDF or DOCX.");
  }
  if (file.size > MAX_BYTES) {
    return bad("file_too_large", "Resumes must be 5 MB or smaller.");
  }
  const byExt = /\.(pdf|docx)$/i.test(file.name);
  if (!ALLOWED_TYPES.has(file.type) && !byExt) {
    return bad("unsupported_type", "Only PDF and DOCX resumes are supported.");
  }

  return NextResponse.json(
    {
      ok: false,
      error: "scanner_not_connected",
      message: "The free scanner is not connected in this build. Your file never left your browser.",
    },
    { status: 501 },
  );
}
