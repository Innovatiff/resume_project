import type { CSSProperties } from "react";
import styles from "./Footer.module.css";
import Logo from "./Logo";
import { brand, footer } from "@/lib/content";
import { IconInstagram, IconLinkedIn, IconXSocial } from "./icons";

const socialIcon = {
  instagram: <IconInstagram />,
  x: <IconXSocial />,
  linkedin: <IconLinkedIn />,
};

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className={`panel ${styles.footer}`}>
      <div className={`wrap ${styles.top}`}>
        <div className={styles.brandCol} data-reveal="">
          <Logo />
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
                  <a href={l.href}>{l.label}</a>
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
          © {year} {brand.name}. {brand.region}. All prices CAD.
        </span>
        <a href="#">Privacy</a>
        <a href="#">Terms</a>
        <a href="#guarantee">Refund policy</a>
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
