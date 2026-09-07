import type Lenis from "lenis";

/* Module-level handle so any client component (navbar, carousels)
   can pause, resume or scroll the smooth-scroll instance. */

let instance: Lenis | null = null;

export function setLenis(lenis: Lenis | null) {
  instance = lenis;
}

export function getLenis(): Lenis | null {
  return instance;
}

export const NAV_OFFSET = -96;

/** Scroll to a hash target, via Lenis when available, natively otherwise. */
export function scrollToHash(hash: string) {
  if (!hash.startsWith("#") || hash.length < 2) return;
  const el = document.querySelector<HTMLElement>(hash);
  if (!el) return;
  const lenis = getLenis();
  if (lenis) {
    lenis.scrollTo(el, { offset: NAV_OFFSET, duration: 1.4 });
  } else {
    const top = el.getBoundingClientRect().top + window.scrollY + NAV_OFFSET;
    window.scrollTo({ top, behavior: "smooth" });
  }
}
