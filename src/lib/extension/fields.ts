/* ------------------------------------------------------------------
   Form-field classification shared by the browser extension and its
   tests. DOM-free: the content script reads each field's label, name,
   id, placeholder, autocomplete and type, and this module decides what
   the extension may do with it.

   fill  a fact from the candidate's profile or package
   hint  left empty; the pay report is shown beside it (salary asks)
   skip  left empty, nothing said (how did you hear, start date, custom
         questions, anything the extension does not understand)
   flag  never pre-filled and marked in red for the candidate to answer
         themselves: legal attestations (rule 4) and voluntary
         self-identification
------------------------------------------------------------------- */

export type FieldKind =
  | "first_name"
  | "last_name"
  | "full_name"
  | "email"
  | "phone"
  | "city"
  | "province"
  | "postal"
  | "country"
  | "address"
  | "linkedin"
  | "github"
  | "website"
  | "resume"
  | "cover_letter"
  | "current_company"
  | "current_title"
  | "salary"
  | "referral"
  | "start_date"
  | "pronouns"
  | "custom"
  | "attestation"
  | "self_id";

export type FieldAction = "fill" | "hint" | "skip" | "flag";

export interface FieldMeta {
  label?: string;
  name?: string;
  id?: string;
  placeholder?: string;
  autocomplete?: string;
  /** Input type, or "textarea" | "select" | "radio" | "checkbox" | "file". */
  type?: string;
}

export interface Classification {
  kind: FieldKind;
  action: FieldAction;
  /** Why a field is flagged, in the candidate's words. */
  reason?: string;
}

/** Legal attestations. Never pre-filled, always flagged. */
const LEGAL: [RegExp, string][] = [
  [/\b(?:legally|lawfully)\b|authori[sz]ed to work|eligib(?:le|ility) to work|entitled to work|work (?:permit|authori[sz]ation|eligibility)|right to work|employment eligibility/i, "Work authorization"],
  [/\bsponsor(?:ship)?\b|\bvisa\b|immigration|work status/i, "Sponsorship or immigration status"],
  [/citizen(?:ship)?|permanent resident|green card|\bnationality\b/i, "Citizenship or residency"],
  [/criminal|conviction|convicted|felon|misdemean|police (?:record|check)|record check|background (?:check|screen)|vulnerable sector/i, "Criminal record or background check"],
  [/licen[cs]e\b|licen[cs]ed\b|\bcertified\b|hold (?:a|an|the) (?:valid )?certif/i, "Licence or certification"],
  [/security clearance|clearance level|reliability status/i, "Security clearance"],
  [/\b(?:18|eighteen)\b[^|]*\b(?:age|old|years)\b|\b(?:age|old|years)\b[^|]*\b(?:18|eighteen)\b|of legal age|date of birth|birth ?date|\bdob\b/i, "Age or date of birth"],
  [/drug (?:test|screen)|substance (?:test|screen)/i, "Drug or alcohol screening"],
  [/non[- ]?compete|previously (?:employed|worked)|former employee|related to (?:an|any) employee|conflict of interest/i, "Prior employment or conflict of interest"],
  [/\battest\b|certify that|i (?:confirm|declare|swear)|under penalty|accurate and complete|acknowledge/i, "Attestation"],
];

/** Voluntary self-identification. The candidate decides; the extension never touches it. */
const SELF_ID = /\bgender\b|\bsex\b|\brace\b|ethnic|hispanic|latin[oax]|veteran|disabilit|disabled|sexual orientation|\blgbt|transgender|indigenous|aboriginal|visible minority|self[- ]?identif|equal (?:employment )?opportunity|\beeo\b|demographic/i;

const AUTOCOMPLETE: Record<string, FieldKind> = {
  "given-name": "first_name",
  "family-name": "last_name",
  name: "full_name",
  email: "email",
  tel: "phone",
  "tel-national": "phone",
  "address-level2": "city",
  "address-level1": "province",
  "postal-code": "postal",
  country: "country",
  "country-name": "country",
  "street-address": "address",
  "address-line1": "address",
  url: "website",
  organization: "current_company",
  "organization-title": "current_title",
};

const FILL_KINDS = new Set<FieldKind>(["first_name", "last_name", "full_name", "email", "phone", "city", "province", "postal", "country", "address", "linkedin", "github", "website", "resume", "cover_letter", "current_company", "current_title"]);

function joined(meta: FieldMeta): string {
  return [meta.label, meta.placeholder, meta.name, meta.id]
    .filter((s): s is string => Boolean(s))
    .map((s) => s.replace(/\s+/g, " ").trim())
    .join(" | ");
}

function kindFromText(t: string, meta: FieldMeta): FieldKind {
  const type = (meta.type ?? "").toLowerCase();
  const isFile = type === "file";
  if (/cover[\s_-]*letter|letter of (?:interest|motivation)|motivation letter/i.test(t)) return "cover_letter";
  if (isFile) {
    if (/resume|r[eé]sum[eé]|\bcv\b|curriculum/i.test(t)) return "resume";
    if (/portfolio|transcript|photo|headshot|sample|reference/i.test(t)) return "custom";
    return "resume";
  }
  if (/linkedin/i.test(t)) return "linkedin";
  if (/github/i.test(t)) return "github";
  if (type === "email" || /e-?mail/i.test(t)) return "email";
  if (type === "tel" || /\bphone\b|\bmobile\b|\bcell\b|telephone/i.test(t)) return "phone";
  if (/first[\s_-]*name|given[\s_-]*name|\bfname\b|forename|preferred (?:first )?name/i.test(t)) return "first_name";
  if (/last[\s_-]*name|sur[\s_-]*name|family[\s_-]*name|\blname\b/i.test(t)) return "last_name";
  if (/(?:^|\| )(?:full |your |legal |complete )?name(?: \(required\))?\s*\*?(?= \||$)|full[\s_-]*name/i.test(t)) return "full_name";
  if (/salary|compensation|pay (?:expectation|rate|range)|hourly rate|desired (?:pay|wage)|expected (?:pay|wage)|\bwage\b|rate of pay/i.test(t)) return "salary";
  if (/how did you (?:hear|find)|referr|\bsource\b|where did you/i.test(t)) return "referral";
  if (/start date|available to start|availability|notice period|earliest/i.test(t)) return "start_date";
  if (/pronoun/i.test(t)) return "pronouns";
  if (/postal|\bzip\b|postcode/i.test(t)) return "postal";
  if (/\bcountry\b/i.test(t)) return "country";
  if (/\bprovince\b|\bstate\b|state\/province|province\/state|\bregion\b/i.test(t)) return "province";
  if (/\bcity\b|\btown\b|municipality|\blocation\b|where are you (?:based|located)/i.test(t)) return "city";
  if (/\baddress\b|\bstreet\b/i.test(t)) return "address";
  if (/website|portfolio|personal (?:site|url)|\burl\b|web ?site|homepage|other (?:link|url)|\blinks?\b/i.test(t)) return "website";
  if (/current (?:company|employer|organi[sz]ation)|\bcompany\b|\bemployer\b/i.test(t)) return "current_company";
  if (/current (?:title|role|position)|job title|\btitle\b|\bposition\b/i.test(t)) return "current_title";
  if (type === "url") return "website";
  return "custom";
}

/** Decide what the extension may do with one field. */
export function classify(meta: FieldMeta): Classification {
  const t = joined(meta);
  const type = (meta.type ?? "").toLowerCase();
  for (const [re, reason] of LEGAL) {
    if (re.test(t)) return { kind: "attestation", action: "flag", reason };
  }
  if (SELF_ID.test(t)) return { kind: "self_id", action: "flag", reason: "Voluntary self-identification" };

  const auto = (meta.autocomplete ?? "").toLowerCase().split(/\s+/).find((s) => s in AUTOCOMPLETE);
  const kind = auto ? AUTOCOMPLETE[auto] : kindFromText(t, meta);

  if (kind === "salary") return { kind, action: "hint" };
  if (!FILL_KINDS.has(kind)) return { kind, action: "skip" };
  // Choices are only ever made for country and province selects; every other choice stays with the candidate.
  if ((type === "select" || type === "radio" || type === "checkbox") && kind !== "country" && kind !== "province") return { kind, action: "skip" };
  if (type === "file" && kind !== "resume" && kind !== "cover_letter") return { kind, action: "skip" };
  return { kind, action: "fill" };
}

/* ---------- values ---------- */

export interface FillCandidate {
  fullName: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  city?: string;
  province?: string;
  /** Full names to try on a province or state select ("Ontario" for "ON"), most common first. */
  provinceNames?: string[];
  /** ISO code, when known. */
  country?: string;
  /** Display names to try on a country select, most common first. */
  countryNames?: string[];
  postal?: string;
  address?: string;
  linkedin?: string;
  github?: string;
  website?: string;
  currentTitle?: string;
  currentCompany?: string;
  coverLetter?: string;
}

export function valueFor(kind: FieldKind, c: FillCandidate): string | undefined {
  switch (kind) {
    case "first_name":
      return c.firstName || undefined;
    case "last_name":
      return c.lastName || undefined;
    case "full_name":
      return c.fullName || undefined;
    case "email":
      return c.email;
    case "phone":
      return c.phone;
    case "city":
      return c.city;
    case "province":
      return c.provinceNames?.[0] ?? c.province;
    case "postal":
      return c.postal;
    case "country":
      return c.countryNames?.[0] ?? c.country;
    case "address":
      return c.address;
    case "linkedin":
      return c.linkedin;
    case "github":
      return c.github;
    case "website":
      return c.website;
    case "current_company":
      return c.currentCompany;
    case "current_title":
      return c.currentTitle;
    case "cover_letter":
      return c.coverLetter;
    default:
      return undefined;
  }
}

/** First token is the first name; everything after it is the last name, which keeps double surnames intact. */
export function splitName(full: string): { first: string; last: string } {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { first: "", last: "" };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

/** Pick the option whose text (or value) matches one of the wanted strings; exact matches win over partial ones. */
export function pickOption(options: { text: string; value: string }[], wanted: string[]): number {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const targets = wanted.filter(Boolean).map(norm);
  for (const w of targets) {
    const i = options.findIndex((o) => norm(o.text) === w || norm(o.value) === w);
    if (i >= 0) return i;
  }
  for (const w of targets) {
    if (w.length < 4) continue;
    const i = options.findIndex((o) => norm(o.text).includes(w));
    if (i >= 0) return i;
  }
  return -1;
}

export interface PayBand {
  low?: number;
  median?: number;
  high?: number;
  currency: string;
}

/** The hint shown beside a salary ask. Never filled in; the number is the candidate's to type. */
export function payHint(pay?: PayBand): string | undefined {
  if (!pay || (pay.low == null && pay.median == null && pay.high == null)) return undefined;
  const f = (n?: number) => (n == null ? undefined : Math.round(n).toLocaleString("en-CA"));
  const range = pay.low != null && pay.high != null ? `${f(pay.low)} to ${f(pay.high)}` : f(pay.median) ?? f(pay.low) ?? f(pay.high);
  const median = pay.median != null && pay.low != null && pay.high != null ? `, median ${f(pay.median)}` : "";
  return `Pay report for this role: ${pay.currency.toUpperCase()} ${range}${median}. Your number to type.`;
}
