import { describe, expect, it, vi } from "vitest";
import React from "react";

vi.mock("server-only", () => ({}));

const { parseResume, detectFileType } = await import("../resume");

async function twoColumnPdf(): Promise<Buffer> {
  const { Document, Page, Text, View, StyleSheet, renderToBuffer } = await import("@react-pdf/renderer");
  const s = StyleSheet.create({ page: { padding: 40, fontSize: 11 }, row: { flexDirection: "row" }, col: { width: "50%", paddingRight: 12 } });
  const lines = (prefix: string) => Array.from({ length: 8 }, (_, i) => React.createElement(Text, { key: i }, `${prefix} line ${i + 1} with some words in it`));
  const el = React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "LETTER", style: s.page },
      React.createElement(Text, null, "Maria Rodriguez"),
      React.createElement(View, { style: s.row }, React.createElement(View, { style: s.col }, ...lines("LEFT")), React.createElement(View, { style: s.col }, ...lines("RIGHT"))),
    ),
  );
  return renderToBuffer(el);
}

async function sidebarPdf(): Promise<Buffer> {
  const { Document, Page, Text, View, StyleSheet, renderToBuffer } = await import("@react-pdf/renderer");
  const s = StyleSheet.create({ page: { padding: 40, fontSize: 10 }, row: { flexDirection: "row" }, side: { width: "34%", paddingRight: 12 }, main: { width: "66%" } });
  const lines = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => React.createElement(Text, { key: i }, `${prefix} ${i + 1}`));
  const el = React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "LETTER", style: s.page },
      React.createElement(Text, null, "Maria Rodriguez"),
      React.createElement(View, { style: s.row }, React.createElement(View, { style: s.side }, ...lines("SKILL", 10)), React.createElement(View, { style: s.main }, ...lines("EXPERIENCE bullet with several words in it number", 10))),
    ),
  );
  return renderToBuffer(el);
}

async function singleColumnDocx(): Promise<Buffer> {
  const { Document, Packer, Paragraph } = await import("docx");
  const doc = new Document({ sections: [{ children: Array.from({ length: 40 }, (_, i) => new Paragraph(`Paragraph ${i + 1} describing warehouse inventory work with a WMS and cycle counts.`)) }] });
  return Packer.toBuffer(doc);
}

describe("parseResume", () => {
  it("detects file types", () => {
    expect(detectFileType("cv.pdf")).toBe("pdf");
    expect(detectFileType("cv.DOCX")).toBe("docx");
    expect(() => detectFileType("cv.txt")).toThrow();
  });

  it("reads a two-column PDF column by column and flags it", async () => {
    const buf = await twoColumnPdf();
    const parsed = await parseResume(buf, "two-col.pdf", "application/pdf");
    expect(parsed.layout.multiColumn).toBe(true);
    const left = parsed.text.indexOf("LEFT line 8");
    const right = parsed.text.indexOf("RIGHT line 1");
    expect(left).toBeGreaterThan(-1);
    expect(right).toBeGreaterThan(left);
  });

  it("detects a narrow sidebar column too", async () => {
    const parsed = await parseResume(await sidebarPdf(), "sidebar.pdf");
    expect(parsed.layout.multiColumn).toBe(true);
    expect(parsed.text.indexOf("SKILL 10")).toBeLessThan(parsed.text.indexOf("EXPERIENCE bullet with several words in it number 1"));
  });

  it("parses DOCX and counts words", async () => {
    const buf = await singleColumnDocx();
    const parsed = await parseResume(buf, "cv.docx");
    expect(parsed.layout.fileType).toBe("docx");
    expect(parsed.layout.words).toBeGreaterThan(300);
    expect(parsed.layout.multiColumn).toBe(false);
    expect(parsed.text).toContain("Paragraph 40");
  });
});
