"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Navbar.module.css";
import Logo from "./Logo";
import { nav, brand } from "@/lib/content";
import { getLenis } from "@/lib/lenis-store";
import { IconArrowRight, IconMenu, IconX } from "./icons";

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const lenis = getLenis();
    if (open) {
      lenis?.stop();
      document.body.style.overflow = "hidden";
    } else {
      lenis?.start();
      document.body.style.overflow = "";
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className={styles.header}>
      <nav className={`${styles.bar} ${scrolled ? styles.scrolled : ""}`} aria-label="Primary">
        <Link href="/" className={styles.brand} aria-label={`${brand.name} home`} onClick={() => setOpen(false)}>
          <Logo />
        </Link>

        <ul className={styles.links}>
          {nav.links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} aria-current={isActive(l.href) ? "page" : undefined}>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className={styles.actions}>
          <Link className={`btn btn--ghost btn--sm ${styles.secondary}`} href={nav.secondary.href}>
            {nav.secondary.label}
          </Link>
          <Link className="btn btn--ink btn--sm" href={nav.cta.href} onClick={() => setOpen(false)}>
            {nav.cta.label}
          </Link>
          <button
            type="button"
            className={styles.burger}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <IconX /> : <IconMenu />}
          </button>
        </div>
      </nav>

      <div id="mobile-menu" className={styles.overlay} data-open={open} aria-hidden={!open}>
        <nav aria-label="Mobile">
          <ul className={styles.overlayLinks}>
            {[...nav.links, nav.secondary].map((l) => (
              <li key={l.href}>
                <Link href={l.href} tabIndex={open ? 0 : -1} aria-current={isActive(l.href) ? "page" : undefined} onClick={() => setOpen(false)}>
                  {l.label}
                  <IconArrowRight />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className={styles.overlayFoot}>
          <Link className="btn btn--coral btn--lg btn--block" href={nav.cta.href} tabIndex={open ? 0 : -1} onClick={() => setOpen(false)}>
            Scan my resume free
          </Link>
          <p className={styles.overlayMeta}>
            {brand.region} · No subscription, no auto-renew
          </p>
        </div>
      </div>
    </header>
  );
}
