import "server-only";
import React from "react";
import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import type { TailoredResume } from "@/lib/app/types";
import { contactLine, dateRange } from "./resume-docx";

/* ATS-safe PDF: single column, real text, Helvetica. */

const s = StyleSheet.create({
  page: { paddingTop: 44, paddingBottom: 44, paddingHorizontal: 50, fontFamily: "Helvetica", fontSize: 10.5, color: "#111111", lineHeight: 1.35 },
  name: { fontSize: 22, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  headline: { fontSize: 12, color: "#444444", marginBottom: 3 },
  contact: { fontSize: 9.5, color: "#555555", marginBottom: 12 },
  h: { fontSize: 11, fontFamily: "Helvetica-Bold", marginTop: 12, marginBottom: 4, paddingBottom: 2, borderBottomWidth: 0.75, borderBottomColor: "#999999", textTransform: "uppercase", letterSpacing: 0.5 },
  row: { flexDirection: "row", justifyContent: "space-between", marginTop: 7 },
  title: { fontFamily: "Helvetica-Bold", fontSize: 11 },
  dates: { fontSize: 9.5, color: "#555555" },
  company: { fontSize: 10, color: "#444444", marginBottom: 2 },
  bulletRow: { flexDirection: "row", marginBottom: 2, paddingRight: 6 },
  dot: { width: 10 },
  bulletText: { flex: 1 },
  skillRow: { flexDirection: "row", marginBottom: 2 },
  skillGroup: { fontFamily: "Helvetica-Bold" },
  para: { marginBottom: 8 },
});

function ResumeDoc({ r }: { r: TailoredResume }) {
  return (
    <Document title={`${r.name} – Resume`} author={r.name} producer="Shortlist">
      <Page size="LETTER" style={s.page}>
        <Text style={s.name}>{r.name}</Text>
        {r.headline ? <Text style={s.headline}>{r.headline}</Text> : null}
        {contactLine(r) ? <Text style={s.contact}>{contactLine(r)}</Text> : null}

        {r.summary ? (
          <View>
            <Text style={s.h}>Summary</Text>
            <Text>{r.summary}</Text>
          </View>
        ) : null}

        {r.experience.length ? <Text style={s.h}>Experience</Text> : null}
        {r.experience.map((e, i) => (
          <View key={i} wrap={false}>
            <View style={s.row}>
              <Text style={s.title}>{e.title}</Text>
              <Text style={s.dates}>{dateRange(e.start, e.end)}</Text>
            </View>
            <Text style={s.company}>{[e.company, e.location].filter(Boolean).join(", ")}</Text>
            {e.bullets.map((b, j) => (
              <View key={j} style={s.bulletRow}>
                <Text style={s.dot}>•</Text>
                <Text style={s.bulletText}>{b}</Text>
              </View>
            ))}
          </View>
        ))}

        {r.skills.length ? <Text style={s.h}>Skills</Text> : null}
        {r.skills.map((g, i) => (
          <View key={i} style={s.skillRow}>
            <Text>
              <Text style={s.skillGroup}>{g.group}: </Text>
              {g.items.join(", ")}
            </Text>
          </View>
        ))}

        {r.education.length ? <Text style={s.h}>Education</Text> : null}
        {r.education.map((ed, i) => (
          <Text key={i}>{[ed.credential, ed.institution, ed.year].filter(Boolean).join(" · ")}</Text>
        ))}

        {r.certifications.length ? <Text style={s.h}>Certifications</Text> : null}
        {r.certifications.map((c, i) => (
          <View key={i} style={s.bulletRow}>
            <Text style={s.dot}>•</Text>
            <Text style={s.bulletText}>{c}</Text>
          </View>
        ))}

        {r.languages.length ? (
          <View>
            <Text style={s.h}>Languages</Text>
            <Text>{r.languages.join(", ")}</Text>
          </View>
        ) : null}
      </Page>
    </Document>
  );
}

function LetterDoc({ letter, r, title, company }: { letter: string; r: TailoredResume; title: string; company?: string }) {
  const date = new Date().toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" });
  return (
    <Document title={`${r.name} – Cover letter`} author={r.name} producer="Shortlist">
      <Page size="LETTER" style={{ ...s.page, fontSize: 11, lineHeight: 1.5 }}>
        <Text style={s.name}>{r.name}</Text>
        {contactLine(r) ? <Text style={s.contact}>{contactLine(r)}</Text> : null}
        <Text style={s.para}>{date}</Text>
        <Text style={{ ...s.para, fontFamily: "Helvetica-Bold" }}>
          Re: {title}
          {company ? ` at ${company}` : ""}
        </Text>
        {letter.split(/\n{2,}/).map((p, i) => (
          <Text key={i} style={s.para}>
            {p.trim()}
          </Text>
        ))}
      </Page>
    </Document>
  );
}

export async function buildResumePdf(r: TailoredResume): Promise<Buffer> {
  return renderToBuffer(<ResumeDoc r={r} />);
}

export async function buildCoverLetterPdf(input: { letter: string; resume: TailoredResume; company?: string; title: string }): Promise<Buffer> {
  return renderToBuffer(<LetterDoc letter={input.letter} r={input.resume} title={input.title} company={input.company} />);
}
