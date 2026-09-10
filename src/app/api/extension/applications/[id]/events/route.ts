import { ApiError, ok, withHandler } from "@/lib/app/errors";
import { requireExtensionAccess, requireExtensionUser } from "@/lib/app/auth-server";
import { readJson } from "@/lib/app/request";
import { getApplication, updateApplication } from "@/lib/store/applications";
import { nowIso } from "@/lib/app/hash";
import type { Application, ExtensionFillRecord } from "@/lib/app/types";

export const runtime = "nodejs";

const count = (v: unknown) => Math.max(0, Math.min(500, Math.floor(Number(v) || 0)));

/**
 * What happened in the browser: "filled" records the fill on the application
 * (and keeps the posting URL if we did not have one); "applied" is the
 * candidate telling us they clicked submit themselves.
 */
export const POST = withHandler(async (req, ctx: { params: Promise<{ id: string }> }) => {
  const { uid } = await requireExtensionUser(req);
  await requireExtensionAccess(uid);
  const { id } = await ctx.params;
  const app = await getApplication(uid, id);
  if (!app) throw new ApiError(404, "not_found", "Application not found.");
  const body = await readJson<{ event?: string; ats?: string; url?: string; filled?: number; flagged?: number }>(req);

  if (body.event === "filled") {
    const record: ExtensionFillRecord = {
      filledAt: nowIso(),
      ats: String(body.ats ?? "other").slice(0, 20),
      url: String(body.url ?? "").slice(0, 500),
      filled: count(body.filled),
      flagged: count(body.flagged),
    };
    const patch: Partial<Application> = { extension: record };
    if (!app.posting.url && /^https?:\/\//i.test(record.url)) patch.posting = { ...app.posting, url: record.url };
    await updateApplication(uid, id, patch);
    return ok({ extension: record });
  }

  if (body.event === "applied") {
    const patch: Partial<Application> = { status: "applied" };
    if (!app.appliedAt) patch.appliedAt = nowIso();
    await updateApplication(uid, id, patch);
    return ok({ status: "applied", appliedAt: app.appliedAt ?? patch.appliedAt });
  }

  throw new ApiError(400, "bad_event", "Unknown event.");
});
