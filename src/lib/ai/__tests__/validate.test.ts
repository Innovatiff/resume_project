import { describe, expect, it } from "vitest";
import { enforceNumbers, findOrphans, sourceNumberKeys } from "../validate";
import { mockExtractProfile, mockParsePosting, mockQuestions, mockRewrite } from "../mock";
import type { TailoredResume } from "@/lib/app/types";

const resumeText = `Maria Rodriguez
Leamington, ON · maria@example.com · 519-555-0100

Summary
Inventory lead with a decade in greenhouse logistics.

Experience
Inventory Lead, Greenhouse Grower Co. (2019 – Present)
• Reduced picking errors by 34% over seven months by introducing weekly cycle counts.
• Managed a WMS across two sites.
• Trained new hires on RF scanners.
Warehouse Associate, 3PL Co. (2015 – 2019)
• Picked and packed orders.

Skills
WMS, Cycle counting, Forklift licence, Excel

Certifications
WHMIS

Languages
English, Spanish`;

const posting = `Logistics Coordinator
Company: Food Distributor Inc.
Windsor, ON · Full-time · Posted 3 days ago
Salary $58,000 - $70,000 per year

Responsibilities
• Coordinate inbound and outbound shipments
• Maintain inventory accuracy in the WMS

Requirements
• 3+ years in a warehouse or logistics role
• Experience with a WMS and cycle counting
• Strong Excel skills
• Scheduling experience
• Valid forklift licence
• Must be legally entitled to work in Canada

Nice to have
• SAP experience is an asset`;

describe("mock extraction", () => {
  it("reconstructs sections, contact details and metric flags", () => {
    const p = mockExtractProfile(resumeText);
    expect(p.name).toBe("Maria Rodriguez");
    expect(p.contact.email).toBe("maria@example.com");
    expect(p.contact.city).toBe("Leamington");
    expect(p.experience.length).toBeGreaterThanOrEqual(2);
    expect(p.experience[0].bullets[0].hasMetric).toBe(true);
    expect(p.experience[0].bullets[1].hasMetric).toBe(false);
    expect(p.skills.map((s) => s.toLowerCase())).toContain("wms");
    expect(p.languages).toContain("Spanish");
  });

  it("parses posting requirements", () => {
    const r = mockParsePosting(posting);
    expect(r.title).toBe("Logistics Coordinator");
    expect(r.city).toBe("Windsor");
    expect(r.salaryStated).toContain("$58,000");
    expect(r.yearsRequired).toBe(3);
    expect(r.postedDaysAgo).toBe(3);
    expect(r.mustHave.length).toBeGreaterThan(2);
    expect(r.credentials.some((c) => /forklift/i.test(c))).toBe(true);
    expect(r.attestations.length).toBeGreaterThan(0);
  });
});

describe("number validation", () => {
  it("accepts figures from the source and interview answers, rejects invented ones", () => {
    const profile = mockExtractProfile(resumeText);
    const allowed = sourceNumberKeys(profile, { q1: "About 120 orders a day" });
    expect(findOrphans("Reduced picking errors 34% over seven months", allowed)).toEqual([]);
    expect(findOrphans("Handled 120 orders a day", allowed)).toEqual([]);
    expect(findOrphans("Saved $250,000 annually", allowed)).toEqual(["$250,000"]);
  });

  it("strips bullets and sentences that contain orphan figures", () => {
    const profile = mockExtractProfile(resumeText);
    const allowed = sourceNumberKeys(profile);
    const resume: TailoredResume = {
      name: "Maria Rodriguez",
      headline: "Logistics Coordinator",
      contact: {},
      summary: "Inventory lead. Cut costs by 48% last year.",
      experience: [{ title: "Inventory Lead", company: "Greenhouse", bullets: ["Reduced picking errors by 34% over seven months.", "Managed a team of 25 people.", "Managed a WMS across two sites."] }],
      skills: [],
      education: [],
      certifications: [],
      languages: [],
    };
    const out = enforceNumbers(resume, "I saved the company $3M.\n\nI led the WMS rollout.", allowed, false);
    expect(out.validation.passed).toBe(false);
    expect(out.validation.orphanNumbers).toEqual(expect.arrayContaining(["48%", "25", "$3M"]));
    expect(out.resume.experience[0].bullets).toEqual(["Reduced picking errors by 34% over seven months.", "Managed a WMS across two sites."]);
    expect(out.resume.summary).toBe("Inventory lead.");
    expect(out.coverLetter).toBe("I led the WMS rollout.");
  });

  it("mock rewrite never introduces new figures", () => {
    const profile = mockExtractProfile(resumeText);
    const req = mockParsePosting(posting);
    const questions = mockQuestions(profile, req);
    const answers = Object.fromEntries(questions.map((q) => [q.id, "roughly 400 orders a week"]));
    const { resume, coverLetter } = mockRewrite({ profile, req, answers, questions, strategy: "standard" });
    const allowed = sourceNumberKeys(profile, answers);
    const out = enforceNumbers(resume, coverLetter, allowed, false);
    expect(out.validation.passed).toBe(true);
    expect(out.validation.removedBullets).toBe(0);
  });
});
