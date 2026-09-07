"use client";

import { useCallback, useEffect, useState } from "react";
import type { MouseEvent } from "react";
import styles from "./Navbar.module.css";
import Logo from "./Logo";
import { nav, brand } from "@/lib/content";
import { getLenis, scrollToHash } from "@/lib/lenis-store";
import { IconArrowRight, IconMenu, IconX } from "./icons";

export default function Navbar() {
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

  const go = useCallback((e: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!href.startsWith("#")) return;
    e.preventDefault();
    setOpen(false);
    if (href === "#top") {
      const lenis = getLenis();
      if (lenis) lenis.scrollTo(0, { duration: 1.2 });
      else window.scrollTo({ top: 0, behavior: "smooth" });
      history.replaceState(null, "", " ");
      return;
    }
    // Let the overlay start closing before the page moves.
    window.setTimeout(() => scrollToHash(href), open ? 120 : 0);
    history.replaceState(null, "", href);
  }, [open]);

  return (
    <header className={styles.header}>
      <nav className={`${styles.bar} ${scrolled ? styles.scrolled : ""}`} aria-label="Primary">
        <a href="#top" className={styles.brand} onClick={(e) => go(e, "#top")} aria-label={`${brand.name} home`}>
          <Logo />
        </a>

        <ul className={styles.links}>
          {nav.links.map((l) => (
            <li key={l.href}>
              <a href={l.href} onClick={(e) => go(e, l.href)}>
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className={styles.actions}>
          <a className={`btn btn--ghost btn--sm ${styles.signIn}`} href={nav.signIn.href}>
            {nav.signIn.label}
          </a>
          <a className="btn btn--ink btn--sm" href={nav.cta.href} onClick={(e) => go(e, nav.cta.href)}>
            {nav.cta.label}
          </a>
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
            {nav.links.map((l) => (
              <li key={l.href}>
                <a href={l.href} onClick={(e) => go(e, l.href)} tabIndex={open ? 0 : -1}>
                  {l.label}
                  <IconArrowRight />
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className={styles.overlayFoot}>
          <a className="btn btn--coral btn--lg btn--block" href={nav.cta.href} onClick={(e) => go(e, nav.cta.href)} tabIndex={open ? 0 : -1}>
            Scan my resume free
          </a>
          <a className="btn btn--white btn--block" href={nav.signIn.href} tabIndex={open ? 0 : -1}>
            {nav.signIn.label}
          </a>
          <p className={styles.overlayMeta}>
            {brand.region} · No subscription, no auto-renew
          </p>
        </div>
      </div>
    </header>
  );
}
