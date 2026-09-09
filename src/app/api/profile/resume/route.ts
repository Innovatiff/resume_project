import { ok, withHandler } from "@/lib/app/errors";
import { requireUser } from "@/lib/app/auth-server";
import { fileFromForm, readForm } from "@/lib/app/request";
import { ingestResume } from "@/lib/pipeline/application";

export const runtime = "nodejs";
export const maxDuration = 120;

/** Upload (or replace) the resume that becomes the Candidate Profile. */
export const POST = withHandler(async (req) => {
  const { doc } = await requireUser(req);
  const form = await readForm(req);
  const file = (await fileFromForm(form))!;
  const { profile, source } = await ingestResume(doc, file);
  return ok({ profile, source });
});
