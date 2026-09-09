import { ApiError, withHandler } from "@/lib/app/errors";
import { requireUser } from "@/lib/app/auth-server";
import { getApplication } from "@/lib/store/applications";
import { buildCoverLetterDocx, buildResumeDocx } from "@/lib/documents/resume-docx";
import { buildCoverLetterPdf, buildResumePdf } from "@/lib/documents/resume-pdf";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Generate the delivered documents on demand: ?type=resume|cover&format=docx|pdf */
export const GET = withHandler(async (req, ctx: RouteContext<"/api/applications/[id]/documents">) => {
  const { uid } = await requireUser(req);
  const { id } = await ctx.params;
  const url = new URL(req.url);
  const type = url.searchParams.get("type") === "cover" ? "cover" : "resume";
  const format = url.searchParams.get("format") === "pdf" ? "pdf" : "docx";
  const app = await getApplication(uid, id);
  if (!app?.package) throw new ApiError(404, "not_ready", "Build the package first.");
  const { resume, coverLetter } = app.package;
  const safeName = (resume.name || "resume").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
  const role = app.posting.title.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
  const fileName = `${safeName}-${type === "cover" ? "cover-letter" : "resume"}-${role}.${format}`;

  let body: Buffer;
  if (type === "resume") body = format === "pdf" ? await buildResumePdf(resume) : await buildResumeDocx(resume);
  else body = format === "pdf" ? await buildCoverLetterPdf({ letter: coverLetter, resume, title: app.posting.title, company: app.posting.company }) : await buildCoverLetterDocx({ letter: coverLetter, resume, title: app.posting.title, company: app.posting.company });

  return new Response(new Uint8Array(body), {
    headers: {
      "Content-Type": format === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "private, no-store",
    },
  });
});
