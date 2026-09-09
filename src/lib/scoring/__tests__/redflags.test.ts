import { describe, expect, it } from "vitest";
import { checkRedFlags } from "../redflags";
import type { JobRequirements } from "@/lib/app/types";

const req = (over: Partial<JobRequirements> = {}): JobRequirements => ({ title: "Coordinator", mustHave: [], niceToHave: [], credentials: [], responsibilities: [], attestations: [], salaryStated: "$55,000", ...over });

describe("checkRedFlags", () => {
  it("recognises US and Canadian work-authorization wording", () => {
    for (const text of ["Must be authorized to work in the United States", "Legally entitled to work in Canada", "Eligible to work in the UK without sponsorship", "Work authorization required"]) {
      expect(checkRedFlags(text, req()).map((f) => f.id)).toContain("authorization");
    }
  });
  it("flags a missing salary once, whichever way it is missing", () => {
    expect(checkRedFlags("Competitive salary", req({ salaryStated: undefined })).filter((f) => f.id.startsWith("salary"))).toHaveLength(1);
    expect(checkRedFlags("No pay details", req({ salaryStated: undefined })).map((f) => f.id)).toContain("salary_absent");
  });
});
