/* ------------------------------------------------------------------
   Runs on the Orvenic site and does nothing until the Extension page
   asks. Announces the extension to that page and carries the
   connection code it issues into the background worker, so the
   candidate never copies anything. Declared for the whole site because
   the app navigates client-side; the page it serves is checked by path.
------------------------------------------------------------------- */

const VERSION = chrome.runtime.getManifest().version;

function onExtensionPage(): boolean {
  return location.pathname.startsWith("/app/extension");
}

function hello(): void {
  if (!onExtensionPage()) return;
  window.postMessage({ type: "orvenic-extension:hello", version: VERSION }, location.origin);
}

window.addEventListener("message", (e: MessageEvent) => {
  if (e.source !== window || e.origin !== location.origin) return;
  const d = e.data as { type?: string; key?: string } | null;
  if (!d || typeof d !== "object") return;
  if (d.type === "orvenic-extension:ping") hello();
  if (d.type === "orvenic-extension:connect" && typeof d.key === "string" && onExtensionPage()) {
    chrome.runtime
      .sendMessage({ type: "connect", key: d.key, baseUrl: location.origin })
      .then((r: { ok?: boolean; error?: string; me?: { email?: string } } | undefined) => {
        window.postMessage({ type: "orvenic-extension:connected", ok: r?.ok === true, email: r?.me?.email, error: r?.error }, location.origin);
      })
      .catch((err: unknown) => {
        window.postMessage({ type: "orvenic-extension:connected", ok: false, error: String((err as Error)?.message ?? err) }, location.origin);
      });
  }
});

hello();
