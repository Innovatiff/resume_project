import { ok, withHandler, ApiError } from "@/lib/app/errors";
import { config } from "@/lib/app/config";
import { fileFromForm, readForm, textField, validEmail } from "@/lib/app/request";
import { runFreeScan } from "@/lib/pipeline/free-scan";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * Free scan. No account, no card. One scan per email address every 7 days.
 * Multipart: file (PDF/DOCX), posting (text), email.
 */
export const POST = withHandler(async (req) => {
  const form = await readForm(req);
  const email = textField(form, "email");
  if (!validEmail(email)) throw new ApiError(400, "invalid_email", "Enter a valid email address so we can send the breakdown.");
  const posting = textField(form, "posting", { min: config.limits.minPostingChars, max: config.limits.maxPostingChars });
  const file = (await fileFromForm(form))!;
  const result = await runFreeScan({ file, posting, email });
  return ok({ result });
});
