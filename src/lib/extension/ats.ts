/* ------------------------------------------------------------------
   The applicant-tracking systems the extension knows by name. Hosts
   here are mirrored in extension/build.mjs, which writes them into the
   manifest; keep the two lists the same.
------------------------------------------------------------------- */

export type Ats = "greenhouse" | "lever" | "ashby" | "workday" | "other";

export const ATS_HOSTS: Record<Exclude<Ats, "other">, string[]> = {
  greenhouse: ["boards.greenhouse.io", "job-boards.greenhouse.io", "boards.eu.greenhouse.io", "job-boards.eu.greenhouse.io"],
  lever: ["jobs.lever.co", "jobs.eu.lever.co"],
  ashby: ["jobs.ashbyhq.com"],
  workday: ["myworkdayjobs.com", "myworkdaysite.com"],
};

export const ATS_LABEL: Record<Ats, string> = {
  greenhouse: "Greenhouse",
  lever: "Lever",
  ashby: "Ashby",
  workday: "Workday",
  other: "this site",
};

export function detectAts(url: string): Ats {
  let host = "";
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return "other";
  }
  for (const [ats, hosts] of Object.entries(ATS_HOSTS) as [Exclude<Ats, "other">, string[]][]) {
    if (hosts.some((h) => host === h || host.endsWith(`.${h}`))) return ats;
  }
  return "other";
}

/** Where the posting text lives, most specific first. */
export const POSTING_SELECTORS: Record<Ats, string[]> = {
  greenhouse: ["#content", ".job__description", "#app_body", "main"],
  lever: [".posting", ".section-wrapper", "main"],
  ashby: ["[class*='jobPosting']", "main"],
  workday: ["[data-automation-id='jobPostingDescription']", "[data-automation-id='jobPostingPage']", "main"],
  other: ["main", "article", "[role='main']", "#content", ".content"],
};

/** Where the application form lives. */
export const FORM_SELECTORS: Record<Ats, string[]> = {
  greenhouse: ["#application_form", "#application-form", "form#application", "form"],
  lever: ["#application-form", "form.application-form", "form"],
  ashby: ["form"],
  workday: ["[data-automation-id='applyFlowPage']", "form"],
  other: ["form"],
};
