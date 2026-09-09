/* ------------------------------------------------------------------
   Markets. Shortlist works for a posting anywhere; what changes by
   country is the currency of pay data, whether we have pay-data
   coverage (Adzuna), what the second line of an address is called,
   the paper size of delivered documents and the spelling the rewrite
   uses. Checkout charges CAD in Canada and USD everywhere else.
   Safe to import from client and server code.
------------------------------------------------------------------- */

export type CountryCode = "CA" | "US" | "GB" | "IE" | "AU" | "NZ" | "DE" | "FR" | "ES" | "IT" | "NL" | "BE" | "AT" | "CH" | "PL" | "MX" | "BR" | "IN" | "SG" | "ZA" | "OTHER";
export type CurrencyCode = "CAD" | "USD" | "GBP" | "EUR" | "AUD" | "NZD" | "CHF" | "PLN" | "MXN" | "BRL" | "INR" | "SGD" | "ZAR";
/** Currencies we charge in. Everything outside Canada checks out in USD. */
export type CheckoutCurrency = "cad" | "usd";

export interface Market {
  code: CountryCode;
  name: string;
  /** Currency of local pay data. */
  currency: CurrencyCode;
  /** Adzuna country segment when the market is covered. */
  adzuna?: string;
  /** What the region line of an address is called. */
  regionLabel: string;
  /** Paper size for delivered documents. */
  paper: "LETTER" | "A4";
  /** Spelling and resume conventions for the rewrite. */
  conventions: string;
}

const EN_NA = "North American resume conventions: the document is called a resume, one to two pages, no photo, no date of birth, no marital status.";
const EN_UK = "UK/Irish conventions: the document is called a CV, two pages, no photo, no date of birth, British spelling (organise, licence, programme).";
const EN_AU = "Australian/New Zealand conventions: the document is called a CV or resume, two to three pages, no photo, no date of birth, British-style spelling.";
const EU = "European conventions: a CV of one to two pages; no photo or date of birth unless the candidate already included them; keep the candidate's own language and spelling.";

export const MARKETS: Record<CountryCode, Market> = {
  CA: { code: "CA", name: "Canada", currency: "CAD", adzuna: "ca", regionLabel: "Province", paper: "LETTER", conventions: `Canadian English spelling (colour, centre, licence). ${EN_NA}` },
  US: { code: "US", name: "United States", currency: "USD", adzuna: "us", regionLabel: "State", paper: "LETTER", conventions: `US English spelling (color, center, license). ${EN_NA}` },
  GB: { code: "GB", name: "United Kingdom", currency: "GBP", adzuna: "gb", regionLabel: "County or region", paper: "A4", conventions: EN_UK },
  IE: { code: "IE", name: "Ireland", currency: "EUR", regionLabel: "County", paper: "A4", conventions: EN_UK },
  AU: { code: "AU", name: "Australia", currency: "AUD", adzuna: "au", regionLabel: "State or territory", paper: "A4", conventions: EN_AU },
  NZ: { code: "NZ", name: "New Zealand", currency: "NZD", adzuna: "nz", regionLabel: "Region", paper: "A4", conventions: EN_AU },
  DE: { code: "DE", name: "Germany", currency: "EUR", adzuna: "de", regionLabel: "State (Bundesland)", paper: "A4", conventions: EU },
  FR: { code: "FR", name: "France", currency: "EUR", adzuna: "fr", regionLabel: "Region", paper: "A4", conventions: EU },
  ES: { code: "ES", name: "Spain", currency: "EUR", adzuna: "es", regionLabel: "Province", paper: "A4", conventions: EU },
  IT: { code: "IT", name: "Italy", currency: "EUR", adzuna: "it", regionLabel: "Province", paper: "A4", conventions: EU },
  NL: { code: "NL", name: "Netherlands", currency: "EUR", adzuna: "nl", regionLabel: "Province", paper: "A4", conventions: EU },
  BE: { code: "BE", name: "Belgium", currency: "EUR", adzuna: "be", regionLabel: "Province", paper: "A4", conventions: EU },
  AT: { code: "AT", name: "Austria", currency: "EUR", adzuna: "at", regionLabel: "State", paper: "A4", conventions: EU },
  CH: { code: "CH", name: "Switzerland", currency: "CHF", adzuna: "ch", regionLabel: "Canton", paper: "A4", conventions: EU },
  PL: { code: "PL", name: "Poland", currency: "PLN", adzuna: "pl", regionLabel: "Voivodeship", paper: "A4", conventions: EU },
  MX: { code: "MX", name: "Mexico", currency: "MXN", adzuna: "mx", regionLabel: "State", paper: "LETTER", conventions: "Mexican conventions: a one to two page CV; no photo or date of birth unless the candidate already included them; Mexican Spanish when writing in Spanish." },
  BR: { code: "BR", name: "Brazil", currency: "BRL", adzuna: "br", regionLabel: "State", paper: "A4", conventions: EU },
  IN: { code: "IN", name: "India", currency: "INR", adzuna: "in", regionLabel: "State", paper: "A4", conventions: "Indian conventions: a resume of one to two pages, Indian English spelling, no photo or date of birth unless the candidate already included them." },
  SG: { code: "SG", name: "Singapore", currency: "SGD", adzuna: "sg", regionLabel: "Region", paper: "A4", conventions: "Singapore conventions: a resume of one to two pages, British spelling, no photo or date of birth unless the candidate already included them." },
  ZA: { code: "ZA", name: "South Africa", currency: "ZAR", adzuna: "za", regionLabel: "Province", paper: "A4", conventions: "South African conventions: a CV of two pages, British spelling, no photo or date of birth unless the candidate already included them." },
  OTHER: { code: "OTHER", name: "Other country", currency: "USD", regionLabel: "Region", paper: "A4", conventions: "International conventions: a one to two page CV, no photo or date of birth unless the candidate already included them; keep the candidate's own spelling." },
};

export const COUNTRY_CODES = Object.keys(MARKETS) as CountryCode[];
/** Home market: the fallback when nothing in the posting, the profile or the account says otherwise. */
export const DEFAULT_COUNTRY: CountryCode = "CA";

export function isCountryCode(v: unknown): v is CountryCode {
  return typeof v === "string" && v in MARKETS;
}

export function marketFor(code?: string | null): Market {
  return isCountryCode(code) ? MARKETS[code] : MARKETS[DEFAULT_COUNTRY];
}

export function checkoutCurrencyFor(country?: string | null): CheckoutCurrency {
  return (country ?? DEFAULT_COUNTRY) === "CA" ? "cad" : "usd";
}

export const CURRENCY_NAMES: Record<CheckoutCurrency, string> = { cad: "Canadian dollars", usd: "US dollars" };

/** "$62,000", "£40,000", "€45,000". Whole units, narrow symbol. */
export function formatMoney(amount: number, currency: string): string {
  const code = currency.toUpperCase();
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency: code, currencyDisplay: "narrowSymbol", maximumFractionDigits: 0 }).format(Math.round(amount));
  } catch {
    return `${Math.round(amount).toLocaleString("en")} ${code}`;
  }
}

/** Prices are stored in cents. */
export function formatCents(cents: number, currency: string): string {
  return formatMoney(cents / 100, currency);
}

/** Region of the first tag in an Accept-Language header or a BCP 47 locale ("en-US,en;q=0.9" -> US). */
export function countryFromLocale(locale?: string | null): CountryCode | undefined {
  if (!locale) return undefined;
  const first = locale.split(",")[0]?.trim() ?? "";
  const m = first.match(/^[A-Za-z]{2,3}(?:-[A-Za-z]{4})?-([A-Za-z]{2})\b/);
  if (!m) return undefined;
  const region = m[1].toUpperCase();
  return isCountryCode(region) ? region : "OTHER";
}

/* ---------- posting / address country detection ---------- */

interface Signal {
  code: CountryCode;
  re: RegExp;
}

// Explicit country names. Case-sensitive where the short form is an English word ("us").
const COUNTRY_WORDS: Signal[] = [
  { code: "CA", re: /\bCanada\b|\bCanadian\b/i },
  { code: "US", re: /\bUnited States\b|\bU\.S\.A?\.?(?=[\s,.)]|$)|\bUSA\b/ },
  { code: "GB", re: /\bUnited Kingdom\b|\bGreat Britain\b|\bBritain\b|\bEngland\b|\bScotland\b|\bWales\b|\bNorthern Ireland\b|\bUK\b|\bU\.K\.(?=[\s,.)]|$)/ },
  { code: "IE", re: /\bIreland\b|\bÉire\b/i },
  { code: "AU", re: /\bAustralia\b/i },
  { code: "NZ", re: /\bNew Zealand\b|\bAotearoa\b/i },
  { code: "DE", re: /\bGermany\b|\bDeutschland\b/i },
  { code: "FR", re: /\bFrance\b/i },
  { code: "ES", re: /\bSpain\b|\bEspaña\b/i },
  { code: "IT", re: /\bItaly\b|\bItalia\b/i },
  { code: "NL", re: /\bNetherlands\b|\bNederland\b|\bHolland\b/i },
  { code: "BE", re: /\bBelgium\b|\bBelgique\b|\bBelgië\b/i },
  { code: "AT", re: /\bAustria\b|\bÖsterreich\b/i },
  { code: "CH", re: /\bSwitzerland\b|\bSchweiz\b|\bSuisse\b/i },
  { code: "PL", re: /\bPoland\b|\bPolska\b/i },
  { code: "MX", re: /\bMexico\b|\bMéxico\b/i },
  { code: "BR", re: /\bBrazil\b|\bBrasil\b/i },
  { code: "IN", re: /\bIndia\b/i },
  { code: "SG", re: /\bSingapore\b/i },
  { code: "ZA", re: /\bSouth Africa\b/i },
];

// Regions and postal formats. Ambiguous codes (WA, NT, SA) are left out on purpose.
const REGION_SIGNALS: Signal[] = [
  { code: "CA", re: /\b(?:Ontario|Qu[eé]bec|British Columbia|Alberta|Manitoba|Saskatchewan|Nova Scotia|New Brunswick|Prince Edward Island|Newfoundland(?: and Labrador)?|Yukon|Northwest Territories|Nunavut)\b/i },
  { code: "CA", re: /,\s*(?:ON|QC|BC|AB|MB|SK|NS|NB|PE|PEI|NL|YT|NU)(?![A-Za-z])/ },
  { code: "CA", re: /\b[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z][ -]?\d[ABCEGHJ-NPRSTV-Z]\d\b/ },
  { code: "US", re: /\b(?:Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|Florida|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New Hampshire|New Jersey|New Mexico|New York|North Carolina|North Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode Island|South Carolina|South Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington(?:,? D\.?C\.?| State)?|West Virginia|Wisconsin|Wyoming|District of Columbia)\b/ },
  { code: "US", re: /,\s*(?:AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WV|WI|WY|DC)(?![A-Za-z])(?:\s+\d{5}(?:-\d{4})?)?/ },
  { code: "GB", re: /\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/ },
  { code: "AU", re: /\b(?:New South Wales|Queensland|Tasmania|Western Australia|South Australia|Australian Capital Territory)\b/i },
  { code: "AU", re: /,\s*(?:NSW|VIC|QLD|TAS|ACT)(?![A-Za-z])/ },
];

// Weakest signals: currency markers, only used when nothing else matched.
const CURRENCY_SIGNALS: Signal[] = [
  { code: "CA", re: /\bCAD\b|\bC\$/ },
  { code: "US", re: /\bUSD\b|\bUS\$/ },
  { code: "GB", re: /£|\bGBP\b/ },
  { code: "AU", re: /\bAUD\b|\bA\$/ },
  { code: "IN", re: /₹|\bINR\b|\blakh\b|\blpa\b/i },
];

function earliest(text: string, signals: Signal[]): CountryCode | undefined {
  let best: { code: CountryCode; at: number } | undefined;
  for (const s of signals) {
    const m = s.re.exec(text);
    if (m && (!best || m.index < best.at)) best = { code: s.code, at: m.index };
  }
  return best?.code;
}

/** Country of a posting or an address block, from the earliest explicit signal in the text. */
export function detectCountry(text?: string | null): CountryCode | undefined {
  if (!text) return undefined;
  const head = text.slice(0, 6000);
  return earliest(head, [...COUNTRY_WORDS, ...REGION_SIGNALS]) ?? earliest(head, CURRENCY_SIGNALS);
}
