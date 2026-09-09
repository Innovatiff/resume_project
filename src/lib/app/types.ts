/* ------------------------------------------------------------------
   Product data model. Everything stored in Firestore is typed here.
   Dates are ISO strings so documents serialise cleanly to the client.
------------------------------------------------------------------- */

export type Language = "en" | "fr" | "es";

export type PlanId = "single" | "pass" | "landed";
export type AddonId = "extra30" | "coaching" | "rush_review" | "linkedin";
export type ProductId = PlanId | AddonId;

export type Verdict = "apply" | "borderline" | "skip";
export type Strategy = "standard" | "long_shot";

export type ApplicationStatus =
  | "scored"
  | "needs_input"
  | "building"
  | "ready"
  | "applied"
  | "interview"
  | "offer"
  | "rejected"
  | "archived";

/* ---------- candidate profile (Stage 1 extraction) ---------- */

export interface ProfileBullet {
  text: string;
  /** Every figure found in the bullet, as written ("34%", "7 months", "$1.2M"). */
  metrics: string[];
  hasMetric: boolean;
}

export interface ProfileExperience {
  title: string;
  company: string;
  location?: string;
  start?: string;
  end?: string;
  current?: boolean;
  bullets: ProfileBullet[];
}

export interface ProfileEducation {
  credential: string;
  institution?: string;
  year?: string;
}

export interface CandidateProfile {
  name?: string;
  headline?: string;
  contact: {
    email?: string;
    phone?: string;
    city?: string;
    province?: string;
    linkedin?: string;
  };
  summary?: string;
  experience: ProfileExperience[];
  skills: string[];
  education: ProfileEducation[];
  certifications: string[];
  languages: string[];
  /** Years of paid experience the extractor could account for. */
  totalYears?: number;
}

export interface LayoutFlags {
  fileType: "pdf" | "docx";
  pages: number;
  words: number;
  multiColumn: boolean;
  tables: boolean;
  images: boolean;
  /** True when the PDF had no extractable text (scanned). */
  noText: boolean;
}

export interface ProfileSource {
  fileName: string;
  fileType: "pdf" | "docx";
  extractedAt: string;
  textLength: number;
  layout: LayoutFlags;
}

/* ---------- posting (parsed) ---------- */

export interface JobRequirements {
  title: string;
  company?: string;
  location?: string;
  city?: string;
  province?: string;
  remote?: boolean;
  employmentType?: string;
  salaryStated?: string;
  yearsRequired?: number;
  mustHave: string[];
  niceToHave: string[];
  credentials: string[];
  responsibilities: string[];
  postedDaysAgo?: number;
  /** Phrases that may need a legal attestation (authorization, licences, record checks). */
  attestations: string[];
}

/* ---------- scoring ---------- */

export interface ScoreComponent {
  key: string;
  label: string;
  points: number;
  max: number;
  detail: string;
}

export interface ScoreResult {
  score: number;
  verdict: Verdict;
  breakdown: ScoreComponent[];
  /** The three most specific reasons the resume is being filtered out. */
  reasons: string[];
  missingMustHave: string[];
  missingNiceToHave: string[];
}

export interface RedFlag {
  id: string;
  severity: "high" | "medium" | "info";
  title: string;
  detail: string;
}

/* ---------- pay report ---------- */

export interface PayReport {
  available: boolean;
  title: string;
  location: string;
  currency: "CAD";
  low?: number;
  median?: number;
  high?: number;
  sampleSize?: number;
  source: "adzuna" | "mock" | "none";
  message?: string;
  fetchedAt: string;
}

export interface PlanBRole {
  title: string;
  company?: string;
  location?: string;
  salaryLow?: number;
  salaryHigh?: number;
  url?: string;
  why: string;
}

/* ---------- package (rewrite) ---------- */

export interface TailoredExperience {
  title: string;
  company: string;
  location?: string;
  start?: string;
  end?: string;
  bullets: string[];
}

export interface TailoredResume {
  name: string;
  headline: string;
  contact: { email?: string; phone?: string; city?: string; linkedin?: string };
  summary: string;
  experience: TailoredExperience[];
  skills: { group: string; items: string[] }[];
  education: { credential: string; institution?: string; year?: string }[];
  certifications: string[];
  languages: string[];
}

export interface MetricQuestion {
  id: string;
  /** Which bullet (experience index, bullet index) the question is about. */
  experienceIndex: number;
  bulletIndex: number;
  bullet: string;
  question: string;
  why: string;
}

export interface NumberValidation {
  passed: boolean;
  orphanNumbers: string[];
  removedBullets: number;
  retried: boolean;
}

export interface InterviewPrep {
  questions: { question: string; angle: string; evidence: string }[];
  storiesToPrepare: string[];
  questionsToAsk: string[];
}

export interface ObjectionReport {
  objections: { objection: string; likelihood: "high" | "medium" | "low"; counter: string }[];
}

export interface LinkedInRewrite {
  headline: string;
  about: string;
}

export interface ApplicationPackage {
  resume: TailoredResume;
  coverLetter: string;
  strategy: Strategy;
  validation: NumberValidation;
  scoreAfter: ScoreResult;
  prep?: InterviewPrep;
  objections?: ObjectionReport;
  linkedin?: LinkedInRewrite;
  model: string;
  generatedAt: string;
}

/* ---------- application ---------- */

export interface Application {
  id: string;
  uid: string;
  createdAt: string;
  updatedAt: string;
  status: ApplicationStatus;
  posting: { title: string; company?: string; location?: string; text: string; url?: string };
  requirements: JobRequirements;
  score: ScoreResult;
  redFlags: RedFlag[];
  payReport: PayReport;
  planB: PlanBRole[];
  strategy: Strategy;
  interview?: { questions: MetricQuestion[]; answers: Record<string, string>; completedAt?: string };
  package?: ApplicationPackage;
  humanReview?: { status: "queued" | "done"; requestedAt: string; doneAt?: string; note?: string };
  planUsed?: PlanId;
  appliedAt?: string;
  notes?: string;
}

/* ---------- user + purchases ---------- */

export interface UserDoc {
  uid: string;
  email: string;
  displayName?: string;
  language: Language;
  city?: string;
  province?: string;
  createdAt: string;
  updatedAt: string;
  profile?: CandidateProfile;
  profileSource?: ProfileSource;
  stripeCustomerId?: string;
}

export type PurchaseStatus = "active" | "used" | "expired" | "refunded";

export interface Purchase {
  id: string;
  uid: string;
  product: ProductId;
  status: PurchaseStatus;
  amountCents: number;
  currency: "cad";
  createdAt: string;
  startsAt: string;
  /** Undefined for single-use products. */
  endsAt?: string;
  /** Packages delivered against this purchase. */
  used: number;
  source: "stripe" | "dev" | "seat" | "manual";
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  refundedAt?: string;
}

/* ---------- free scan ---------- */

export interface FreeScanResult {
  id: string;
  createdAt: string;
  expiresAt: string;
  postingTitle: string;
  score: ScoreResult;
  layout: LayoutFlags;
  redFlags: RedFlag[];
}

/* ---------- API shapes ---------- */

export interface EntitlementSummary {
  plan: PlanId | null;
  purchaseId?: string;
  endsAt?: string;
  daysLeft?: number;
  /** Whether another package can be built right now. Caps are never exposed. */
  canBuild: boolean;
  reason?: string;
  features: PlanFeatures;
}

export interface PlanFeatures {
  rewrite: boolean;
  metricInterview: boolean;
  objections: boolean;
  linkedin: boolean;
  humanReview: boolean;
  coaching: boolean;
  priority: boolean;
  tracker: boolean;
}

export interface MeResponse {
  user: Pick<UserDoc, "uid" | "email" | "displayName" | "language" | "city" | "province" | "createdAt">;
  hasProfile: boolean;
  profile?: CandidateProfile;
  profileSource?: ProfileSource;
  entitlement: EntitlementSummary;
  purchases: Purchase[];
}
