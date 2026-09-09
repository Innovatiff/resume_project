import "server-only";
import mammoth from "mammoth";
import type { LayoutFlags } from "@/lib/app/types";
import { ApiError } from "@/lib/app/errors";
import { countWords } from "@/lib/scoring/text";

/* ------------------------------------------------------------------
   Resume text extraction with layout diagnostics.
   PDF: pdf.js text items with positions, so multi-column resumes are
   read column by column instead of straight across the page.
   DOCX: mammoth, with table and image detection.
------------------------------------------------------------------- */

export interface ParsedResume {
  text: string;
  layout: LayoutFlags;
}

export function detectFileType(fileName: string, mimeType?: string): "pdf" | "docx" {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pdf") || mimeType === "application/pdf") return "pdf";
  if (lower.endsWith(".docx") || mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return "docx";
  throw new ApiError(400, "unsupported_type", "Only PDF and DOCX resumes are supported.");
}

export async function parseResume(buffer: Buffer, fileName: string, mimeType?: string): Promise<ParsedResume> {
  const type = detectFileType(fileName, mimeType);
  const parsed = type === "pdf" ? await parsePdf(buffer) : await parseDocx(buffer);
  const words = countWords(parsed.text);
  const noText = words < 30;
  if (noText && type === "pdf") {
    throw new ApiError(422, "no_text", "We could not read any text from this PDF. It looks scanned. Export it from your editor as a text PDF or DOCX and try again.");
  }
  return { text: parsed.text, layout: { ...parsed.layout, words, noText } };
}

/* ---------- DOCX ---------- */

async function parseDocx(buffer: Buffer): Promise<{ text: string; layout: Omit<LayoutFlags, "words" | "noText"> }> {
  const [raw, html] = await Promise.all([mammoth.extractRawText({ buffer }), mammoth.convertToHtml({ buffer })]);
  const text = raw.value.replace(/\r/g, "").replace(/\n{3,}/g, "\n\n").trim();
  const tables = /<table/i.test(html.value);
  const images = /<img/i.test(html.value);
  const pages = Math.max(1, Math.ceil(countWords(text) / 450));
  return { text, layout: { fileType: "docx", pages, multiColumn: false, tables, images } };
}

/* ---------- PDF ---------- */

interface Item {
  str: string;
  x: number;
  y: number;
  w: number;
}

async function parsePdf(buffer: Buffer): Promise<{ text: string; layout: Omit<LayoutFlags, "words" | "noText"> }> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const task = pdfjs.getDocument({ data: new Uint8Array(buffer), useSystemFonts: true, disableFontFace: true });
  const doc = await task.promise;
  const pageTexts: string[] = [];
  let multiColumn = false;
  let images = false;

  for (let n = 1; n <= doc.numPages; n++) {
    const page = await doc.getPage(n);
    const { width } = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();
    const items: Item[] = [];
    for (const it of content.items) {
      if (!("str" in it) || !it.str.trim()) continue;
      items.push({ str: it.str, x: it.transform[4], y: it.transform[5], w: it.width });
    }
    const columns = detectColumns(items, width);
    if (columns) multiColumn = true;
    pageTexts.push(columns ? readColumns(items, columns.split) : readLinear(items));

    try {
      const ops = await page.getOperatorList();
      const imageOps = new Set([pdfjs.OPS.paintImageXObject, pdfjs.OPS.paintImageXObjectRepeat, pdfjs.OPS.paintInlineImageXObject]);
      if (ops.fnArray.some((f: number) => imageOps.has(f))) images = true;
    } catch {
      /* operator list is diagnostic only */
    }
  }
  const pages = doc.numPages;
  await task.destroy().catch(() => undefined);
  const text = pageTexts.join("\n\n").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  return { text, layout: { fileType: "pdf", pages, multiColumn, tables: false, images } };
}

/**
 * Column detection: look for a vertical line the text does not cross, with a
 * real block of lines on each side sharing the same rows. Works for 50/50 and
 * sidebar layouts (30/70, 35/65) alike.
 */
function detectColumns(items: Item[], pageWidth: number): { split: number } | null {
  if (items.length < 12) return null;
  const starts = [...new Set(items.map((i) => Math.round(i.x)))].sort((a, b) => a - b);
  const candidates = starts.filter((x) => x > pageWidth * 0.22 && x < pageWidth * 0.72);
  let best: { split: number; shared: number } | null = null;
  for (const x of candidates) {
    const split = x - 3;
    const left = items.filter((i) => i.x < split);
    const right = items.filter((i) => i.x >= split);
    if (left.length < 6 || right.length < 6) continue;
    // Nothing on the left may reach across the split (allow a little tolerance).
    const spanning = left.filter((i) => i.x + i.w > split + 6).length;
    if (spanning > Math.max(1, left.length * 0.15)) continue;
    const rows = new Set(left.map((i) => Math.round(i.y / 3)));
    const shared = right.filter((i) => rows.has(Math.round(i.y / 3))).length;
    if (shared < 4) continue;
    if (!best || shared > best.shared) best = { split, shared };
  }
  return best ? { split: best.split } : null;
}

function readColumns(items: Item[], split: number): string {
  const leftCol = items.filter((i) => i.x < split);
  const rightCol = items.filter((i) => i.x >= split);
  return `${readLinear(leftCol)}\n\n${readLinear(rightCol)}`;
}

function readLinear(items: Item[]): string {
  const sorted = [...items].sort((a, b) => (Math.abs(b.y - a.y) > 2.5 ? b.y - a.y : a.x - b.x));
  const lines: string[] = [];
  let current: Item[] = [];
  let currentY = Number.NaN;
  for (const it of sorted) {
    if (Number.isNaN(currentY) || Math.abs(it.y - currentY) <= 2.5) {
      current.push(it);
      currentY = Number.isNaN(currentY) ? it.y : currentY;
    } else {
      lines.push(joinLine(current));
      current = [it];
      currentY = it.y;
    }
  }
  if (current.length) lines.push(joinLine(current));
  return lines.join("\n");
}

function joinLine(items: Item[]): string {
  const sorted = [...items].sort((a, b) => a.x - b.x);
  let out = "";
  let lastEnd = Number.NaN;
  for (const it of sorted) {
    if (!Number.isNaN(lastEnd) && it.x - lastEnd > 1.5 && !out.endsWith(" ")) out += " ";
    out += it.str;
    lastEnd = it.x + it.w;
  }
  return out.replace(/\s+/g, " ").trim();
}
