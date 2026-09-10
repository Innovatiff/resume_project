import "server-only";
import type { Application } from "@/lib/app/types";
import { ApiError } from "@/lib/app/errors";
import { marketFor } from "@/lib/app/markets";
import { buildCoverLetterDocx, buildResumeDocx } from "./resume-docx";
import { buildCoverLetterPdf, buildResumePdf } from "./resume-pdf";

/* The delivered files, generated on demand from the package. Used by the app and the extension. */

export type DeliverableType = "resume" | "cover";
export type DeliverableFormat = "docx" | "pdf";

export interface Deliverable {
  body: Buffer;
  fileName: string;
  contentType: string;
}

export function deliverableParams(url: URL): { type: DeliverableType; format: DeliverableFormat } {
  return {
    type: url.searchParams.get("type") === "cover" ? "cover" : "resume",
    format: url.searchParams.get("format") === "pdf" ? "pdf" : "docx",
  };
}

const slug = (s: string) => s.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();

export async function buildDeliverable(app: Application, type: DeliverableType, format: DeliverableFormat): Promise<Deliverable> {
  if (!app.package) throw new ApiError(404, "not_ready", "Build the package first.");
  const { resume, coverLetter } = app.package;
  const paper = marketFor(app.requirements.country).paper;
  const fileName = `${slug(resume.name || "resume")}-${type === "cover" ? "cover-letter" : "resume"}-${slug(app.posting.title)}.${format}`;
  let body: Buffer;
  if (type === "resume") body = format === "pdf" ? await buildResumePdf(resume, { paper }) : await buildResumeDocx(resume, { paper });
  else {
    const input = { letter: coverLetter, resume, title: app.posting.title, company: app.posting.company, paper };
    body = format === "pdf" ? await buildCoverLetterPdf(input) : await buildCoverLetterDocx(input);
  }
  return { body, fileName, contentType: format === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document" };
}

export function deliverableResponse(d: Deliverable): Response {
  return new Response(new Uint8Array(d.body), {
    headers: {
      "Content-Type": d.contentType,
      "Content-Disposition": `attachment; filename="${d.fileName}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
