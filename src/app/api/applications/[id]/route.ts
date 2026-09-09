import { ApiError, ok, withHandler } from "@/lib/app/errors";
import { requireUser } from "@/lib/app/auth-server";
import { readJson } from "@/lib/app/request";
import { deleteApplication, getApplication, updateApplication } from "@/lib/store/applications";
import type { Application, ApplicationStatus, Strategy } from "@/lib/app/types";

export const runtime = "nodejs";

const STATUSES: ApplicationStatus[] = ["scored", "needs_input", "building", "ready", "applied", "interview", "offer", "rejected", "archived"];
const USER_SETTABLE: ApplicationStatus[] = ["applied", "interview", "offer", "rejected", "archived", "ready"];

export const GET = withHandler(async (req, ctx: RouteContext<"/api/applications/[id]">) => {
  const { uid } = await requireUser(req);
  const { id } = await ctx.params;
  const application = await getApplication(uid, id);
  if (!application) throw new ApiError(404, "not_found", "Application not found.");
  return ok({ application });
});

export const PATCH = withHandler(async (req, ctx: RouteContext<"/api/applications/[id]">) => {
  const { uid } = await requireUser(req);
  const { id } = await ctx.params;
  const app = await getApplication(uid, id);
  if (!app) throw new ApiError(404, "not_found", "Application not found.");
  const body = await readJson<{ status?: string; notes?: string; strategy?: string }>(req);
  const patch: Partial<Application> = {};
  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status as ApplicationStatus) || !USER_SETTABLE.includes(body.status as ApplicationStatus)) throw new ApiError(400, "bad_status", "That status cannot be set here.");
    if (body.status === "ready" && !app.package) throw new ApiError(400, "bad_status", "Build the package first.");
    patch.status = body.status as ApplicationStatus;
    if (body.status === "applied" && !app.appliedAt) patch.appliedAt = new Date().toISOString();
  }
  if (body.notes !== undefined) patch.notes = String(body.notes).slice(0, 4000);
  if (body.strategy !== undefined) {
    if (body.strategy !== "standard" && body.strategy !== "long_shot") throw new ApiError(400, "bad_strategy", "Strategy must be standard or long_shot.");
    if (app.package) throw new ApiError(400, "locked", "The package is already built with a strategy.");
    patch.strategy = body.strategy as Strategy;
  }
  await updateApplication(uid, id, patch);
  return ok({ application: { ...app, ...patch } });
});

export const DELETE = withHandler(async (req, ctx: RouteContext<"/api/applications/[id]">) => {
  const { uid } = await requireUser(req);
  const { id } = await ctx.params;
  await deleteApplication(uid, id);
  return ok({});
});
