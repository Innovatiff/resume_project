import "server-only";
import type { Application, ExtensionApplication, ExtensionFillData, UserDoc } from "@/lib/app/types";
import { MARKETS, type CountryCode } from "@/lib/app/markets";
import { splitName } from "./fields";

/* Server-side shaping of what the extension is allowed to see. */

const EXTRA_NAMES: Partial<Record<CountryCode, string[]>> = {
  US: ["United States of America", "USA", "U.S.", "U.S.A."],
  GB: ["UK", "Great Britain", "England"],
  NL: ["The Netherlands", "Holland"],
  IE: ["Republic of Ireland"],
  NZ: ["Aotearoa New Zealand"],
};

const CA_PROVINCES: Record<string, string> = { AB: "Alberta", BC: "British Columbia", MB: "Manitoba", NB: "New Brunswick", NL: "Newfoundland and Labrador", NS: "Nova Scotia", NT: "Northwest Territories", NU: "Nunavut", ON: "Ontario", PE: "Prince Edward Island", QC: "Quebec", SK: "Saskatchewan", YT: "Yukon" };
const US_STATES: Record<string, string> = { AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California", CO: "Colorado", CT: "Connecticut", DE: "Delaware", DC: "District of Columbia", FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming" };

/** "ON" becomes ["Ontario", "ON"]; a full name is kept as written, with its code added when we know it. */
export function provinceAliases(province?: string): string[] {
  const v = (province ?? "").trim();
  if (!v) return [];
  const code = v.toUpperCase().replace(/\./g, "");
  const name = CA_PROVINCES[code] ?? US_STATES[code];
  if (name) return [name, code];
  const entry = [...Object.entries(CA_PROVINCES), ...Object.entries(US_STATES)].find(([, n]) => n.toLowerCase() === v.toLowerCase());
  return entry ? [entry[1], entry[0]] : [v];
}

/** Display names to try on a country select, most common first, then the code. */
export function countryAliases(code?: CountryCode): string[] {
  if (!code || code === "OTHER") return [];
  return [MARKETS[code].name, ...(EXTRA_NAMES[code] ?? []), code];
}

export function toExtensionApplication(a: Application): ExtensionApplication {
  const p = a.payReport;
  return {
    id: a.id,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
    status: a.status,
    title: a.posting.title,
    company: a.posting.company,
    location: a.posting.location,
    url: a.posting.url,
    score: a.score.score,
    verdict: a.score.verdict,
    scoreAfter: a.package?.scoreAfter.score,
    hasPackage: Boolean(a.package),
    reasons: a.score.reasons.slice(0, 3),
    redFlags: a.redFlags.length,
    pay: p?.available ? { low: p.low, median: p.median, high: p.high, currency: p.currency } : undefined,
    filledAt: a.extension?.filledAt,
  };
}

function linkedinUrl(v?: string): string | undefined {
  const s = (v ?? "").trim();
  if (!s) return undefined;
  return /^https?:\/\//i.test(s) ? s : `https://${s.replace(/^\/+/, "")}`;
}

/** Everything the content script may type: facts from the package and the profile, never a guess. */
export function buildFillData(app: Application, doc: UserDoc): ExtensionFillData {
  const pkg = app.package;
  if (!pkg) throw new Error("buildFillData needs a built package");
  const resume = pkg.resume;
  const profile = doc.profile;
  const fullName = (resume.name || profile?.name || doc.displayName || "").trim();
  const { first, last } = splitName(fullName);
  const home = doc.country ?? profile?.contact.country;
  const current = profile?.experience.find((e) => e.current) ?? profile?.experience[0];
  const p = app.payReport;
  const base = `/api/extension/applications/${app.id}/documents`;
  return {
    applicationId: app.id,
    status: app.status,
    posting: { title: app.posting.title, company: app.posting.company, url: app.posting.url },
    candidate: {
      fullName,
      firstName: first,
      lastName: last,
      email: resume.contact.email ?? profile?.contact.email ?? doc.email,
      phone: resume.contact.phone ?? profile?.contact.phone,
      city: resume.contact.city ?? doc.city ?? profile?.contact.city,
      province: doc.province ?? profile?.contact.province,
      provinceNames: provinceAliases(doc.province ?? profile?.contact.province),
      country: home,
      countryNames: countryAliases(home),
      linkedin: linkedinUrl(resume.contact.linkedin ?? profile?.contact.linkedin),
      currentTitle: current?.title,
      currentCompany: current?.company,
    },
    coverLetter: pkg.coverLetter,
    attestations: app.requirements.attestations ?? [],
    pay: p?.available ? { low: p.low, median: p.median, high: p.high, currency: p.currency } : undefined,
    documents: {
      resumePdf: `${base}?type=resume&format=pdf`,
      resumeDocx: `${base}?type=resume&format=docx`,
      coverPdf: `${base}?type=cover&format=pdf`,
      coverDocx: `${base}?type=cover&format=docx`,
    },
  };
}
