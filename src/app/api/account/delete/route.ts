import { ok, withHandler } from "@/lib/app/errors";
import { requireUser } from "@/lib/app/auth-server";
import { adminAuth } from "@/lib/firebase/admin";
import { deleteUserData } from "@/lib/store/users";

export const runtime = "nodejs";

/** PIPEDA: one request deletes every application, the profile, purchase records and the sign-in itself. */
export const POST = withHandler(async (req) => {
  const { uid } = await requireUser(req);
  await deleteUserData(uid);
  await adminAuth().deleteUser(uid);
  return ok({});
});
