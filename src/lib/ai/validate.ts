import type { CandidateProfile, NumberValidation, TailoredResume } from "@/lib/app/types";
import { extractNumbers, numberKey } from "@/lib/scoring/text";

/* ------------------------------------------------------------------
   Rule 1, enforced in code: every figure in the output must exist in
   the source (the candidate's own resume plus their interview answers).
------------------------------------------------------------------- */

export function sourceNumberKeys(profile: CandidateProfile, answers: Record<string, string> = {}, extraSources: string[] = []): Set<string> {
  const text = [
    profile.summary ?? "",
    profile.headline ?? "",
    ...profile.experience.flatMap((e) => [e.title, e.company, e.start ?? "", e.end ?? "", ...e.bullets.map((b) => b.text)]),
    ...profile.skills,
    ...profile.certifications,
    ...profile.education.flatMap((e) => [e.credential, e.year ?? ""]),
    ...Object.values(answers),
    ...extraSources,
  ].join("\n");
  return new Set(extractNumbers(text).map(numberKey));
}

export function findOrphans(text: string, allowed: Set<string>): string[] {
  const orphans: string[] = [];
  for (const fig of extractNumbers(text)) {
    const key = numberKey(fig);
    if (!allowed.has(key) && !isBenign(fig)) orphans.push(fig);
  }
  return orphans;
}

/** Plain list numbering or years that appear as dates are not achievements. */
function isBenign(fig: string): boolean {
  const n = fig.replace(/[^0-9.]/g, "");
  if (/^(19|20)\d{2}$/.test(n)) return true; // a year
  return false;
}

export interface ResumeValidationOutcome {
  resume: TailoredResume;
  coverLetter: string;
  validation: NumberValidation;
}

/**
 * Validate a rewrite against the allowed figures. Bullets and sentences with
 * orphan figures are removed rather than delivered. Returns the cleaned output.
 */
export function enforceNumbers(resume: TailoredResume, coverLetter: string, allowed: Set<string>, retried: boolean): ResumeValidationOutcome {
  const orphans = new Set<string>();
  let removed = 0;

  const experience = resume.experience.map((e) => {
    const bullets = e.bullets.filter((b) => {
      const o = findOrphans(b, allowed);
      if (o.length) {
        o.forEach((x) => orphans.add(x));
        removed++;
        return false;
      }
      return true;
    });
    return { ...e, bullets };
  });

  const summaryOrphans = findOrphans(resume.summary, allowed);
  let summary = resume.summary;
  if (summaryOrphans.length) {
    summaryOrphans.forEach((x) => orphans.add(x));
    summary = stripSentencesWithNumbers(summary, allowed);
    removed++;
  }

  const headlineOrphans = findOrphans(resume.headline, allowed);
  let headline = resume.headline;
  if (headlineOrphans.length) {
    headlineOrphans.forEach((x) => orphans.add(x));
    headline = headline.replace(/[^.]*\d[^.]*/g, "").trim() || resume.headline.replace(/\d[\d,.%$kKmM+]*/g, "").replace(/\s+/g, " ").trim();
    removed++;
  }

  const letterOrphans = findOrphans(coverLetter, allowed);
  let letter = coverLetter;
  if (letterOrphans.length) {
    letterOrphans.forEach((x) => orphans.add(x));
    letter = stripSentencesWithNumbers(coverLetter, allowed);
    removed++;
  }

  return {
    resume: { ...resume, experience, summary, headline },
    coverLetter: letter,
    validation: { passed: orphans.size === 0, orphanNumbers: [...orphans], removedBullets: removed, retried },
  };
}

function stripSentencesWithNumbers(text: string, allowed: Set<string>): string {
  return text
    .split(/(?<=[.!?])\s+/)
    .filter((s) => findOrphans(s, allowed).length === 0)
    .join(" ")
    .trim();
}
