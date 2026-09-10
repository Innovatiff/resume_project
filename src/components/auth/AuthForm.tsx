"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Logo from "@/components/Logo";
import { friendlyAuthError, useAuth } from "@/lib/app/auth-client";
import { Notice } from "@/components/app/ui";

type Mode = "sign-in" | "sign-up" | "forgot";

function safeNext(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/app";
  return raw;
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.43.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.94l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06L5.84 9.9C6.71 7.31 9.14 5.38 12 5.38Z" />
    </svg>
  );
}

export default function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const { signIn, signUp, signInWithGoogle, resetPassword, configured } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const title = mode === "sign-in" ? "Welcome back." : mode === "sign-up" ? "Create your account." : "Reset your password.";
  const sub = mode === "sign-in" ? "Sign in to your applications, documents and purchases." : mode === "sign-up" ? "One account for every package. No card until you buy, and never one on file." : "We will email you a link to choose a new password.";

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "forgot") {
        await resetPassword(email.trim());
        setDone("If that address has an account, a reset link is on its way.");
      } else {
        if (mode === "sign-up" && password.length < 8) throw { code: "auth/weak-password" };
        if (mode === "sign-in") await signIn(email.trim(), password);
        else await signUp(email.trim(), password, name.trim() || undefined);
        router.replace(next);
      }
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setError(null);
    setBusy(true);
    try {
      await signInWithGoogle();
      router.replace(next);
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <Link href="/" className="auth-brand" aria-label="Orvenic home">
          <Logo />
        </Link>
        <h1>{title}</h1>
        <p>{sub}</p>

        {!configured ? <Notice kind="error">Firebase is not configured. See .env.example.</Notice> : null}
        {error ? <Notice kind="error">{error}</Notice> : null}
        {done ? <Notice kind="success">{done}</Notice> : null}

        {mode !== "forgot" ? (
          <>
            <button type="button" className="auth-google" onClick={() => void google()} disabled={busy || !configured}>
              <GoogleIcon /> Continue with Google
            </button>
            <div className="auth-or">or with email</div>
          </>
        ) : null}

        <form className="auth-form" onSubmit={submit}>
          {mode === "sign-up" ? (
            <div className="app-field">
              <label htmlFor="name">Name</label>
              <input id="name" className="app-input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="How should we address you?" />
            </div>
          ) : null}
          <div className="app-field">
            <label htmlFor="email">Email</label>
            <input id="email" className="app-input" type="email" inputMode="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          {mode !== "forgot" ? (
            <div className="app-field">
              <label htmlFor="password">
                Password
                {mode === "sign-up" ? <span>at least 8 characters</span> : null}
              </label>
              <input id="password" className="app-input" type="password" autoComplete={mode === "sign-up" ? "new-password" : "current-password"} required minLength={mode === "sign-up" ? 8 : undefined} value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          ) : null}
          <button className="btn btn--coral btn--lg btn--block" type="submit" disabled={busy || !configured}>
            {busy ? "One moment…" : mode === "sign-in" ? "Sign in" : mode === "sign-up" ? "Create account" : "Send reset link"}
          </button>
        </form>

        <div className="auth-links">
          {mode === "sign-in" ? (
            <>
              <Link href={`/sign-up?next=${encodeURIComponent(next)}`}>Create an account</Link>
              <Link href="/forgot-password">Forgot password?</Link>
            </>
          ) : mode === "sign-up" ? (
            <span>
              Already have one? <Link href={`/sign-in?next=${encodeURIComponent(next)}`}>Sign in</Link>
            </span>
          ) : (
            <Link href="/sign-in">Back to sign in</Link>
          )}
        </div>
        {mode === "sign-up" ? (
          <p className="auth-fine">
            By creating an account you agree to the <Link href="/terms">terms</Link> and <Link href="/privacy">privacy policy</Link>. Your resume is used only to produce your documents and is never sold or shared.
          </p>
        ) : null}
      </div>
    </div>
  );
}
