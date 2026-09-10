"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch, ApiClientError } from "@/lib/app/auth-client";
import { useMe } from "@/lib/app/use-me";
import type { PublicExtensionKey } from "@/lib/app/types";
import { Card, CopyButton, Notice, PageHead, Skeleton, fmtDate } from "./ui";

/* ------------------------------------------------------------------
   Install and connect the browser extension. The extension's bridge
   script announces itself on this page; the Connect button mints a key
   and hands it over without the candidate copying anything. Without
   the bridge (another browser, an older build) the code is shown once.
------------------------------------------------------------------- */

const SUPPORTED = ["Greenhouse", "Lever", "Ashby", "Workday"];

function browserLabel(): string {
  const ua = navigator.userAgent;
  const browser = /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" : /Brave/.test(ua) ? "Brave" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : "Browser";
  const os = /Windows/.test(ua) ? "Windows" : /Mac OS/.test(ua) ? "macOS" : /CrOS/.test(ua) ? "ChromeOS" : /Linux/.test(ua) ? "Linux" : "";
  return [browser, os].filter(Boolean).join(" on ");
}

export default function ExtensionPanel() {
  const { me, loading } = useMe();
  const [detected, setDetected] = useState<string | null>(null);
  const [keys, setKeys] = useState<PublicExtensionKey[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "error" | "success" | "info"; text: string } | null>(null);
  const [secret, setSecret] = useState<string | null>(null);

  const loadKeys = useCallback(async () => {
    try {
      const d = await apiFetch<{ keys: PublicExtensionKey[] }>("/api/extension/keys");
      setKeys(d.keys);
    } catch {
      setKeys([]);
    }
  }, []);

  useEffect(() => {
    if (!loading && me) void Promise.resolve().then(loadKeys);
  }, [loading, me, loadKeys]);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.source !== window || e.origin !== window.location.origin) return;
      const d = e.data as { type?: string; version?: string; ok?: boolean; email?: string; error?: string } | null;
      if (!d || typeof d !== "object") return;
      if (d.type === "orvenic-extension:hello") setDetected(String(d.version ?? ""));
      if (d.type === "orvenic-extension:connected") {
        setBusy(false);
        if (d.ok) {
          setSecret(null);
          setMsg({ kind: "success", text: `This browser is connected${d.email ? ` as ${d.email}` : ""}. Open the Orvenic button on any job posting.` });
          void loadKeys();
        } else setMsg({ kind: "error", text: d.error || "The extension could not connect. Try again." });
      }
    };
    window.addEventListener("message", onMessage);
    window.postMessage({ type: "orvenic-extension:ping" }, window.location.origin);
    return () => window.removeEventListener("message", onMessage);
  }, [loadKeys]);

  const connect = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const d = await apiFetch<{ secret: string }>("/api/extension/keys", { method: "POST", body: JSON.stringify({ label: browserLabel() }) });
      if (detected) {
        window.postMessage({ type: "orvenic-extension:connect", key: d.secret }, window.location.origin);
        // The bridge answers with orvenic-extension:connected; give it a moment before assuming it did not.
        setTimeout(() => {
          setBusy((b) => {
            if (b) setMsg({ kind: "error", text: "The extension did not answer. Reload this page and try again." });
            return false;
          });
        }, 8000);
      } else {
        setSecret(d.secret);
        setBusy(false);
        void loadKeys();
      }
    } catch (e) {
      setMsg({ kind: "error", text: e instanceof ApiClientError ? e.message : "Could not create a connection." });
      setBusy(false);
    }
  };

  const revoke = async (id: string) => {
    try {
      await apiFetch(`/api/extension/keys/${id}`, { method: "DELETE" });
      setMsg({ kind: "info", text: "That browser is disconnected." });
      await loadKeys();
    } catch (e) {
      setMsg({ kind: "error", text: e instanceof ApiClientError ? e.message : "Could not disconnect that browser." });
    }
  };

  const hasExtension = Boolean(me?.entitlement.features.extension);

  return (
    <>
      <PageHead title="Browser extension" sub={`Fills ${SUPPORTED.slice(0, -1).join(", ")} and ${SUPPORTED.at(-1)} forms from your package. You review and click.`} />
      {msg ? <Notice kind={msg.kind}>{msg.text}</Notice> : null}
      {!loading && !hasExtension ? (
        <Notice kind="info">
          The extension comes with the 30-Day Pass and Landed. You can connect it now; it starts working the moment a pass is active. <Link href="/checkout?plan=pass">See the passes</Link>
        </Notice>
      ) : null}

      <div className="app-grid app-grid--main">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card title="1. Install it" hint="Chrome, Edge and Brave. Two minutes.">
            <ol className="app-steps">
              <li>
                <a href="/downloads/orvenic-extension.zip">Download the extension</a> and unzip it somewhere you will not delete.
              </li>
              <li>
                Open <code>chrome://extensions</code> (Edge: <code>edge://extensions</code>) and turn on <b>Developer mode</b>, top right.
              </li>
              <li>
                Click <b>Load unpacked</b> and choose the unzipped folder. Pin the Orvenic button from the puzzle-piece menu.
              </li>
            </ol>
            <p className="app-muted" style={{ marginTop: 10, fontSize: "0.85rem" }}>
              A Chrome Web Store listing is in review. Until then this is the same code, loaded by hand.
            </p>
          </Card>

          <Card title="2. Connect this browser" hint="Links the extension to your account. Nothing to copy when the extension is installed here.">
            {loading ? (
              <Skeleton h={60} />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <p className="app-muted" data-extension={detected ? "detected" : "missing"}>
                  {detected ? `Extension detected (version ${detected}).` : "No extension detected in this browser yet. Install it first, or connect with a code below."}
                </p>
                <div>
                  <button type="button" className="btn btn--coral" onClick={() => void connect()} disabled={busy}>
                    {busy ? "Connecting…" : detected ? "Connect this browser" : "Create a connection code"}
                  </button>
                </div>
                {secret ? (
                  <div className="app-notice" data-kind="info" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <b>Your connection code. It is shown once.</b>
                    <code style={{ wordBreak: "break-all", fontSize: "0.85rem" }}>{secret}</code>
                    <div>
                      <CopyButton text={secret} label="Copy code" />
                    </div>
                    <span style={{ fontSize: "0.85rem" }}>Open the Orvenic button in the browser you want to connect, choose “Or paste a connection code”, and paste it.</span>
                  </div>
                ) : null}
              </div>
            )}
          </Card>

          <Card title="Connected browsers" hint="Disconnect any browser you no longer use. It stops working immediately.">
            {keys === null ? (
              <Skeleton h={48} />
            ) : keys.length === 0 ? (
              <p className="app-muted">No browser is connected yet.</p>
            ) : (
              <table className="app-table">
                <thead>
                  <tr>
                    <th>Browser</th>
                    <th>Connected</th>
                    <th>Last used</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {keys.map((k) => (
                    <tr key={k.id}>
                      <td>
                        {k.label} <span className="app-muted">({k.prefix}…)</span>
                      </td>
                      <td>{fmtDate(k.createdAt)}</td>
                      <td>{k.lastUsedAt ? fmtDate(k.lastUsedAt) : "Not yet"}</td>
                      <td style={{ textAlign: "right" }}>
                        <button type="button" className="btn btn--ghost btn--sm" onClick={() => void revoke(k.id)}>
                          Disconnect
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card title="What it does">
            <ul className="app-bullets">
              <li>On a job posting: scores it against your resume from the page. Verdict, pay report and red flags, same as the app.</li>
              <li>On an application form: fills your details, attaches the tailored resume and types or attaches the cover letter, from the package you built.</li>
              <li>Marks in red every question you must answer yourself, and shows the pay report beside a salary ask without filling it.</li>
              <li>Works on {SUPPORTED.join(", ")} and on forms embedded in company sites.</li>
            </ul>
          </Card>
          <Card title="What it never does" className="app-card--ink">
            <ul className="app-bullets">
              <li>It never clicks submit. There is no code path that touches the button; you review, then you click.</li>
              <li>It never answers a legal attestation: work authorization, sponsorship, criminal history, licences, age.</li>
              <li>It never invents a fact. Every field comes from your profile or your package, both verified against your source.</li>
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
