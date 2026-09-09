import type { JobRequirements, RedFlag } from "@/lib/app/types";

/* Deterministic red-flag check on a posting. Findings, not accusations. */

interface Rule {
  id: string;
  severity: RedFlag["severity"];
  pattern: RegExp;
  title: string;
  detail: string;
}

const RULES: Rule[] = [
  { id: "commission_only", severity: "high", pattern: /\bcommission[- ]only\b|100% commission|straight commission/i, title: "Commission-only pay", detail: "No base salary is mentioned. Your income depends entirely on sales you close." },
  { id: "unpaid", severity: "high", pattern: /\bunpaid\b|\bno pay\b|volunteer basis/i, title: "Unpaid work mentioned", detail: "The posting refers to unpaid work. Unpaid trial shifts for a regular job are unlawful in most jurisdictions, including Ontario and every US state." },
  { id: "mlm", severity: "high", pattern: /be your own boss|unlimited earning potential|earn \$\d[\d,]*\+?\s*(?:per|a|\/)\s*(?:week|day)|no experience necessary.*\$/i, title: "Earnings-pitch language", detail: "Phrases like this are typical of multi-level marketing or lead-generation postings rather than employment." },
  { id: "fees", severity: "high", pattern: /training fee|pay for (?:your )?(?:training|equipment|uniform)|registration fee|purchase (?:a )?starter/i, title: "Asks you to pay", detail: "Legitimate employers do not charge for training, equipment or registration." },
  { id: "relocation_own_cost", severity: "medium", pattern: /relocat(?:e|ion)[^.]{0,40}(?:own (?:cost|expense)|not (?:covered|provided|offered))/i, title: "Relocation at your expense", detail: "You would be expected to move without assistance." },
  { id: "salary_missing", severity: "medium", pattern: /competitive (?:salary|compensation|pay|wage)|salary (?:commensurate|doe|to be discussed|negotiable)|\bDOE\b|based on experience/i, title: "Salary described, not stated", detail: "Many jurisdictions now require a pay range on postings (Ontario, British Columbia, California, Colorado, New York and others). “Competitive” is a negotiation disadvantage for you." },
  { id: "own_vehicle", severity: "medium", pattern: /own (?:reliable )?(?:vehicle|car|transportation)|use of (?:your )?personal vehicle/i, title: "Own vehicle required", detail: "Check whether mileage and insurance are reimbursed before accepting." },
  { id: "hours", severity: "medium", pattern: /evenings?,? weekends?|rotating shifts|on[- ]call|mandatory overtime|12[- ]hour shifts|long hours/i, title: "Demanding hours", detail: "Evenings, weekends, rotating shifts or mandatory overtime are named in the posting." },
  { id: "authorization", severity: "info", pattern: /(?:entitled|eligible|authori[sz]ed) to work|work (?:permit|authori[sz]ation)|permanent resident|citizenship/i, title: "Work-authorization attestation", detail: "You will be asked to attest to your status. Answer this yourself; it is never pre-filled for you." },
  { id: "sponsorship", severity: "info", pattern: /no sponsorship|sponsorship (?:is )?not (?:available|provided|offered)/i, title: "No sponsorship", detail: "The employer will not sponsor a work permit." },
  { id: "licence", severity: "info", pattern: /valid (?:class )?[a-z]? ?(?:driver'?s? )?licen[cs]e|forklift (?:licen[cs]e|certif)|(?:required|must hold) (?:a )?(?:licen[cs]e|certification)/i, title: "Licence or certification required", detail: "Confirm you hold it before applying; it is usually a hard filter." },
  { id: "record_check", severity: "info", pattern: /criminal record check|background check|police check|vulnerable sector/i, title: "Background check", detail: "A record or background check is part of the process. Never pre-filled; you answer it yourself." },
  { id: "culture", severity: "info", pattern: /\brockstar\b|\bninja\b|\bguru\b|wear many hats|work hard,? play hard|like a family/i, title: "Culture-speak", detail: "Phrases like this often signal understaffing. Ask how the team is resourced." },
  { id: "physical", severity: "info", pattern: /lift (?:up to )?\d+\s?(?:lbs|kg|pounds)|standing for (?:long|extended) periods/i, title: "Physical requirements", detail: "The posting names lifting or standing requirements." },
];

export function checkRedFlags(postingText: string, req: JobRequirements): RedFlag[] {
  const flags: RedFlag[] = [];
  const seen = new Set<string>();
  for (const rule of RULES) {
    if (rule.pattern.test(postingText) && !seen.has(rule.id)) {
      seen.add(rule.id);
      flags.push({ id: rule.id, severity: rule.severity, title: rule.title, detail: rule.detail });
    }
  }
  if (!req.salaryStated && !seen.has("salary_missing")) {
    flags.push({ id: "salary_absent", severity: "medium", title: "No salary in the posting", detail: "No pay range appears anywhere. Use the pay report to anchor your expectations before the first call." });
  }
  if (typeof req.postedDaysAgo === "number" && req.postedDaysAgo >= 45) {
    flags.push({ id: "stale", severity: "medium", title: `Posted ${req.postedDaysAgo} days ago`, detail: "Postings this old are often filled, evergreen, or collecting resumes. Apply, but do not wait on it." });
  }
  const order = { high: 0, medium: 1, info: 2 };
  return flags.sort((a, b) => order[a.severity] - order[b.severity]);
}
