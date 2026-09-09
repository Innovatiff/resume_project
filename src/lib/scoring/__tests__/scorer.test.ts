import { describe, expect, it } from "vitest";
import { scoreResume, verdictFor } from "../scorer";
import { checkRedFlags } from "../redflags";
import type { CandidateProfile, JobRequirements, LayoutFlags } from "@/lib/app/types";

const layout: LayoutFlags = { fileType: "docx", pages: 1, words: 420, multiColumn: false, tables: false, images: false, noText: false };

const profile: CandidateProfile = {
  name: "Maria Rodriguez",
  headline: "Inventory Lead",
  contact: { email: "maria@example.com", phone: "519-555-0100", city: "Leamington", province: "ON" },
  summary: "Ten years in warehouse and inventory operations.",
  experience: [
    {
      title: "Inventory Lead",
      company: "Greenhouse Grower Co.",
      start: "2019",
      end: "Present",
      current: true,
      bullets: [
        { text: "Reduced picking errors by 34% over seven months by introducing weekly cycle counts.", metrics: ["34%", "7"], hasMetric: true },
        { text: "Managed a WMS across two sites.", metrics: [], hasMetric: false },
        { text: "Trained new hires on RF scanners and safety procedures.", metrics: [], hasMetric: false },
      ],
    },
    { title: "Warehouse Associate", company: "3PL Co.", start: "2015", end: "2019", current: false, bullets: [{ text: "Picked and packed orders.", metrics: [], hasMetric: false }] },
  ],
  skills: ["WMS", "Cycle counting", "Forklift licence", "Excel"],
  education: [{ credential: "High school diploma" }],
  certifications: ["WHMIS"],
  languages: ["English", "Spanish"],
};

const req: JobRequirements = {
  title: "Logistics Coordinator",
  city: "Windsor",
  province: "ON",
  remote: false,
  mustHave: ["WMS", "Cycle counting", "Excel", "Scheduling"],
  niceToHave: ["SAP"],
  credentials: ["Forklift licence"],
  responsibilities: ["Coordinate inbound and outbound shipments"],
  attestations: [],
  yearsRequired: 3,
};

describe("scoreResume", () => {
  it("is deterministic and publishes a breakdown that sums to the score", () => {
    const a = scoreResume(profile, req, layout);
    const b = scoreResume(profile, req, layout);
    expect(a).toEqual(b);
    const sum = a.breakdown.reduce((s, c) => s + c.points, 0);
    expect(Math.round(sum)).toBe(a.score);
    expect(a.breakdown.every((c) => c.points <= c.max && c.points >= 0)).toBe(true);
  });

  it("finds the missing must-have and names it in the reasons", () => {
    const r = scoreResume(profile, req, layout);
    expect(r.missingMustHave).toEqual(["Scheduling"]);
    expect(r.reasons.join(" ")).toContain("Scheduling");
    expect(r.reasons).toHaveLength(3);
  });

  it("penalises a two-column layout and says so", () => {
    const flat = scoreResume(profile, req, layout);
    const cols = scoreResume(profile, req, { ...layout, multiColumn: true });
    expect(cols.score).toBeLessThan(flat.score);
    expect(cols.reasons.some((x) => /two-column/i.test(x))).toBe(true);
  });

  it("rewards quantified outcomes", () => {
    const noMetrics = { ...profile, experience: profile.experience.map((e) => ({ ...e, bullets: e.bullets.map((b) => ({ ...b, hasMetric: false, metrics: [] })) })) };
    expect(scoreResume(noMetrics, req, layout).score).toBeLessThan(scoreResume(profile, req, layout).score);
  });

  it("maps scores to verdicts at 85 and 70", () => {
    expect(verdictFor(85)).toBe("apply");
    expect(verdictFor(84)).toBe("borderline");
    expect(verdictFor(70)).toBe("borderline");
    expect(verdictFor(69)).toBe("skip");
  });
});

describe("checkRedFlags", () => {
  it("flags commission-only, missing salary and stale postings", () => {
    const flags = checkRedFlags("Commission-only role. Must be legally entitled to work in Canada. Posted 94 days ago.", { ...req, salaryStated: undefined, postedDaysAgo: 94 });
    const ids = flags.map((f) => f.id);
    expect(ids).toContain("commission_only");
    expect(ids).toContain("salary_absent");
    expect(ids).toContain("stale");
    expect(ids).toContain("authorization");
    expect(flags[0].severity).toBe("high");
  });

  it("does not flag salary when a range is stated", () => {
    const flags = checkRedFlags("Salary $62,000 - $78,000 per year.", { ...req, salaryStated: "$62,000 - $78,000" });
    expect(flags.some((f) => f.id.startsWith("salary"))).toBe(false);
  });
});
