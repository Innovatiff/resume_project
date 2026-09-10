import { ok, withHandler } from "@/lib/app/errors";
import { requireUser } from "@/lib/app/auth-server";
import { readJson } from "@/lib/app/request";
import { createExtensionKey, listExtensionKeys, publicKey } from "@/lib/store/extension-keys";

export const runtime = "nodejs";

/* Connected browsers. Only a signed-in session (ID token) can list or create keys; the extension itself cannot mint more. */

export const GET = withHandler(async (req) => {
  const { uid } = await requireUser(req);
  const keys = await listExtensionKeys(uid);
  return ok({ keys: keys.map(publicKey) });
});

/** Create a key. The secret is returned once and never stored. */
export const POST = withHandler(async (req) => {
  const { uid } = await requireUser(req);
  const body = await readJson<{ label?: string }>(req).catch(() => ({}) as { label?: string });
  const { secret, key } = await createExtensionKey(uid, typeof body.label === "string" ? body.label : "");
  return ok({ secret, key: publicKey(key) }, { status: 201 });
});
