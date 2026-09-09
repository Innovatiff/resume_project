"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import { useAuth, hardNavigate } from "@/lib/app/auth-client";
import { MeProvider, useMe } from "@/lib/app/use-me";
import { PRODUCTS } from "@/lib/billing/plans";
import { IconBriefcase, IconCompass, IconDoc, IconDoorOpen, IconPlus, IconTarget } from "@/components/icons";
import { Skeleton } from "./ui";

const NAV = [
  { href: "/app", label: "Dashboard", icon: <IconCompass />, exact: true },
  { href: "/app/applications", label: "Applications", icon: <IconBriefcase /> },
  { href: "/app/profile", label: "Resume profile", icon: <IconDoc /> },
  { href: "/app/account", label: "Account", icon: <IconTarget /> },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function PlanBadge() {
  const { me, loading } = useMe();
  if (loading) return <Skeleton h={56} />;
  const e = me?.entitlement;
  if (!e?.plan) {
    return (
      <div className="app-plan">
        <b>No active package</b>
        <span>Free scan only</span>
        <Link href="/checkout?plan=pass">Choose a package</Link>
      </div>
    );
  }
  const name = PRODUCTS[e.plan].name;
  return (
    <div className="app-plan">
      <b>{name}</b>
      <span>{e.endsAt ? `${e.daysLeft} day${e.daysLeft === 1 ? "" : "s"} left` : e.canBuild ? "One package available" : "Used"}</span>
      <Link href="/app/account">Manage</Link>
    </div>
  );
}

function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const initials = (user?.displayName || user?.email || "?").slice(0, 1).toUpperCase();

  return (
    <div className="app-shell">
      <aside className="app-side" aria-label="App navigation">
        <Link href="/" className="app-side__brand" aria-label="Shortlist home">
          <Logo />
        </Link>
        <nav className="app-nav">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} aria-current={isActive(pathname, n.href, n.exact) ? "page" : undefined}>
              {n.icon}
              {n.label}
            </Link>
          ))}
          <Link className="btn btn--coral app-nav__cta" href="/app/applications/new">
            <IconPlus /> New application
          </Link>
        </nav>
        <div className="app-side__foot">
          <PlanBadge />
          <div className="app-user">
            <span className="app-avatar" aria-hidden="true">
              {initials}
            </span>
            <span className="app-user__meta">
              <b>{user?.displayName || "Your account"}</b>
              <span>{user?.email}</span>
            </span>
            <button type="button" className="app-iconbtn" aria-label="Sign out" title="Sign out" onClick={() => void signOut().then(() => hardNavigate("/"))}>
              <IconDoorOpen />
            </button>
          </div>
        </div>
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <Link href="/app" className="app-topbar__brand" aria-label="Dashboard">
            <Logo />
          </Link>
          <Link href="/app/account" className="app-avatar" aria-label="Account">
            {initials}
          </Link>
        </header>
        <main className="app-content">{children}</main>
      </div>

      <nav className="app-tabs" aria-label="App sections">
        <Link href="/app" aria-current={isActive(pathname, "/app", true) ? "page" : undefined}>
          <IconCompass /> Home
        </Link>
        <Link href="/app/applications" aria-current={isActive(pathname, "/app/applications") && pathname !== "/app/applications/new" ? "page" : undefined}>
          <IconBriefcase /> Applications
        </Link>
        <Link href="/app/applications/new" className="app-tabs__new" aria-label="New application">
          <span>
            <IconPlus />
          </span>
          New
        </Link>
        <Link href="/app/profile" aria-current={isActive(pathname, "/app/profile") ? "page" : undefined}>
          <IconDoc /> Resume
        </Link>
        <Link href="/app/account" aria-current={isActive(pathname, "/app/account") ? "page" : undefined}>
          <IconTarget /> Account
        </Link>
      </nav>
    </div>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  const { user, loading, configured } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace(`/sign-in?next=${encodeURIComponent(pathname)}`);
  }, [loading, user, router, pathname]);

  if (!configured) {
    return (
      <div className="wrap" style={{ paddingTop: 120 }}>
        <div className="app-notice" data-kind="error">
          Firebase is not configured. Set the NEXT_PUBLIC_FIREBASE_* variables (see .env.example) or run the emulators with NEXT_PUBLIC_FIREBASE_USE_EMULATOR=1.
        </div>
      </div>
    );
  }

  if (loading || !user) {
    return (
      <div className="app-shell">
        <div className="app-side" style={{ gap: 12 }}>
          <Skeleton h={28} w="60%" />
          <Skeleton h={40} />
          <Skeleton h={40} />
          <Skeleton h={40} />
        </div>
        <div className="app-main">
          <div className="app-content">
            <Skeleton h={36} w="40%" />
            <Skeleton h={160} />
            <Skeleton h={120} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <MeProvider>
      <Shell>{children}</Shell>
    </MeProvider>
  );
}
