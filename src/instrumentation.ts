import type { Instrumentation } from "next";

/** Server errors Next.js catches outside our handlers (module load failures, rendering) go to the host's logs with the route named. */
export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  const message = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
  console.error(`[shortlist] ${request.method} ${request.path} (${context.routeType} ${context.routePath}): ${message}`);
  if (err instanceof Error && err.stack) console.error(err.stack.split("\n").slice(1, 6).join("\n"));
};
