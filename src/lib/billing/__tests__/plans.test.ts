import { describe, expect, it } from "vitest";
import { featuresFor } from "../plans";

describe("featuresFor", () => {
  it("gives the extension to the passes only", () => {
    expect(featuresFor(null).extension).toBe(false);
    expect(featuresFor("single").extension).toBe(false);
    expect(featuresFor("pass").extension).toBe(true);
    expect(featuresFor("landed").extension).toBe(true);
  });
  it("keeps the tracker and the extension together", () => {
    for (const plan of ["single", "pass", "landed"] as const) expect(featuresFor(plan).extension).toBe(featuresFor(plan).tracker);
  });
});
