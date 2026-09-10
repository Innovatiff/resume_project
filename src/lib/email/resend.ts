import "server-only";
import { Resend } from "resend";
import { config } from "@/lib/app/config";

/* Delivery emails. When Resend is not configured we log and continue. */

let resend: Resend | null = null;

function client(): Resend | null {
  if (!config.email.resendKey) return null;
  if (!resend) resend = new Resend(config.email.resendKey);
  return resend;
}

export async function sendEmail(input: { to: string; subject: string; text: string; html?: string }): Promise<boolean> {
  const c = client();
  if (!c) {
    if (!config.isProd) console.info(`[email:skipped] to=${input.to} subject=${input.subject}`);
    return false;
  }
  try {
    await c.emails.send({ from: config.email.from, to: input.to, subject: input.subject, text: input.text, html: input.html });
    return true;
  } catch (err) {
    console.error("[email] send failed", err);
    return false;
  }
}

export function freeScanEmail(input: { score: number; verdict: string; reasons: string[]; resultUrl: string }): { subject: string; text: string } {
  return {
    subject: `Your Orvenic scan: ${input.score}/100`,
    text: [`Your resume scored ${input.score} out of 100 against that posting (${input.verdict}).`, "", "The three reasons it is being filtered out:", ...input.reasons.map((r, i) => `${i + 1}. ${r}`), "", `Full breakdown: ${input.resultUrl}`, "", "Orvenic · Windsor–Essex, Ontario"].join("\n"),
  };
}

export function packageReadyEmail(input: { title: string; company?: string; score: number; url: string }): { subject: string; text: string } {
  return {
    subject: `Your ${input.title} package is ready (${input.score}/100)`,
    text: [`Your tailored resume and cover letter for ${input.title}${input.company ? ` at ${input.company}` : ""} are ready.`, `After the rewrite it scores ${input.score} out of 100.`, "", `Open it: ${input.url}`, "", "Orvenic · Windsor–Essex, Ontario"].join("\n"),
  };
}

export async function notifyFounder(subject: string, text: string): Promise<void> {
  if (!config.email.founder) return;
  await sendEmail({ to: config.email.founder, subject, text });
}
