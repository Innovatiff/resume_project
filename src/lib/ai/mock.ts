import type { CandidateProfile, InterviewPrep, JobRequirements, LinkedInRewrite, MetricQuestion, ObjectionReport, Strategy, TailoredResume } from "@/lib/app/types";
import { detectCountry, marketFor } from "@/lib/app/markets";
import { extractNumbers, normalize, phraseIn, tokens } from "@/lib/scoring/text";

/* ------------------------------------------------------------------
   Deterministic stand-ins for the model, used when SHORTLIST_AI_MOCK=1
   or no API key is present outside production. They follow the same
   rules as the real prompts: nothing is invented, no new figures.
------------------------------------------------------------------- */

/** "City, Region" with a Canadian province, US state or Australian state (code or name). */
const LOCATION_RE = /([A-Z][a-zA-Z.' -]+),\s*(ON|Ontario|QC|Qu[eé]bec|BC|British Columbia|AB|Alberta|MB|Manitoba|SK|Saskatchewan|NS|Nova Scotia|NB|New Brunswick|PE|Prince Edward Island|NL|Newfoundland|AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|DC|California|Texas|Florida|New York|Michigan|Ohio|Illinois|Washington|Georgia|Arizona|Colorado|Massachusetts|Pennsylvania|NSW|VIC|QLD|TAS|ACT|Queensland|New South Wales)\b/;

const SECTION_RE = /^(summary|profile|professional summary|objective|experience|work experience|employment history|work history|professional experience|education|skills|core skills|technical skills|key skills|certifications?|licen[cs]es? (?:and|&) certifications?|languages?|projects|volunteer(?:ing)?)\b[:\s]*$/i;

const KNOWN_SKILLS = ["wms", "erp", "sap", "oracle", "excel", "microsoft office", "google sheets", "forklift", "cycle counting", "inventory", "scheduling", "dispatch", "customer service", "crm", "salesforce", "quickbooks", "sql", "python", "javascript", "typescript", "react", "aws", "autocad", "solidworks", "lean", "six sigma", "kaizen", "5s", "whmis", "first aid", "cpr", "bilingual", "french", "spanish", "english", "payroll", "accounts payable", "accounts receivable", "bookkeeping", "logistics", "supply chain", "procurement", "purchasing", "kpi", "reporting", "power bi", "tableau", "safety", "ohsa", "training", "onboarding", "3pl", "shipping", "receiving", "rf scanner", "cycle count", "route planning", "fleet", "transportation", "class az", "class dz", "g licence", "warehouse", "budget", "forecasting", "planning", "coordination", "compliance", "audit", "quality", "iso 9001", "haccp", "gmp"];

export function mockExtractProfile(text: string): CandidateProfile {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const email = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/)?.[0];
  const phone = text.match(/(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/)?.[0];
  const cityMatch = text.match(LOCATION_RE);
  const linkedin = text.match(/linkedin\.com\/in\/[\w-]+/i)?.[0];

  const name = lines.find((l) => l.length < 40 && /^[A-Z][a-zA-Z'.-]+(?: [A-Z][a-zA-Z'.-]+){1,3}$/.test(l) && !/resume|curriculum/i.test(l));

  // Split into sections by heading lines.
  const sections: Record<string, string[]> = { _top: [] };
  let current = "_top";
  for (const l of lines) {
    const m = l.match(SECTION_RE);
    if (m) {
      const key = m[1].toLowerCase();
      current = /experience|employment|history/.test(key) ? "experience" : /education/.test(key) ? "education" : /skill/.test(key) ? "skills" : /certif|licen/.test(key) ? "certifications" : /language/.test(key) ? "languages" : /summary|profile|objective/.test(key) ? "summary" : key;
      sections[current] = sections[current] ?? [];
      continue;
    }
    sections[current].push(l);
  }

  const summary = (sections.summary ?? []).join(" ").trim() || undefined;

  const experience: CandidateProfile["experience"] = [];
  const expLines = sections.experience ?? [];
  let cur: CandidateProfile["experience"][number] | null = null;
  const dateRe = /((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*\d{4}|\d{4})\s*(?:–|-|to|—)\s*((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*\d{4}|\d{4}|present|current|now)/i;
  for (const l of expLines) {
    const isBullet = /^[•\-*·▪–]\s*/.test(l);
    const dm = l.match(dateRe);
    if (!isBullet && (dm || /^(.+?)\s*(?:,|–|-|\|)\s*(.+)$/.test(l)) && l.length < 120 && !/[.!?]$/.test(l)) {
      const head = l.replace(dateRe, "").replace(/[()]/g, "").trim();
      const parts = head.split(/\s*(?:,|–|—|\||-)\s*/).filter(Boolean);
      if (dm || parts.length >= 2) {
        cur = { title: parts[0] ?? head, company: parts[1] ?? "", location: parts[2], start: dm?.[1], end: dm?.[2], current: dm ? /present|current|now/i.test(dm[2]) : false, bullets: [] };
        experience.push(cur);
        continue;
      }
    }
    const textLine = l.replace(/^[•\-*·▪–]\s*/, "");
    if (!cur) {
      cur = { title: "Experience", company: "", bullets: [], current: false };
      experience.push(cur);
    }
    const metrics = extractNumbers(textLine);
    cur.bullets.push({ text: textLine, metrics, hasMetric: metrics.length > 0 });
  }

  const skillsRaw = (sections.skills ?? []).join(", ");
  const listed = dedupe(skillsRaw.split(/[,•|;\n]/).map((s) => s.replace(/^[-*·]\s*/, "").trim()).filter((s) => s && s.length < 40));
  const listedNorm = listed.map(normalize);
  const inferred = KNOWN_SKILLS.filter((k) => phraseIn(k, normalize(text)) && !listedNorm.some((l) => l.includes(k) || k.includes(l) || l.replace(/s$/, "") === k.replace(/s$/, ""))).map(titleCase);
  const skills = dedupe([...listed, ...inferred]);

  const education = (sections.education ?? []).filter((l) => l.length < 140).map((l) => {
    const year = l.match(/(19|20)\d{2}/)?.[0];
    const parts = l.split(/\s*(?:,|–|—|\|)\s*/);
    return { credential: parts[0]?.trim() ?? l, institution: parts[1]?.trim(), year };
  });
  const certifications = (sections.certifications ?? []).map((l) => l.replace(/^[•\-*·▪–]\s*/, "")).filter((l) => l.length < 100);
  const languages = dedupe([...(sections.languages ?? []).join(",").split(/[,/|]/).map((s) => s.trim()).filter((s) => s && s.length < 30), ...["English", "French", "Spanish"].filter((l) => new RegExp(`\\b${l}\\b`, "i").test(text))]);

  const profile: CandidateProfile = {
    name,
    headline: experience[0]?.title,
    contact: { email, phone, city: cityMatch?.[1]?.trim(), province: cityMatch?.[2], country: detectCountry(text.slice(0, 600)), linkedin },
    summary,
    experience,
    skills,
    education,
    certifications,
    languages,
  };
  return profile;
}

export function mockParsePosting(text: string): JobRequirements {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const titleLine = lines.find((l) => /^(job )?title\s*:/i.test(l))?.replace(/^(job )?title\s*:\s*/i, "") ?? lines[0] ?? "Role";
  const title = titleLine.replace(/\s*[-–|].*$/, "").slice(0, 80);
  const company = text.match(/(?:^|\n)\s*(?:company|employer)\s*:\s*(.+)/i)?.[1]?.trim() ?? text.match(/\bat\s+([A-Z][\w&.' -]{2,40}?)(?:\s+(?:in|is|are|,|\.|\n))/)?.[1]?.trim();
  const loc = text.match(LOCATION_RE);
  const salaryStated = text.match(/\$\s?\d{2,3}(?:,\d{3})?(?:\.\d+)?(?:\s?(?:k|K))?(?:\s*(?:–|-|to)\s*\$?\s?\d{2,3}(?:,\d{3})?(?:\.\d+)?(?:\s?(?:k|K))?)?(?:\s*(?:per|\/|an?)\s*(?:year|hour|hr|annum))?/)?.[0];
  const years = text.match(/(\d+)\s*\+?\s*(?:years|yrs)/i);
  const posted = text.match(/posted\s+(\d+)\s+days?\s+ago/i);
  const norm = normalize(text);

  const mustHave: string[] = [];
  const niceToHave: string[] = [];
  const credentials: string[] = [];
  const attestations: string[] = [];
  let bucket: "must" | "nice" | "resp" = "resp";
  const responsibilities: string[] = [];
  for (const l of lines) {
    if (/^(requirements|qualifications|what you bring|must have|you have|skills)/i.test(l)) {
      bucket = "must";
      continue;
    }
    if (/^(nice to have|assets|preferred|bonus)/i.test(l)) {
      bucket = "nice";
      continue;
    }
    if (/^(responsibilities|duties|what you will do|the role|about the role)/i.test(l)) {
      bucket = "resp";
      continue;
    }
    if (/^[•\-*·▪–]\s*/.test(l)) {
      const item = l.replace(/^[•\-*·▪–]\s*/, "").replace(/\.$/, "");
      const short = item.length > 70 ? item.split(/[,;(]/)[0].trim() : item;
      if (/(?:entitled|eligible|authori[sz]ed) to work|work (?:permit|authori[sz]ation)|background check|criminal record/i.test(item)) continue;
      if (/licen[cs]e|certif|degree|diploma|ticket/i.test(item)) credentials.push(short.replace(/^(?:valid|current|active)\s+/i, ""));
      else if (/asset|preferred|bonus|nice to have/i.test(item)) niceToHave.push(...keywordsIn(short.replace(/\s*(?:is )?(?:an asset|preferred|a plus).*$/i, "")));
      else if (bucket === "must") mustHave.push(...keywordsIn(short));
      else if (bucket === "nice") niceToHave.push(...keywordsIn(short));
      else responsibilities.push(short);
    }
  }
  for (const k of KNOWN_SKILLS) if (phraseIn(k, norm) && !mustHave.some((m) => phraseIn(k, normalize(m)))) mustHave.push(titleCase(k));
  const country = detectCountry(text);
  if (/(?:entitled|eligible|authori[sz]ed) to work|work (?:permit|authori[sz]ation)|permanent resident/i.test(text)) attestations.push(country ? `Legally entitled to work in ${/^(United|Netherlands)/.test(marketFor(country).name) ? "the " : ""}${marketFor(country).name}` : "Work authorization");
  if (/background check|criminal record|police check/i.test(text)) attestations.push("Background or record check");
  if (/driver'?s? licen[cs]e|class g|valid licen[cs]e/i.test(text)) attestations.push("Valid driver's licence");

  return {
    title,
    company: company?.slice(0, 60),
    location: loc ? `${loc[1]}, ${loc[2]}` : undefined,
    city: loc?.[1]?.trim(),
    province: loc?.[2],
    country,
    remote: /\bremote\b/i.test(text),
    employmentType: text.match(/\b(full[- ]time|part[- ]time|contract|permanent|temporary|seasonal)\b/i)?.[1],
    salaryStated,
    yearsRequired: years ? Number(years[1]) : undefined,
    mustHave: dedupe(mustHave).slice(0, 14),
    niceToHave: dedupe(niceToHave).slice(0, 8),
    credentials: dedupe(credentials).slice(0, 5),
    responsibilities: responsibilities.slice(0, 10),
    postedDaysAgo: posted ? Number(posted[1]) : undefined,
    attestations,
  };
}

/** Reduce a requirement sentence to the concrete things it names. */
function keywordsIn(sentence: string): string[] {
  const norm = normalize(sentence);
  const hits = KNOWN_SKILLS.filter((k) => phraseIn(k, norm)).map(titleCase);
  if (hits.length) return hits;
  const cleaned = sentence.replace(/^\d+\+?\s*(?:years|yrs)?\s*(?:of)?\s*(?:experience)?\s*(?:in|with)?\s*/i, "").replace(/\s*(?:experience|skills?)\b.*$/i, "").trim();
  const words = cleaned.split(/\s+/);
  return cleaned && words.length <= 4 ? [cleaned] : [words.slice(0, 4).join(" ")];
}

export function mockQuestions(profile: CandidateProfile, req: JobRequirements): MetricQuestion[] {
  const reqTokens = new Set(tokens([req.title, ...req.mustHave, ...req.responsibilities].join(" ")));
  const scored: { ei: number; bi: number; text: string; score: number }[] = [];
  profile.experience.forEach((e, ei) =>
    e.bullets.forEach((b, bi) => {
      if (b.hasMetric) return;
      const overlap = tokens(b.text).filter((t) => reqTokens.has(t)).length;
      scored.push({ ei, bi, text: b.text, score: overlap + (ei === 0 ? 1 : 0) });
    }),
  );
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 3).map((s, i) => ({
    id: `q${i + 1}`,
    experienceIndex: s.ei,
    bulletIndex: s.bi,
    bullet: s.text,
    question: `You mention “${s.text.length > 70 ? s.text.slice(0, 67) + "…" : s.text}”. By how much, over what period, or for how many people or units?`,
    why: "This bullet maps to something the posting asks for, but it reads as a duty. A real figure turns it into a result.",
  }));
}

export function mockRewrite(input: { profile: CandidateProfile; req: JobRequirements; answers: Record<string, string>; questions: MetricQuestion[]; strategy: Strategy; company?: string }): { resume: TailoredResume; coverLetter: string } {
  const { profile, req } = input;
  const reqTokens = new Set(tokens([req.title, ...req.mustHave, ...req.niceToHave, ...req.responsibilities].join(" ")));
  const answerFor = new Map<string, string>();
  for (const q of input.questions) {
    const a = input.answers[q.id]?.trim();
    if (a) answerFor.set(`${q.experienceIndex}:${q.bulletIndex}`, a);
  }

  const experience = profile.experience.map((e, ei) => {
    const bullets = e.bullets
      .map((b, bi) => {
        const a = answerFor.get(`${ei}:${bi}`);
        const text = a ? `${b.text.replace(/\.$/, "")} (${a.replace(/\.$/, "")})` : b.text;
        const overlap = tokens(b.text).filter((t) => reqTokens.has(t)).length;
        return { text: capitalize(text), score: overlap + (b.hasMetric || a ? 2 : 0) };
      })
      .sort((x, y) => y.score - x.score)
      .map((x) => x.text);
    return { title: e.title, company: e.company, location: e.location, start: e.start, end: e.current ? "Present" : e.end, bullets };
  });

  const matched = req.mustHave.filter((k) => phraseIn(k, normalize([profile.skills.join(" "), ...profile.experience.flatMap((e) => e.bullets.map((b) => b.text))].join(" "))));
  const otherSkills = profile.skills.filter((s) => !matched.some((m) => normalize(m) === normalize(s)));
  const skills = [
    ...(matched.length ? [{ group: "Core", items: dedupe(matched) }] : []),
    ...(otherSkills.length ? [{ group: "Also", items: dedupe(otherSkills).slice(0, 14) }] : []),
  ];

  const yearsText = profile.totalYears ? `${profile.totalYears} years` : "years";
  const firstTitle = profile.experience[0]?.title ?? "professional";
  const summary = profile.summary
    ? profile.summary
    : `${firstTitle} with ${yearsText} of experience in ${(matched.slice(0, 3).join(", ") || "the field").toLowerCase()}. Looking to bring that record to the ${req.title} role${req.company ? ` at ${req.company}` : ""}.`;

  const resume: TailoredResume = {
    name: profile.name ?? "Candidate",
    headline: `${req.title}${matched[0] ? ` · ${matched[0]}` : ""}`,
    contact: { email: profile.contact.email, phone: profile.contact.phone, city: [profile.contact.city, profile.contact.province].filter(Boolean).join(", ") || undefined, linkedin: profile.contact.linkedin },
    summary,
    experience,
    skills,
    education: profile.education,
    certifications: profile.certifications,
    languages: profile.languages,
  };

  const company = input.company ?? req.company ?? "your team";
  const strongest = experience[0]?.bullets[0] ?? "the work described in my resume";
  const gap = req.mustHave.find((k) => !matched.includes(k));
  const paragraphs = [
    `Dear Hiring Manager,\n\nI am applying for the ${req.title} role at ${company}. My background as ${firstTitle.toLowerCase().startsWith("a") ? "an" : "a"} ${firstTitle} covers the core of what the posting describes${matched.length ? `, including ${dedupe(matched).slice(0, 3).join(", ").toLowerCase()}` : ""}.`,
    input.strategy === "long_shot" && gap
      ? `I want to be direct about one gap: the posting asks for ${gap.toLowerCase()}, which I have not done in that exact form. What I bring instead is closely related work, for example: ${strongest.replace(/\.$/, "").toLowerCase()}. I would close the remaining distance quickly and would rather say so than paper over it.`
      : `The most relevant evidence from my record: ${strongest.replace(/\.$/, "")}. That is the kind of result I would aim to repeat for ${company}.`,
    `I would welcome a short conversation about how I could contribute. Thank you for your consideration.\n\nSincerely,\n${resume.name}`,
  ];
  return { resume, coverLetter: paragraphs.join("\n\n") };
}

export function mockPrep(profile: CandidateProfile, req: JobRequirements): InterviewPrep {
  const bullets = profile.experience.flatMap((e) => e.bullets.map((b) => b.text));
  const evidence = (i: number) => bullets[i % Math.max(1, bullets.length)] ?? "Your experience section";
  const asks = req.mustHave.slice(0, 4);
  const questions = [
    { question: `Walk me through your experience with ${asks[0] ?? "the core of this role"}.`, angle: "Depth on the top requirement.", evidence: evidence(0) },
    { question: "Tell me about a time you improved a process. What changed and how do you know?", angle: "Whether you measure outcomes.", evidence: evidence(1) },
    { question: `Why ${req.company ?? "this company"}, and why this role now?`, angle: "Motivation and retention risk.", evidence: profile.summary ?? evidence(2) },
    { question: "Describe a mistake you made and what you did next.", angle: "Ownership and judgement.", evidence: evidence(3) },
    { question: `How would you handle ${req.responsibilities[0]?.toLowerCase() ?? "a high-volume day"} under pressure?`, angle: "Operational realism.", evidence: evidence(4) },
    { question: "What would you need from us in the first 30 days?", angle: "Self-awareness and onboarding fit.", evidence: evidence(5) },
  ];
  return {
    questions,
    storiesToPrepare: bullets.slice(0, 3).map((b) => `A story behind: ${b}`),
    questionsToAsk: ["What does success look like in this role after 90 days?", "How is the team staffed, and what has turnover looked like?", `Which systems will I work in day to day${asks[0] ? ` besides ${asks[0]}` : ""}?`, "How is pay reviewed, and on what cycle?"],
  };
}

export function mockObjections(profile: CandidateProfile, req: JobRequirements, missing: string[]): ObjectionReport {
  const objections: ObjectionReport["objections"] = missing.slice(0, 3).map((m) => ({
    objection: `No explicit ${m} experience on the resume.`,
    likelihood: "high" as const,
    counter: `Point to the closest real work you have done and name the tool or method you used; if you have used ${m} informally, say where.`,
  }));
  if (profile.experience.length && !phraseIn(req.title, normalize(profile.experience.map((e) => e.title).join(" ")))) {
    objections.push({ objection: `Titles do not match “${req.title}”.`, likelihood: "medium", counter: "Explain the scope of your actual role in the first sentence of the cover letter, in the posting's own words." });
  }
  objections.push({ objection: "Reasons for leaving recent roles.", likelihood: "low", counter: "Prepare one factual sentence per move; no blame." });
  return { objections };
}

export function mockLinkedIn(profile: CandidateProfile, req: JobRequirements): LinkedInRewrite {
  const first = profile.experience[0];
  const skills = profile.skills.slice(0, 3).join(", ");
  return {
    headline: `${first?.title ?? req.title}${skills ? ` · ${skills}` : ""}`.slice(0, 120),
    about: `${profile.summary ?? `I work in ${first?.title?.toLowerCase() ?? "operations"}.`} Most of my experience is with ${skills || "the systems and people that keep an operation running"}. I am currently looking at ${req.title.toLowerCase()} roles${req.city ? ` around ${req.city}` : ""}, and I am happy to talk to teams that need someone who can show their work.`,
  };
}

function dedupe(list: string[]): string[] {
  const seen = new Set<string>();
  return list.filter((s) => {
    const k = normalize(s);
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function titleCase(s: string): string {
  if (/^[a-z]{2,4}$/.test(s)) return s.toUpperCase();
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
