import { z } from "zod";

/* ------------------------------------------------------------------
   Structured-output schemas. Every field is required; optional values
   are nullable so the JSON schema stays strict and the model never omits.
------------------------------------------------------------------- */

export const ProfileSchema = z.object({
  name: z.string().nullable(),
  headline: z.string().nullable(),
  contact: z.object({
    email: z.string().nullable(),
    phone: z.string().nullable(),
    city: z.string().nullable(),
    province: z.string().nullable(),
    country: z.string().nullable(),
    linkedin: z.string().nullable(),
  }),
  summary: z.string().nullable(),
  experience: z.array(
    z.object({
      title: z.string(),
      company: z.string(),
      location: z.string().nullable(),
      start: z.string().nullable(),
      end: z.string().nullable(),
      current: z.boolean(),
      bullets: z.array(z.string()),
    }),
  ),
  skills: z.array(z.string()),
  education: z.array(z.object({ credential: z.string(), institution: z.string().nullable(), year: z.string().nullable() })),
  certifications: z.array(z.string()),
  languages: z.array(z.string()),
  totalYears: z.number().nullable(),
});
export type ProfileOut = z.infer<typeof ProfileSchema>;

export const RequirementsSchema = z.object({
  title: z.string(),
  company: z.string().nullable(),
  location: z.string().nullable(),
  city: z.string().nullable(),
  province: z.string().nullable(),
  country: z.string().nullable(),
  remote: z.boolean(),
  employmentType: z.string().nullable(),
  salaryStated: z.string().nullable(),
  yearsRequired: z.number().nullable(),
  mustHave: z.array(z.string()),
  niceToHave: z.array(z.string()),
  credentials: z.array(z.string()),
  responsibilities: z.array(z.string()),
  postedDaysAgo: z.number().nullable(),
  attestations: z.array(z.string()),
});
export type RequirementsOut = z.infer<typeof RequirementsSchema>;

export const QuestionsSchema = z.object({
  questions: z.array(
    z.object({
      experienceIndex: z.number(),
      bulletIndex: z.number(),
      question: z.string(),
      why: z.string(),
    }),
  ),
});
export type QuestionsOut = z.infer<typeof QuestionsSchema>;

export const RewriteSchema = z.object({
  resume: z.object({
    name: z.string(),
    headline: z.string(),
    contact: z.object({ email: z.string().nullable(), phone: z.string().nullable(), city: z.string().nullable(), linkedin: z.string().nullable() }),
    summary: z.string(),
    experience: z.array(
      z.object({
        title: z.string(),
        company: z.string(),
        location: z.string().nullable(),
        start: z.string().nullable(),
        end: z.string().nullable(),
        bullets: z.array(z.string()),
      }),
    ),
    skills: z.array(z.object({ group: z.string(), items: z.array(z.string()) })),
    education: z.array(z.object({ credential: z.string(), institution: z.string().nullable(), year: z.string().nullable() })),
    certifications: z.array(z.string()),
    languages: z.array(z.string()),
  }),
  coverLetter: z.string(),
});
export type RewriteOut = z.infer<typeof RewriteSchema>;

export const PrepSchema = z.object({
  questions: z.array(z.object({ question: z.string(), angle: z.string(), evidence: z.string() })),
  storiesToPrepare: z.array(z.string()),
  questionsToAsk: z.array(z.string()),
});

export const ObjectionsSchema = z.object({
  objections: z.array(z.object({ objection: z.string(), likelihood: z.enum(["high", "medium", "low"]), counter: z.string() })),
});

export const LinkedInSchema = z.object({ headline: z.string(), about: z.string() });
