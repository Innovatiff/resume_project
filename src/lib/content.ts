/* ------------------------------------------------------------------
   All copy and data for the Orvenic landing page.
   Prices in CAD (Canada) and USD (everywhere else). Windsor–Essex, Ontario.
   Note: the 30-day pass fair-use cap lives in the terms, never in UI.
------------------------------------------------------------------- */

export type Verdict = "apply" | "borderline" | "skip";

export interface Link {
  label: string;
  href: string;
}

export const brand = {
  name: "Orvenic",
  region: "Windsor–Essex, Ontario",
  email: "hello@orvenic.com",
  blurb:
    "Orvenic tells job seekers which postings are worth applying to, what those roles really pay in their city, and rewrites the resume for the ones that pass. Built in Windsor–Essex, Ontario, for Canada, the US and beyond.",
};

export const nav = {
  links: [
    { label: "How it works", href: "/how-it-works" },
    { label: "Pricing", href: "/pricing" },
    { label: "Organizations", href: "/organizations" },
    { label: "About", href: "/about" },
    { label: "FAQ", href: "/faq" },
  ] as Link[],
  secondary: { label: "Sign in", href: "/sign-in" } as Link,
  app: { label: "Dashboard", href: "/app" } as Link,
  cta: { label: "Free scan", href: "/scan" } as Link,
};

export const hero = {
  variants: {
    a: "Stop applying to 200 jobs.",
    b: "Know what the job actually pays.",
  },
  lead:
    "Orvenic tells job seekers in Canada, the US and beyond which postings are worth applying to, what those roles really pay in their city, and then rewrites their resume for the ones that pass. Delivered in under five minutes.",
  primary: { label: "Scan my resume free", href: "/scan" } as Link,
  secondary: { label: "See pricing", href: "/pricing" } as Link,
  trust: ["No subscription", "No auto-renew", "No card retained", "Prices in CAD or USD"],
};

export interface Posting {
  title: string;
  org: string;
  place: string;
  score: number;
  verdict: Verdict;
  note?: string;
}

export const postings: Posting[] = [
  { title: "Logistics Coordinator", org: "Food distributor", place: "Windsor", score: 91, verdict: "apply" },
  { title: "Warehouse Supervisor", org: "Auto parts supplier", place: "Tecumseh", score: 54, verdict: "skip" },
  { title: "Inventory Analyst", org: "3PL warehouse", place: "Windsor", score: 88, verdict: "apply", note: "+$9K vs. target" },
  { title: "Shipping & Receiving Lead", org: "Greenhouse grower", place: "Leamington", score: 47, verdict: "skip" },
  { title: "Operations Coordinator", org: "Logistics broker", place: "LaSalle", score: 86, verdict: "apply" },
  { title: "Dispatcher", org: "Regional carrier", place: "Windsor", score: 38, verdict: "skip", note: "Posted 94 days ago" },
  { title: "Purchasing Assistant", org: "Manufacturer", place: "Kingsville", score: 79, verdict: "borderline" },
  { title: "Production Scheduler", org: "Packaging plant", place: "Amherstburg", score: 83, verdict: "borderline" },
];

export const verdictLabel: Record<Verdict, string> = {
  apply: "Apply",
  borderline: "Borderline",
  skip: "Skip",
};

export const cloud = {
  title: "The only tool that will tell you not to apply.",
  lead:
    "Every competitor is paid to make you apply more. Several sell mass auto-apply, which employers now flag and filter. Our value is subtraction. The resume is an output. The decision is the product.",
  cta: { label: "See how a verdict is made", href: "/how-it-works" } as Link,
};

export interface BentoCopy {
  id: string;
  title: string;
  body: string;
}

export const bento = {
  title: "Everything in the package, built around one question.",
  lead:
    "Is this posting worth your evening? Each piece answers part of that, then does the work for the ones that pass.",
  cards: [
    {
      id: "score",
      title: "Match score and verdict",
      body:
        "A deterministic ATS score against the exact posting, the three reasons you are being filtered out, and a straight answer: apply, borderline, or skip.",
    },
    {
      id: "pay",
      title: "Honest pay report",
      body:
        "Salary comes from live market data for that title and city, never from the model. If there is no reliable data for a role in your market, we say so.",
    },
    {
      id: "flags",
      title: "Red flag check",
      body:
        "Stale postings, salary bait, licence and authorization traps, flagged before you spend an evening on the application.",
    },
    {
      id: "metric",
      title: "The metric interview",
      body:
        "We never invent a number. When a bullet needs one, we ask you, then check every figure in the output against your source before delivery.",
    },
    {
      id: "planb",
      title: "Plan B: three better roles nearby",
      body:
        "For every posting you scan, three better-matched roles in your area. Two of Maria's eleven applications came from here.",
    },
  ] as BentoCopy[],
};

export interface Rule {
  id: string;
  title: string;
  body: string;
}

export const rules = {
  title: "Six rules we never break.",
  lead: "They are not compliance boilerplate. They are the product.",
  items: [
    {
      id: "fabricate",
      title: "Never fabricate",
      body:
        "Every bullet carries a flag recording whether a metric exists in your source. The rewriter cannot invent one. It asks you instead, and every figure is checked before delivery.",
    },
    {
      id: "pay",
      title: "Never guess at pay",
      body:
        "Salary comes from market data, never the model. A failed lookup returns “no reliable data for this role in this market”, not an estimate.",
    },
    {
      id: "block",
      title: "Never block a paying customer",
      body:
        "A low score is a warning, not a wall. If you want the long shot, we say so plainly, then switch to long-shot strategy.",
    },
    {
      id: "submit",
      title: "Never submit on your behalf",
      body:
        "The extension fills and drafts. You review and click. Legal attestations are never pre-filled and always flagged red.",
    },
    {
      id: "renew",
      title: "Never auto-renew",
      body:
        "No card on file. One email at day 25. Renewal is your decision, not a default.",
    },
    {
      id: "promise",
      title: "Never promise a job",
      body:
        "We guarantee the ATS score because we control it. We guarantee nothing we do not.",
    },
  ] as Rule[],
};

export interface StoryStep {
  id: string;
  kicker: string;
  title: string;
  body: string;
  stat: string;
  statLabel: string;
}

export const story = {
  title: "A customer, end to end.",
  lead: "An illustrative walkthrough of how the product works. Not a customer review.",
  person: {
    name: "Maria",
    meta: "34 · Leamington, Ontario",
    initial: "M",
  },
  steps: [
    {
      id: "intro",
      kicker: "Starting point",
      title: "Ten years of warehouse and inventory work.",
      body:
        "Forty-one applications in three months, four callbacks, no offers. Applies in English, thinks in Spanish.",
      stat: "41 → 4",
      statLabel: "applications to callbacks",
    },
    {
      id: "scan",
      kicker: "Step 1 · Free scan",
      title: "Three problems, named.",
      body:
        "No keyword coverage for “WMS” despite six years using one. A two-column layout the parser drops entirely. No quantified outcomes anywhere.",
      stat: "61",
      statLabel: "ATS score, Logistics Coordinator, Windsor",
    },
    {
      id: "pass",
      kicker: "Step 2 · The pass",
      title: "One purchase. No card kept.",
      body: "She buys the 30-Day Pass. Nothing renews. Nothing is stored for later charges.",
      stat: "$99",
      statLabel: "one-time, CAD",
    },
    {
      id: "metric",
      kicker: "Step 3 · The metric interview",
      title: "“By how much, and over what period?”",
      body:
        "She checks her old performance reviews: picking errors down 34% over seven months. The number goes in. It is hers, it is true, and she can defend it.",
      stat: "34%",
      statLabel: "fewer picking errors, verified in source",
    },
    {
      id: "rewrite",
      kicker: "Step 4 · The rewrite",
      title: "Rewritten for that posting.",
      body: "Same career, same facts, legible to the parser and the recruiter. She applies.",
      stat: "91",
      statLabel: "ATS score after rewrite",
    },
    {
      id: "month",
      kicker: "Step 5 · Thirty days",
      title: "Eleven pass. She applies to eleven.",
      body:
        "Thirty-four postings scanned. Plus three long shots she wanted anyway, and we tell her they are long shots and switch strategy for those.",
      stat: "11 of 34",
      statLabel: "postings worth applying to",
    },
    {
      id: "planb",
      kicker: "Step 6 · Plan B",
      title: "Two roles she would never have found.",
      body: "They came from her Plan B report. One pays more than the job she originally wanted.",
      stat: "+$9,000",
      statLabel: "over her original target",
    },
    {
      id: "offer",
      kicker: "Step 7 · The offer",
      title: "She counters, citing the range.",
      body:
        "The pay report puts the Windsor band at $62–78K. The offer comes in at $64K. She counters at $73K and settles at $70K.",
      stat: "$70K",
      statLabel: "settled, from a $64K offer",
    },
    {
      id: "bill",
      kicker: "The bill",
      title: "Her cost: $99.",
      body: "The counter alone was worth $6,000. That story is the marketing. It is also exactly what the product does.",
      stat: "$6,000",
      statLabel: "from one counter-offer",
    },
  ] as StoryStep[],
};

export interface Tier {
  id: string;
  name: string;
  price: string;
  period: string;
  blurb: string;
  features: string[];
  cta: Link;
  featured?: boolean;
  badge?: string;
}

export const pricing = {
  title: "One-time purchases. No subscription.",
  lead:
    "Canadian dollars in Canada, US dollars everywhere else. Pay once, get the files, keep them. No card is kept on file and nothing renews on its own.",
  tiers: [
    {
      id: "free",
      name: "Free scan",
      price: "$0",
      period: "no card, no account",
      blurb: "Proof before you pay.",
      features: [
        "ATS score for one resume against one posting",
        "The three specific reasons it is being filtered out",
        "One scan per email address every 7 days",
      ],
      cta: { label: "Scan for free", href: "/scan" },
    },
    {
      id: "single",
      name: "Single Shot",
      price: "$29",
      period: "one posting",
      blurb: "One job, the complete package.",
      features: [
        "Tailored resume (.docx and PDF) and cover letter",
        "Match score and verdict",
        "Honest pay report for that title and city",
        "Red flag check on the posting",
        "Interview prep for that role",
        "Plan B: three better-matched roles nearby",
        "One free revision within 48 hours",
        "Delivery in under 5 minutes",
      ],
      cta: { label: "Buy a Single Shot", href: "/checkout?plan=single" },
    },
    {
      id: "pass",
      name: "30-Day Pass",
      price: "$99",
      period: "30 days, unlimited",
      blurb: "Everything in Single Shot, for every posting you find.",
      features: [
        "Unlimited postings for 30 days",
        "One-click apply browser extension",
        "Application tracker",
        "The metric interview",
        "Recruiter objection report",
        "LinkedIn headline and About rewrite",
        "No subscription, no auto-renew, no card retained",
      ],
      cta: { label: "Get the 30-Day Pass", href: "/checkout?plan=pass" },
      featured: true,
      badge: "Most people choose this",
    },
    {
      id: "landed",
      name: "Landed",
      price: "$299",
      period: "90 days",
      blurb: "Everything above, with a human in the loop.",
      features: [
        "90 days of everything in the pass",
        "Human review of every resume before it is sent",
        "Two live 45-minute coaching sessions",
        "Priority delivery in under 2 minutes",
        "Direct email access, same-day response",
      ],
      cta: { label: "Get Landed", href: "/checkout?plan=landed" },
    },
  ] as Tier[],
  addons: [
    { item: "Extra 30 days (existing customers)", price: "$79" },
    { item: "Additional coaching session, 45 minutes", price: "$95" },
    { item: "Rush human review, single resume", price: "$49" },
    { item: "Standalone LinkedIn profile rewrite", price: "$39" },
    { item: "French or Spanish resume version", price: "Included" },
  ],
  guarantee: {
    stat: "85",
    title: "or it's free.",
    body:
      "If the tailored resume does not score 85 or higher on our deterministic scorer, you get a full refund with one email, and you keep the resume. The score breakdown is published so you can audit it. Applies to Single Shot, 30-Day Pass and Landed.",
    never: "What is never guaranteed: interviews, callbacks, or a job.",
  },
};

export const organizations = {
  eyebrow: "For organizations",
  title: "Seats for agencies, settlement organizations and college career centres.",
  lead:
    "Seats are 30-day passes your organization hands to clients. They do not expire for 12 months from purchase.",
  packages: [
    { name: "Pilot", seats: "25 seats", perSeat: "$40 / seat", total: "$1,000" },
    { name: "Standard", seats: "50 seats", perSeat: "$35 / seat", total: "$1,750" },
    { name: "Agency", seats: "100 seats", perSeat: "$30 / seat", total: "$3,000" },
    { name: "Site licence", seats: "250 seats", perSeat: "$25 / seat", total: "$6,250" },
    { name: "Annual unlimited", seats: "Single location", perSeat: "Unlimited", total: "$9,600 / yr" },
  ],
  includes: [
    "White-labelled intake page for your clients",
    "Quarterly usage reporting",
    "Staff onboarding",
    "Seats valid for 12 months from purchase",
  ],
  cta: { label: "Talk to us about a pilot", href: `mailto:${brand.email}?subject=Orvenic%20pilot` } as Link,
};

export interface Faq {
  q: string;
  a: string;
}

export const faq = {
  title: "Questions, answered plainly.",
  items: [
    {
      q: "Do you guarantee interviews or a job?",
      a: "No. We guarantee the ATS score because we control it: 85 or higher on our published scorer, or a full refund and you keep the resume. Interviews, callbacks and offers depend on things we do not control, so we never promise them.",
    },
    {
      q: "Is this a subscription?",
      a: "No. Every purchase is one-time. We do not keep a card on file and nothing renews on its own. Pass holders get one email at day 25; renewing for another 30 days ($79) is their decision.",
    },
    {
      q: "Where does the salary data come from?",
      a: "From a market-data API that returns minimum, median and maximum pay by title and city for Canada, the United States, the UK, Australia and a dozen other markets. The model is never allowed to estimate. If there is no reliable data for a role in your market, the report says exactly that.",
    },
    {
      q: "Will the AI make things up on my resume?",
      a: "No. Every bullet in your profile carries a flag recording whether a metric exists in your source material. The rewriter may keep flagged metrics and is structurally prevented from inventing new ones; it asks you instead. After generation, code checks every figure in the output against your source and rejects anything that is not there.",
    },
    {
      q: "Do you apply on my behalf?",
      a: "Never. The browser extension fills and drafts in your own browser; you review and click. Legal attestations such as work authorization, sponsorship, criminal history and licences are never pre-filled and are always flagged for you.",
    },
    {
      q: "What happens to my resume and personal data?",
      a: "Resumes are personal information, and we treat them that way under PIPEDA in Canada and the privacy law where you live. We publish a privacy policy and a retention window, you can delete everything with one click, and nothing is ever sold or shared.",
    },
    {
      q: "What if the score is low but I still want to apply?",
      a: "We tell you plainly it is a long shot, then switch strategy: lead with transferable evidence, address the gap directly in the cover letter, and find the hiring manager to route around the ATS. A low score is a warning, not a wall.",
    },
    {
      q: "Which languages and which job sites?",
      a: "English, with French or Spanish resume versions included at no extra cost. Pasting the job description works for any posting anywhere. The one-click extension supports Greenhouse, Lever, Ashby and Workday first.",
    },
  ] as Faq[],
};

export const scan = {
  title: "Start with the free scan.",
  lead:
    "Your ATS score for one resume against one posting, and the three specific reasons it is being filtered out. No card, no account.",
  fine: ["One scan per email address every 7 days", "PDF or DOCX, up to 4 MB", "Your file is deleted after scoring"],
};

export const footer = {
  columns: [
    {
      title: "Product",
      links: [
        { label: "Free scan", href: "/scan" },
        { label: "Sign in", href: "/sign-in" },
        { label: "How it works", href: "/how-it-works" },
        { label: "Pricing", href: "/pricing" },
        { label: "Guarantee", href: "/pricing#guarantee" },
        { label: "For organizations", href: "/organizations" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About", href: "/about" },
        { label: "The six rules", href: "/about#rules" },
        { label: "FAQ", href: "/faq" },
        { label: "Contact", href: "/contact" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy", href: "/privacy" },
        { label: "Terms", href: "/terms" },
        { label: "Refunds", href: "/refunds" },
      ],
    },
  ] as { title: string; links: Link[] }[],
  social: [
    { label: "Instagram", href: "#", icon: "instagram" },
    { label: "X", href: "#", icon: "x" },
    { label: "LinkedIn", href: "#", icon: "linkedin" },
  ] as { label: string; href: string; icon: "instagram" | "x" | "linkedin" }[],
};
