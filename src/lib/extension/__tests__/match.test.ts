import { describe, expect, it } from "vitest";
import { bestMatch, matchScore, tokens, urlKey } from "../match";
import { detectAts } from "../ats";

describe("urlKey", () => {
  it("normalises host and path and drops the query", () => {
    expect(urlKey("https://www.boards.greenhouse.io/acme/jobs/123?gh_src=abc#app")).toBe("boards.greenhouse.io/acme/jobs/123");
    expect(urlKey("https://jobs.lever.co/acme/abc/apply/")).toBe("jobs.lever.co/acme/abc/apply");
    expect(urlKey("not a url")).toBe("");
  });
});

describe("matchScore", () => {
  const app = { url: "https://boards.greenhouse.io/acme/jobs/123", title: "Inventory Lead", company: "Acme Greenhouses" };
  it("is certain when the saved URL is the page", () => {
    expect(matchScore({ url: "https://boards.greenhouse.io/acme/jobs/123?gh_src=x" }, app)).toBe(100);
  });
  it("uses the title and company otherwise", () => {
    expect(matchScore({ url: "https://boards.greenhouse.io/acme/jobs/999", title: "Inventory Lead at Acme Greenhouses" }, app)).toBeGreaterThanOrEqual(80);
    expect(matchScore({ url: "https://example.com/", title: "Forklift Operator" }, app)).toBeLessThan(45);
  });
  it("picks the best application above the threshold", () => {
    const apps = [app, { url: undefined, title: "Forklift Operator", company: "Other Co" }];
    expect(bestMatch(apps, { url: "https://example.com/careers", title: "Forklift Operator - Other Co" })?.app.title).toBe("Forklift Operator");
    expect(bestMatch(apps, { url: "https://example.com/", title: "Home" })).toBeNull();
  });
  it("tokenises without stop words", () => {
    expect(tokens("Apply for the Inventory Lead job")).toEqual(["inventory", "lead"]);
  });
});

describe("detectAts", () => {
  it("recognises the four launch systems by host", () => {
    expect(detectAts("https://boards.greenhouse.io/acme/jobs/1")).toBe("greenhouse");
    expect(detectAts("https://jobs.lever.co/acme/1/apply")).toBe("lever");
    expect(detectAts("https://jobs.ashbyhq.com/acme/1/application")).toBe("ashby");
    expect(detectAts("https://acme.wd5.myworkdayjobs.com/en-US/Careers/job/x")).toBe("workday");
    expect(detectAts("https://example.com/careers")).toBe("other");
  });
});
