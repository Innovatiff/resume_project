import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { z } from "zod";
import { config } from "@/lib/app/config";
import { ApiError } from "@/lib/app/errors";

/* ------------------------------------------------------------------
   Thin wrapper over the Anthropic SDK: structured JSON out, stable
   cached system prompt, friendly errors. Routing by task:
     extract  -> config.ai.models.extract  (Haiku 4.5)
     rewrite  -> config.ai.models.rewrite  (Sonnet 5)
     premium  -> config.ai.models.premium  (Opus 5, Landed only)
------------------------------------------------------------------- */

let client: Anthropic | null = null;

export function anthropic(): Anthropic {
  if (!client) client = new Anthropic({ apiKey: config.ai.apiKey || undefined, maxRetries: 2, timeout: 120_000 });
  return client;
}

export type ModelRole = "extract" | "rewrite" | "premium";

export function modelFor(role: ModelRole): string {
  return config.ai.models[role];
}

function supportsEffort(model: string): boolean {
  return !/haiku/i.test(model);
}

export interface GenerateOptions<T> {
  role: ModelRole;
  system: string;
  user: string;
  schema: z.ZodType<T>;
  maxTokens?: number;
  effort?: "low" | "medium" | "high";
}

export async function generate<T>(opts: GenerateOptions<T>): Promise<{ output: T; model: string }> {
  const model = modelFor(opts.role);
  try {
    const response = await anthropic().messages.parse({
      model,
      max_tokens: opts.maxTokens ?? 8000,
      system: [{ type: "text", text: opts.system, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: opts.user }],
      output_config: {
        format: zodOutputFormat(opts.schema),
        ...(opts.effort && supportsEffort(model) ? { effort: opts.effort } : {}),
      },
    });
    if (response.stop_reason === "refusal") {
      throw new ApiError(422, "model_refused", "The model declined to process this content. Check the posting and resume for anything unusual and try again.");
    }
    if (response.stop_reason === "max_tokens" || !response.parsed_output) {
      throw new ApiError(502, "model_incomplete", "The model returned an incomplete result. Try again.");
    }
    return { output: response.parsed_output, model };
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err instanceof Anthropic.AuthenticationError) throw new ApiError(500, "ai_auth", "The AI service is misconfigured (invalid API key).");
    if (err instanceof Anthropic.RateLimitError) throw new ApiError(503, "ai_busy", "The AI service is busy. Try again in a minute.");
    if (err instanceof Anthropic.APIConnectionError) throw new ApiError(503, "ai_unreachable", "Could not reach the AI service. Try again in a minute.");
    if (err instanceof Anthropic.APIError) throw new ApiError(502, "ai_error", `AI service error (${err.status}).`);
    throw err;
  }
}
