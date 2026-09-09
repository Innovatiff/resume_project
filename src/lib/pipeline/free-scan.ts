import "server-only";
import type { FreeScanResult } from "@/lib/app/types";
import { config } from "@/lib/app/config";
import { ApiError } from "@/lib/app/errors";
import { addDays, newId, nowIso } from "@/lib/app/hash";
import { parseResume } from "@/lib/parse/resume";
import { extractProfile, parsePosting } from "@/lib/ai/tasks";
import { scoreResume } from "@/lib/scoring/scorer";
import { checkRedFlags } from "@/lib/scoring/redflags";
import { freeScanAllowedAt, recordFreeScan, saveFreeScanResult } from "@/lib/store/free-scans";
import { freeScanEmail, sendEmail } from "@/lib/email/resend";

export interface FreeScanInput {
  file: { buffer: Buffer; name: string; type?: string };
  posting: string;
  email: string;
}

/**
 * The free scan: parse, extract, parse the posting, score, store the result
 * for 7 days, email the breakdown. The resume text is never stored.
 */
export async function runFreeScan(input: FreeScanInput): Promise<FreeScanResult> {
  const gate = await freeScanAllowedAt(input.email);
  if (!gate.allowed) {
    const when = gate.nextAt ? new Date(gate.nextAt).toLocaleDateString("en-CA", { month: "long", day: "numeric" }) : "next week";
    throw new ApiError(429, "scan_limit", `One free scan per email address every 7 days. Your next one opens on ${when}. The Single Shot covers any posting today.`);
  }

  const parsed = await parseResume(input.file.buffer, input.file.name, input.file.type);
  const [{ profile }, { requirements }] = await Promise.all([extractProfile(parsed.text), parsePosting(input.posting)]);
  const score = scoreResume(profile, requirements, parsed.layout);
  const redFlags = checkRedFlags(input.posting, requirements);

  const result: FreeScanResult = {
    id: newId(),
    createdAt: nowIso(),
    expiresAt: addDays(nowIso(), config.freeScan.resultTtlDays),
    postingTitle: requirements.title,
    score,
    layout: parsed.layout,
    redFlags,
  };
  await Promise.all([saveFreeScanResult(result), recordFreeScan(input.email)]);

  const mail = freeScanEmail({ score: score.score, verdict: score.verdict, reasons: score.reasons, resultUrl: `${config.siteUrl}/scan/result/${result.id}` });
  void sendEmail({ to: input.email, ...mail });
  return result;
}
