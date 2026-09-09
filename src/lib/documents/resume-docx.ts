import "server-only";
import { AlignmentType, BorderStyle, Document, HeadingLevel, Packer, Paragraph, TabStopType, TextRun } from "docx";
import type { TailoredResume } from "@/lib/app/types";

/* ATS-safe DOCX: single column, real headings, plain bullets, no tables. */

const FONT = "Calibri";

function heading(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 240, after: 80 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "999999", space: 2 } },
    children: [new TextRun({ text: text.toUpperCase(), bold: true, size: 22, font: FONT, color: "111111" })],
  });
}

function line(text: string, opts: { bold?: boolean; size?: number; color?: string; after?: number; align?: (typeof AlignmentType)[keyof typeof AlignmentType] } = {}): Paragraph {
  return new Paragraph({
    alignment: opts.align,
    spacing: { after: opts.after ?? 60 },
    children: [new TextRun({ text, bold: opts.bold, size: opts.size ?? 21, font: FONT, color: opts.color ?? "111111" })],
  });
}

function bullet(text: string): Paragraph {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 40 },
    children: [new TextRun({ text, size: 21, font: FONT, color: "111111" })],
  });
}

export function contactLine(r: TailoredResume): string {
  return [r.contact.city, r.contact.phone, r.contact.email, r.contact.linkedin].filter(Boolean).join("  ·  ");
}

export function dateRange(start?: string, end?: string): string {
  if (!start && !end) return "";
  return `${start ?? ""} – ${end ?? "Present"}`;
}

export type Paper = "LETTER" | "A4";

/** Page size in twips. */
function pageSize(paper: Paper) {
  return paper === "A4" ? { width: 11906, height: 16838 } : { width: 12240, height: 15840 };
}

export async function buildResumeDocx(r: TailoredResume, opts: { paper?: Paper } = {}): Promise<Buffer> {
  const children: Paragraph[] = [];
  children.push(line(r.name, { bold: true, size: 40, after: 20 }));
  if (r.headline) children.push(line(r.headline, { size: 24, color: "444444", after: 40 }));
  const contact = contactLine(r);
  if (contact) children.push(line(contact, { size: 19, color: "555555", after: 120 }));

  if (r.summary) {
    children.push(heading("Summary"));
    children.push(line(r.summary, { after: 80 }));
  }

  if (r.experience.length) {
    children.push(heading("Experience"));
    for (const e of r.experience) {
      children.push(
        new Paragraph({
          spacing: { before: 120, after: 20 },
          tabStops: [{ type: TabStopType.RIGHT, position: 9360 }],
          children: [new TextRun({ text: e.title, bold: true, size: 22, font: FONT }), new TextRun({ text: `\t${dateRange(e.start, e.end)}`, size: 19, font: FONT, color: "555555" })],
        }),
      );
      children.push(line([e.company, e.location].filter(Boolean).join(", "), { size: 20, color: "444444", after: 40 }));
      for (const b of e.bullets) children.push(bullet(b));
    }
  }

  if (r.skills.length) {
    children.push(heading("Skills"));
    for (const g of r.skills) {
      children.push(
        new Paragraph({
          spacing: { after: 40 },
          children: [new TextRun({ text: `${g.group}: `, bold: true, size: 21, font: FONT }), new TextRun({ text: g.items.join(", "), size: 21, font: FONT })],
        }),
      );
    }
  }

  if (r.education.length) {
    children.push(heading("Education"));
    for (const ed of r.education) children.push(line([ed.credential, ed.institution, ed.year].filter(Boolean).join(" · ")));
  }
  if (r.certifications.length) {
    children.push(heading("Certifications"));
    for (const c of r.certifications) children.push(bullet(c));
  }
  if (r.languages.length) {
    children.push(heading("Languages"));
    children.push(line(r.languages.join(", ")));
  }

  const doc = new Document({
    creator: "Shortlist",
    title: `${r.name} – Resume`,
    styles: { default: { document: { run: { font: FONT, size: 21 } } } },
    sections: [{ properties: { page: { size: pageSize(opts.paper ?? "LETTER"), margin: { top: 900, bottom: 900, left: 1000, right: 1000 } } }, children }],
  });
  return Packer.toBuffer(doc);
}

export async function buildCoverLetterDocx(input: { letter: string; resume: TailoredResume; company?: string; title: string; paper?: Paper }): Promise<Buffer> {
  const children: Paragraph[] = [];
  children.push(line(input.resume.name, { bold: true, size: 28, after: 20 }));
  const contact = contactLine(input.resume);
  if (contact) children.push(line(contact, { size: 19, color: "555555", after: 200 }));
  children.push(line(new Date().toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" }), { after: 200 }));
  children.push(line(`Re: ${input.title}${input.company ? ` at ${input.company}` : ""}`, { bold: true, after: 200 }));
  for (const para of input.letter.split(/\n{2,}/)) children.push(line(para.trim(), { after: 160 }));
  const doc = new Document({
    creator: "Shortlist",
    title: `${input.resume.name} – Cover letter`,
    styles: { default: { document: { run: { font: FONT, size: 22 } } } },
    sections: [{ properties: { page: { size: pageSize(input.paper ?? "LETTER"), margin: { top: 1100, bottom: 1100, left: 1100, right: 1100 } } }, children }],
  });
  return Packer.toBuffer(doc);
}
