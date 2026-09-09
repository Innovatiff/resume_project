import type { CSSProperties } from "react";
import Link from "next/link";
import styles from "./Footer.module.css";
import Logo from "./Logo";
import { brand, footer } from "@/lib/content";
import { IconInstagram, IconLinkedIn, IconXSocial } from "./icons";

const socialIcon = {
  instagram: <IconInstagram />,
  x: <IconXSocial />,
  linkedin: <IconLinkedIn />,
};

function Smart({ href, children, ...rest }: { href: string; children: React.ReactNode; [k: string]: unknown }) {
  if (href.startsWith("/")) {
    return (
      <Link href={href} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} {...rest}>
      {children}
    </a>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className={`panel ${styles.footer}`}>
      <div className={`wrap ${styles.top}`}>
        <div className={styles.brandCol} data-reveal="">
          <Link href="/" aria-label={`${brand.name} home`}>
            <Logo />
          </Link>
          <p>{brand.blurb}</p>
          <small>
            {brand.region} · <a href={`mailto:${brand.email}`}>{brand.email}</a>
          </small>
        </div>

        {footer.columns.map((c) => (
          <nav key={c.title} className={styles.col} aria-label={c.title} data-reveal="">
            <h4>{c.title}</h4>
            <ul>
              {c.links.map((l) => (
                <li key={l.label}>
                  <Smart href={l.href}>{l.label}</Smart>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div className={styles.follow} data-reveal="">
          <h4>Follow us</h4>
          <div className={styles.social}>
            {footer.social.map((s) => (
              <a key={s.label} href={s.href} aria-label={s.label}>
                {socialIcon[s.icon]}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className={`wrap ${styles.legal}`}>
        <span>
          © {year} {brand.name}. {brand.region}. Prices in CAD and USD.
        </span>
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
        <Link href="/refunds">Refund policy</Link>
      </div>

      <div className={styles.wordmark} aria-hidden="true" data-reveal="">
        {brand.name.split("").map((ch, i) => (
          <span key={i} className={styles.letter} style={{ "--i": i } as CSSProperties}>
            {ch}
          </span>
        ))}
      </div>
    </footer>
  );
}
