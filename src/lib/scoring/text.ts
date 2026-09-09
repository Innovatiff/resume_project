/* Shared text helpers for the deterministic scorer. */

const STOP = new Set(["and", "or", "the", "a", "an", "of", "to", "in", "for", "with", "on", "at", "by", "as", "is", "are", "be", "this", "that", "our", "your", "you", "we", "will", "must", "have", "has", "from", "all", "any", "able", "etc", "per", "other", "into", "their", "who", "such", "than", "years", "year", "yrs", "experience", "experienced", "required", "preferred", "strong", "good", "excellent", "ability", "skills", "skill", "knowledge", "working", "work", "valid", "current", "active", "proven", "solid", "hands", "minimum", "plus", "role", "roles", "position", "environment", "setting", "related", "relevant", "similar", "equivalent", "background", "familiarity", "familiar", "proficiency", "proficient", "using", "use", "demonstrated", "previous", "prior", "within", "across", "including", "some"]);

export const SYNONYMS: Record<string, string[]> = {
  wms: ["warehouse management system", "warehouse management systems"],
  erp: ["enterprise resource planning", "sap", "oracle", "netsuite", "dynamics 365"],
  crm: ["customer relationship management", "salesforce", "hubspot"],
  "forklift licence": ["forklift license", "forklift certified", "forklift certification", "lift truck"],
  "cycle counting": ["cycle count", "cycle counts", "inventory counts"],
  excel: ["microsoft excel", "spreadsheets", "google sheets"],
  "microsoft office": ["ms office", "office 365", "word, excel", "excel, word"],
  bilingual: ["french and english", "english and french", "french/english"],
  "customer service": ["client service", "customer support", "customer care"],
  "supply chain": ["logistics", "procurement", "distribution"],
  "3pl": ["third-party logistics", "third party logistics"],
  "g licence": ["g license", "class g", "driver's licence", "drivers licence", "driver's license", "valid licence", "valid license"],
  "first aid": ["cpr", "first-aid"],
  whmis: ["whmis certified", "whmis certification"],
  "lean": ["lean manufacturing", "kaizen", "continuous improvement", "six sigma", "5s"],
  "kpi": ["kpis", "key performance indicators", "metrics"],
  "scheduling": ["schedule", "schedules", "scheduled"],
  "inventory": ["inventory control", "inventory management", "stock control"],
  "safety": ["health and safety", "ohsa", "workplace safety"],
  "management": ["managed", "manager", "supervised", "supervision", "led", "leadership"],
  "training": ["trained", "onboarding", "coaching", "mentoring"],
};

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[^a-z0-9+#./&' -]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokens(s: string): string[] {
  return normalize(s)
    .split(/[^a-z0-9+#]+/)
    .filter((t) => t.length > 1 && !STOP.has(t) && !/^\d+\+?$/.test(t));
}

/** Does `phrase` (or a synonym of it) appear in `haystack`? */
export function phraseIn(phrase: string, haystack: string): boolean {
  const p = normalize(phrase);
  if (!p) return false;
  if (haystack.includes(p)) return true;
  const syn = SYNONYMS[p] ?? [];
  if (syn.some((s) => haystack.includes(normalize(s)))) return true;
  for (const [canon, list] of Object.entries(SYNONYMS)) {
    if (list.some((s) => normalize(s) === p) && (haystack.includes(canon) || list.some((s) => haystack.includes(normalize(s))))) return true;
  }
  // Multi-word phrases: content tokens must appear (order-insensitive); long phrases that
  // list alternatives ("warehouse, distribution or logistics role") pass at 60% coverage.
  const parts = tokens(p);
  if (parts.length >= 2) {
    const hits = parts.filter((t) => haystack.includes(t) || haystack.includes(t.replace(/(ing|ed|es|s)$/, ""))).length;
    return parts.length >= 3 ? hits / parts.length >= 0.6 : hits === parts.length;
  }
  if (parts.length === 1) {
    const stem = parts[0].replace(/(ing|ed|es|s)$/, "");
    return haystack.includes(parts[0]) || (stem.length >= 4 && new RegExp(`\\b${escape(stem)}[a-z]*\\b`).test(haystack));
  }
  // Single token: allow simple plural/verb variants.
  const stem = p.replace(/(ing|ed|es|s)$/, "");
  return stem.length >= 4 && new RegExp(`\\b${escape(stem)}[a-z]*\\b`).test(haystack);
}

function escape(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function jaccard(a: string[], b: string[]): number {
  const A = new Set(a);
  const B = new Set(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  return inter / (A.size + B.size - inter);
}

/** Figures as written: 34%, $1.2M, 7 months, 41, 2019, 1,200, 3x, 24/7 stays as two figures. */
export const NUMBER_RE = /(?:\$|€|£)?\d[\d,]*(?:\.\d+)?(?:\s?(?:%|percent|k|m|bn|x))?/gi;

export function extractNumbers(text: string): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(NUMBER_RE)) {
    const v = m[0].trim();
    if (v) out.push(v);
  }
  return out;
}

/** Canonical numeric key so "34 %" and "34%" and "34.0" compare equal. */
export function numberKey(figure: string): string {
  const cleaned = figure.toLowerCase().replace(/[,$€£\s]/g, "").replace(/percent/, "%");
  const m = cleaned.match(/^(\d+(?:\.\d+)?)([%kmxbn]*)$/);
  if (!m) return cleaned;
  const n = Number(m[1]);
  return `${Number.isFinite(n) ? String(n) : m[1]}${m[2]}`;
}

export function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}
