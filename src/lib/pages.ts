/* ------------------------------------------------------------------
   Page-level copy for the multi-page site. Section copy shared with
   the home page stays in content.ts.
------------------------------------------------------------------- */

import { brand, faq, type Faq, type Link } from "./content";

export const cta = {
  title: "Start with the free scan.",
  lead: "One resume, one posting, your ATS score and the three reasons you are being filtered out. No card, no account, under five minutes.",
  primary: { label: "Scan my resume free", href: "/scan" } as Link,
  secondary: { label: "See pricing", href: "/pricing" } as Link,
};

/* ---------- How it works ---------- */

export interface ProcessStep {
  id: string;
  title: string;
  body: string;
  icon: "upload" | "doc" | "target" | "check" | "dollar" | "chat" | "compass";
}

export const processPage = {
  hero: {
    eyebrow: "How it works",
    title: "Five minutes from posting to verdict.",
    lead: "Paste a posting, upload your resume, and get a straight answer about whether it is worth your evening. Here is what happens in between.",
  },
  steps: [
    {
      id: "intake",
      title: "Paste the posting, upload the resume",
      body: "The full description, not a link; URL scraping is best effort only. PDF or DOCX, and we preserve reading order on multi-column layouts that most parsers drop.",
      icon: "upload",
    },
    {
      id: "profile",
      title: "We build your Candidate Profile",
      body: "Every bullet is extracted with a flag recording whether a metric exists in your source. That flag is what makes the later rewrite structurally unable to invent numbers.",
      icon: "doc",
    },
    {
      id: "score",
      title: "The deterministic scorer runs",
      body: "Your resume against the exact posting. You get a score out of 100 and the three specific reasons you would be filtered out, with the breakdown published so you can audit it.",
      icon: "target",
    },
    {
      id: "verdict",
      title: "You get a verdict",
      body: "Apply, borderline, or skip. A low score is a warning, not a wall. If you want the long shot anyway, we say so plainly and switch to long-shot strategy.",
      icon: "check",
    },
    {
      id: "pay",
      title: "Pay report and red flags",
      body: "The salary band for that title in your city comes from market data, never from the model. Stale postings, salary bait and authorization traps are flagged before you spend the evening.",
      icon: "dollar",
    },
    {
      id: "rewrite",
      title: "The rewrite, and the metric interview",
      body: "A tailored resume in .docx and PDF plus a cover letter. When a bullet needs a number, we ask you for it, then check every figure in the output against your source before delivery.",
      icon: "chat",
    },
    {
      id: "apply",
      title: "Plan B, then apply",
      body: "Three better-matched roles nearby for every posting you scan. The browser extension fills the forms in your own browser; you review and click. We never submit for you.",
      icon: "compass",
    },
  ] as ProcessStep[],
};

/* ---------- Pricing page: comparison matrix ---------- */

export type CompareValue = boolean | string;

export interface CompareRow {
  label: string;
  values: [CompareValue, CompareValue, CompareValue, CompareValue];
}

export interface CompareGroup {
  group: string;
  rows: CompareRow[];
}

export const pricingPage = {
  hero: {
    eyebrow: "Pricing",
    title: "One-time purchases. No subscription.",
    lead: "Canadian dollars in Canada, US dollars everywhere else. Pay once, get the files, keep them. No card is kept on file and nothing renews on its own.",
  },
  compare: {
    title: "Everything, side by side.",
    lead: "What each package includes. Passes are unlimited for their access period.",
    columns: ["Free scan", "Single Shot", "30-Day Pass", "Landed"],
    prices: ["$0", "$29", "$99", "$299"],
    groups: [
      {
        group: "Scoring",
        rows: [
          { label: "ATS score and the three reasons", values: [true, true, true, true] },
          { label: "Verdict: apply, borderline or skip", values: [false, true, true, true] },
          { label: "Postings", values: ["1", "1", "Unlimited, 30 days", "Unlimited, 90 days"] },
        ],
      },
      {
        group: "Documents",
        rows: [
          { label: "Tailored resume (.docx and PDF)", values: [false, true, true, true] },
          { label: "Cover letter", values: [false, true, true, true] },
          { label: "One free revision within 48 hours", values: [false, true, true, true] },
          { label: "French or Spanish version", values: [false, true, true, true] },
          { label: "LinkedIn headline and About rewrite", values: [false, false, true, true] },
        ],
      },
      {
        group: "Intelligence",
        rows: [
          { label: "Honest pay report", values: [false, true, true, true] },
          { label: "Red flag check", values: [false, true, true, true] },
          { label: "Interview prep for the role", values: [false, true, true, true] },
          { label: "Plan B: three better roles nearby", values: [false, true, true, true] },
          { label: "The metric interview", values: [false, false, true, true] },
          { label: "Recruiter objection report", values: [false, false, true, true] },
        ],
      },
      {
        group: "Applying",
        rows: [
          { label: "One-click apply browser extension", values: [false, false, true, true] },
          { label: "Application tracker", values: [false, false, true, true] },
        ],
      },
      {
        group: "Humans",
        rows: [
          { label: "Human review of every resume", values: [false, false, false, true] },
          { label: "Two live 45-minute coaching sessions", values: [false, false, false, true] },
          { label: "Direct email, same-day response", values: [false, false, false, true] },
        ],
      },
      {
        group: "Delivery and terms",
        rows: [
          { label: "Delivery time", values: ["Under 5 min", "Under 5 min", "Under 5 min", "Under 2 min"] },
          { label: "85-or-free guarantee", values: [false, true, true, true] },
          { label: "Payment", values: ["Free", "One-time", "One-time, no renewal", "One-time, no renewal"] },
        ],
      },
    ] as CompareGroup[],
  },
};

/* ---------- Home teasers ---------- */

export const teasers = {
  pricing: {
    eyebrow: "Pricing",
    title: "Pay once. Keep the files.",
    lead: "Three packages, priced in Canadian dollars in Canada and US dollars everywhere else, all covered by the 85-or-free guarantee. Start with the free scan; no card, no account.",
    cta: { label: "See full pricing", href: "/pricing" } as Link,
  },
  org: {
    eyebrow: "For organizations",
    title: "Seats for the people who place people.",
    lead: "Employment agencies, settlement organizations and college career centres hand 30-day passes to clients from a white-labelled intake page. Pilots start at 25 seats.",
    cta: { label: "Explore seat packages", href: "/organizations" } as Link,
    facts: [
      { value: "25", label: "seats in a pilot" },
      { value: "$40", label: "per seat, pilot rate" },
      { value: "12 mo", label: "before seats expire" },
    ],
  },
};

/* ---------- Organizations page ---------- */

export const orgPage = {
  hero: {
    eyebrow: "For organizations",
    title: "Seats your clients can use the same day.",
    lead: "A 30-day pass for every client you place, distributed from your own intake page, with the reporting your funders ask for.",
  },
  who: {
    title: "Built for job-readiness budgets.",
    lead: "Three kinds of organizations already do this work by hand. Seats let them do it at scale, without adding staff.",
    items: [
      {
        title: "Employment agencies",
        body: "Give every registered client a verdict on each posting before they apply, and a resume that passes the parser. Fewer wasted applications, more placements per counsellor.",
      },
      {
        title: "Settlement organizations",
        body: "Newcomers arrive with strong experience that applicant-tracking parsers cannot read. Foreign credentials become legible, with French and Spanish resume versions included.",
      },
      {
        title: "College career centres",
        body: "Graduating cohorts scan postings during career weeks, with honest pay data for their first negotiation. Site licences cover a whole campus location.",
      },
    ],
  },
  pilot: {
    title: "How a pilot runs.",
    lead: "From first conversation to first placement in about two weeks.",
    steps: [
      { title: "Tell us about your clients", body: "A 30-minute call about the roles they chase, the cities they work in and the languages they write in." },
      { title: "We set up your intake page", body: "White-labelled with your name and logo. Clients upload a resume and paste a posting; seats are drawn down automatically." },
      { title: "Staff onboarding", body: "One 45-minute session for your counsellors covering the verdict, the pay report and the long-shot strategy." },
      { title: "Quarterly reporting", body: "Seats used, scores before and after, applications per client, and voluntary renewals. Numbers your funders can use." },
    ],
  },
  cta: { label: "Talk to us about a pilot", href: `mailto:${brand.email}?subject=Orvenic%20pilot` } as Link,
};

/* ---------- About page ---------- */

export const aboutPage = {
  hero: {
    eyebrow: "About Orvenic",
    title: "The resume is an output. The decision is the product.",
    lead: "Orvenic is an independent Canadian company built on one idea: job seekers do not need more applications, they need fewer, better ones. It works for postings in Canada, the United States and beyond.",
  },
  wedges: {
    title: "Three things nobody else will do.",
    lead: "The category is full of AI resume builders that are paid to make you apply more. We are built to do the opposite.",
    items: [
      {
        title: "Tell you not to apply",
        body: "Every competitor makes money when you apply more; several sell mass auto-apply, which employers now flag and filter. Our value is subtraction: a clear verdict before you spend the evening.",
      },
      {
        title: "Earn trust by design",
        body: "No subscription, no auto-renew, no card retained. One email at day 25 and the renewal is your call. The category has a reputation for hard cancellations; we refuse to be part of it.",
      },
      {
        title: "Built for Canada and the US, in three languages",
        body: "Most tools are built for one market and one language. Orvenic reads postings on both sides of the border and beyond, speaks English, French and Spanish, and makes foreign credentials legible to the employer in front of you.",
      },
    ],
    theirs: ["Sell you a subscription with a free trial that converts", "Make money when you apply to more postings", "Let the model guess at salary", "Invent metrics to make bullets sound better", "Submit applications on your behalf", "Promise interviews"],
    ours: ["One-time purchases, no card kept on file", "Tell you which postings to skip", "Salary from market data, or “no reliable data”", "Ask you for the number, then verify it", "Fill the forms; you review and click", "Guarantee the score, and nothing we do not control"],
  },
  company: {
    title: "Built in Windsor–Essex.",
    body: [
      "Orvenic is a sole proprietorship registered in Ontario and run by its founder. It serves job seekers in Canada, the United States and beyond, with roots in the logistics, healthcare, trades, hospitality and administrative labour markets of Essex County.",
      "We publish the score breakdown, the refund policy and the six rules because a product that asks for your resume should be able to explain itself.",
    ],
    facts: [
      { label: "Based in", value: "Windsor–Essex, Ontario" },
      { label: "Prices", value: "CAD in Canada, USD elsewhere" },
      { label: "Languages", value: "English, French, Spanish" },
      { label: "Contact", value: brand.email },
    ],
  },
};

/* ---------- Scan page ---------- */

export const scanPage = {
  steps: {
    title: "How the free scan works.",
    items: [
      { title: "Upload and paste", body: "Your resume as PDF or DOCX, and the full text of one posting." },
      { title: "We score it", body: "The deterministic scorer runs your resume against that posting. Nothing is rewritten and nothing is invented." },
      { title: "You get the breakdown", body: "Your score out of 100 and the three specific reasons you are being filtered out, by email, in under five minutes." },
    ],
  },
  gets: {
    title: "What you get, and what you do not.",
    items: [
      { title: "A score you can audit", body: "The breakdown is published, so you can see exactly where the points went." },
      { title: "Three named problems", body: "Not “optimize your keywords”. The actual gaps against the actual posting." },
      { title: "No upsell wall", body: "The score arrives whether or not you buy anything. One scan per email address every 7 days." },
    ],
  },
};

/* ---------- FAQ page ---------- */

export interface FaqCategory {
  id: string;
  title: string;
  items: Faq[];
}

const f = faq.items;

export const faqPage = {
  hero: {
    eyebrow: "FAQ",
    title: "Questions, answered plainly.",
    lead: "If the answer is not here, email us. A person replies.",
  },
  categories: [
    {
      id: "product",
      title: "The product",
      items: [
        f[0],
        f[3],
        f[4],
        f[6],
        f[7],
        {
          q: "How fast is delivery?",
          a: "Under five minutes for Single Shot and the 30-Day Pass, under two minutes for Landed. If we are ever slower than that, tell us; it is the one failure mode we watch most closely.",
        },
        {
          q: "What exactly do I receive?",
          a: "A tailored resume as .docx and PDF, a cover letter, the match score and verdict, the pay report, the red flag check, interview prep for that role, and your Plan B list of three better-matched roles nearby. Pass holders also get the extension, the tracker, the metric interview, the recruiter objection report and the LinkedIn rewrite.",
        },
        {
          q: "Do I need an account?",
          a: "No. You do not need an account to run the free scan, to buy, or to receive your files by email. Pass holders receive a private link for the application tracker and the browser extension.",
        },
      ],
    },
    {
      id: "pricing",
      title: "Pricing, renewals and refunds",
      items: [
        f[1],
        {
          q: "How do refunds work?",
          a: "If the tailored resume does not score 85 or higher on our published scorer, email us within 14 days and you get a full refund to your original payment method. You keep the resume. Details are on the refunds page.",
        },
        {
          q: "Can I extend a pass?",
          a: "Yes. Existing customers can add another 30 days for $79. It is a separate purchase you make when you want it; nothing renews automatically.",
        },
        {
          q: "Are taxes included?",
          a: "Prices are shown before tax. Applicable sales tax is calculated at checkout from your billing address: GST/HST in Canada, state sales tax in the US where it applies.",
        },
        {
          q: "Can I pay in US dollars?",
          a: "Prices are in Canadian dollars for customers in Canada and US dollars everywhere else. The score, pay report and rewrite work for postings in Canada, the United States, the UK, Australia and any other market. Pay data depends on coverage for that country, and the report says so plainly when there is none.",
        },
      ],
    },
    {
      id: "privacy",
      title: "Privacy and your data",
      items: [
        f[5],
        {
          q: "Who else sees my resume?",
          a: "Only the services needed to produce your files: our hosting provider, our database, the AI model that drafts the rewrite, and the email service that delivers it. Salary lookups send only a job title and a city. Nothing is sold or shared with employers or recruiters.",
        },
        {
          q: "How do I delete my data?",
          a: "Free scan files are deleted automatically after scoring. Paid customers can delete everything with one click from the link in their delivery email, or by emailing us. Deletion is permanent.",
        },
      ],
    },
    {
      id: "organizations",
      title: "Organizations and seats",
      items: [
        {
          q: "How do seats work?",
          a: "Each seat is a 30-day pass. Your organization buys a block of seats and hands them to clients through a white-labelled intake page; each activation draws one seat down. Seats stay valid for 12 months from purchase.",
        },
        {
          q: "What reporting do we get?",
          a: "Quarterly usage reporting: seats used, scores before and after the rewrite, applications per client and voluntary renewals. It is designed to be dropped straight into a funder report.",
        },
        {
          q: "Can our clients use it in French or Spanish?",
          a: "Yes. French and Spanish resume versions are included with every pass, and the intake page can be presented in those languages.",
        },
      ],
    },
  ] as FaqCategory[],
};

/* ---------- Contact ---------- */

export const contactPage = {
  hero: {
    eyebrow: "Contact",
    title: "A person replies.",
    lead: "Email is the fastest way to reach us. Landed customers get a same-day response; everyone else hears back within two business days.",
  },
  channels: [
    { title: "Customers", body: "Questions about a scan, a delivery, a revision or a refund.", email: brand.email, subject: "Orvenic%20support" },
    { title: "Organizations", body: "Pilots, seat packages, white-labelled intake pages and reporting.", email: brand.email, subject: "Orvenic%20pilot" },
    { title: "Privacy", body: "Access, correction or deletion requests under PIPEDA, GDPR, CCPA or your local privacy law.", email: brand.email, subject: "Privacy%20request" },
  ],
  address: `${brand.name} · ${brand.region}`,
};

/* ---------- Legal ---------- */

export interface LegalSection {
  id: string;
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface LegalDoc {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}

export const legal: Record<"privacy" | "terms" | "refunds", LegalDoc> = {
  privacy: {
    title: "Privacy policy",
    updated: "September 2026",
    intro: "Your resume is personal information. This policy explains, in plain language, what we collect, why, how long we keep it, and how to make it go away. Orvenic is a Canadian company and operates under Canada's Personal Information Protection and Electronic Documents Act (PIPEDA). If you are in the United States, the United Kingdom, the European Union or elsewhere, you also have the rights your local law gives you (for example the CCPA in California or the GDPR), and this policy applies to you the same way.",
    sections: [
      {
        id: "collect",
        heading: "What we collect",
        bullets: [
          "The resume file you upload and the text we extract from it.",
          "The job posting text you paste, and a URL if you provide one.",
          "Your email address, used to deliver your files and to enforce the one-scan-per-7-days limit on the free scan.",
          "Answers you give in the metric interview.",
          "Payment confirmation from Stripe. We never see or store your card number.",
          "Basic technical logs (time of request, approximate region, browser type) kept for security and to keep delivery under five minutes.",
          "Anonymous usage analytics through Google Analytics: which pages are visited and which version of the home page headline you saw. Analytics never receives your resume, your posting or your email address.",
        ],
      },
      {
        id: "use",
        heading: "How we use it",
        paragraphs: [
          "We use your information to do the thing you asked for: score your resume against a posting, produce your verdict, pay report and red flag check, rewrite your resume and cover letter, and deliver them to you. We also use it to answer support requests and to honour the guarantee.",
          "We do not use your resume to train models, we do not build marketing profiles, and we do not send newsletters unless you ask for one.",
        ],
      },
      {
        id: "ai",
        heading: "AI processing",
        paragraphs: [
          "Your Candidate Profile and the posting are processed by a large language model through Anthropic's Claude API under commercial terms that do not permit training on customer data. Salary lookups go to a market-data provider and include only a job title and a city, never your name or resume.",
        ],
      },
      {
        id: "retention",
        heading: "How long we keep it",
        bullets: [
          "Free scan: the resume file and posting are deleted within 24 hours of scoring. We keep the email address and score date for 7 days to enforce the scan limit.",
          "Single Shot: files and generated documents are kept for 30 days so we can honour the free revision and the guarantee, then deleted.",
          "30-Day Pass and Landed: kept for the access period plus 30 days, then deleted.",
          "You can delete everything sooner, at any time, with one click from your delivery email or by writing to us.",
        ],
      },
      {
        id: "sharing",
        heading: "Who we share it with",
        paragraphs: [
          "We never sell personal information and we never share it with employers, recruiters or job boards. We use a small number of service providers to run the service: hosting, database and sign-in (Google Firebase), payments, email delivery, analytics, the AI model provider and the salary-data provider. Each receives only what it needs to perform its function and is bound by its own privacy commitments.",
        ],
      },
      {
        id: "rights",
        heading: "Your rights",
        paragraphs: [
          "Wherever you live, you can ask what personal information we hold about you, ask us to correct it, withdraw your consent, and ask us to delete it. Email us and we will respond within 30 days. If you are not satisfied with our response, you can contact the Office of the Privacy Commissioner of Canada or your local data-protection authority.",
        ],
      },
      {
        id: "security",
        heading: "Security",
        paragraphs: [
          "Data is encrypted in transit and at rest. Access is limited to what is needed to deliver and support the service. No system is perfectly secure; if a breach ever affects your information, we will tell you.",
        ],
      },
      {
        id: "age",
        heading: "Age",
        paragraphs: ["Orvenic is for people who are legally able to work in the country where they are applying. It is not directed at anyone under 16."],
      },
      {
        id: "changes",
        heading: "Changes and contact",
        paragraphs: [
          `We will post any changes to this policy here with a new date. Questions and requests go to ${brand.email}.`,
        ],
      },
    ],
  },
  terms: {
    title: "Terms of service",
    updated: "September 2026",
    intro: "These terms are the agreement between you and Orvenic when you use the free scan or buy a package. They are written to be read, not skimmed.",
    sections: [
      {
        id: "service",
        heading: "What Orvenic does",
        paragraphs: [
          "Orvenic scores your resume against job postings you choose, tells you whether a posting is worth applying to, reports the market salary band for that role in your city, flags problems in the posting, and produces a tailored resume and cover letter. Depending on the package, it also provides a browser extension that fills application forms for your review, an application tracker, interview preparation, and human coaching.",
        ],
      },
      {
        id: "eligibility",
        heading: "Who can use it",
        paragraphs: ["You must be at least 16 and legally able to work in the country where you are applying. You are responsible for the accuracy of the information you provide."],
      },
      {
        id: "purchases",
        heading: "Purchases and access periods",
        bullets: [
          "Free scan: one resume against one posting, limited to one scan per email address every 7 days.",
          "Single Shot ($29): the complete package for one posting, with one free revision within 48 hours of delivery.",
          "30-Day Pass ($99): the complete package for unlimited postings for 30 days from purchase, plus the extension, tracker, metric interview, recruiter objection report and LinkedIn rewrite.",
          "Landed ($299): everything in the pass for 90 days from purchase, plus human review of every resume, two live 45-minute coaching sessions, priority delivery and direct email access.",
          "Add-ons are one-time purchases as listed on the pricing page. Prices are in Canadian dollars for customers in Canada and US dollars everywhere else; applicable taxes are added at checkout.",
        ],
      },
      {
        id: "fair-use",
        heading: "Fair use on unlimited packages",
        paragraphs: [
          "“Unlimited” means you can scan and tailor for as many postings as a person can realistically apply to. To keep the service fast and fairly priced, the 30-Day Pass includes up to 50 complete application packages in its 30 days and Landed includes up to 150 in its 90 days. Scans that return a skip verdict do not count. If you reach the limit, we will tell you and you can add capacity or wait for your next period. These limits exist to prevent automated abuse, not to catch ordinary job seekers, and in practice they are rarely approached.",
        ],
      },
      {
        id: "no-subscription",
        heading: "No subscription, no auto-renew",
        paragraphs: [
          "Every purchase is one-time. We do not store your card and we never charge you again without a new purchase you make yourself. Pass holders receive one email at day 25 letting them know the pass is ending. Extending is your decision.",
        ],
      },
      {
        id: "guarantee",
        heading: "The guarantee, and what we do not guarantee",
        paragraphs: [
          "If a tailored resume we deliver does not score 85 or higher on our published scorer, you can request a full refund as described in the refund policy, and you keep the resume.",
          "We do not guarantee interviews, callbacks, offers or employment, and nothing on this site should be read as a promise of any of those. Hiring decisions are made by employers, not by us.",
        ],
      },
      {
        id: "content",
        heading: "Your content and its accuracy",
        paragraphs: [
          "The resume we produce is built only from information you provide. Where a bullet needs a number, we ask you for it and check it against your source; we will not add metrics you did not give us. You are responsible for confirming that everything in your final documents is true, and you own the documents we deliver to you.",
        ],
      },
      {
        id: "extension",
        heading: "The browser extension",
        paragraphs: [
          "The extension fills and drafts application forms in your own browser for your review. It never submits an application on your behalf, and it never pre-fills legal attestations such as work authorization, sponsorship, criminal history or licences; those are always flagged for you to answer. You are responsible for every application you submit and for complying with the terms of the sites you apply on.",
        ],
      },
      {
        id: "acceptable-use",
        heading: "Acceptable use",
        bullets: [
          "Do not use Orvenic to produce documents for a person who has not consented, or to misrepresent identity, credentials or experience.",
          "Do not attempt to automate, scrape, resell or share access to the service outside the organization seat programme.",
          "Do not upload content you do not have the right to share.",
        ],
      },
      {
        id: "organizations",
        heading: "Organization seats",
        paragraphs: [
          "Organizations purchase blocks of seats, each equivalent to a 30-Day Pass, and distribute them to their clients. Seats are valid for 12 months from purchase and are not refundable once activated by a client. The organization is responsible for obtaining its clients' consent to process their information.",
        ],
      },
      {
        id: "availability",
        heading: "Availability and liability",
        paragraphs: [
          "We aim to deliver every package in under five minutes and to keep the service available at all times, but we cannot promise uninterrupted service. To the fullest extent permitted by law, our total liability to you for any claim related to the service is limited to the amount you paid for the package concerned.",
        ],
      },
      {
        id: "law",
        heading: "Governing law, changes and contact",
        paragraphs: [
          `These terms are governed by the laws of Ontario and the federal laws of Canada that apply there. We may update these terms; the current version is always at this address with its date. Questions go to ${brand.email}.`,
        ],
      },
    ],
  },
  refunds: {
    title: "Refund policy",
    updated: "September 2026",
    intro: "85 or it's free. We guarantee the ATS score because we control it, and we publish the breakdown so you can check our work.",
    sections: [
      {
        id: "guarantee",
        heading: "The guarantee",
        paragraphs: [
          "If a tailored resume we deliver scores below 85 on our deterministic scorer against the posting you supplied, you are entitled to a full refund of the package price. You keep the resume and every other file we delivered.",
        ],
      },
      {
        id: "how",
        heading: "How to claim",
        bullets: [
          `Email ${brand.email} within 14 days of delivery. One email is enough; you do not need to justify anything beyond the score.`,
          "We confirm the score from our records and refund the full amount to your original payment method within 5 to 10 business days.",
          "For the 30-Day Pass and Landed, the guarantee applies to every resume delivered during the access period.",
        ],
      },
      {
        id: "not-covered",
        heading: "What is not covered",
        bullets: [
          "The free scan, because there is nothing to refund.",
          "Coaching sessions that have already taken place. Unused sessions are refundable.",
          "Organization seats that a client has already activated.",
          "Interviews, callbacks or job offers, which we never guarantee.",
        ],
      },
      {
        id: "changed-mind",
        heading: "If you simply change your mind",
        paragraphs: [
          "Because delivery happens within minutes, we do not offer change-of-mind refunds after files have been delivered. If you bought a pass and have not used it at all, email us within 48 hours and we will refund it.",
        ],
      },
      {
        id: "disputes",
        heading: "Before you dispute a charge",
        paragraphs: [
          "Please write to us first. Almost every problem is solved faster by email than through a card dispute, and we would rather fix the resume than argue about the charge.",
        ],
      },
    ],
  },
};

export const notFoundPage = {
  eyebrow: "404",
  title: "This page didn't make the shortlist.",
  lead: "The address may have changed or never existed. The useful parts of the site are one click away.",
  links: [
    { label: "Home", href: "/" },
    { label: "How it works", href: "/how-it-works" },
    { label: "Pricing", href: "/pricing" },
    { label: "Free scan", href: "/scan" },
  ] as Link[],
};
