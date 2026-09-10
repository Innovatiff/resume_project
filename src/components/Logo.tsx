import { useId } from "react";
import { brand } from "@/lib/content";

/**
 * The Orvenic mark: an O that a check breaks through. Ink tile, purple ring,
 * white check; `light` flips it for dark backgrounds.
 */
export function LogoMark({ size = 28, light = false, className }: { size?: number; light?: boolean; className?: string }) {
  const gid = "ov" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const tile = light ? "#fff" : "#0d0d10";
  const ink = light ? "#0d0d10" : "#fff";
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#a98af9" />
          <stop offset="1" stopColor="#7443f0" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill={tile} />
      <circle cx="32" cy="32" r="17" stroke={`url(#${gid})`} strokeWidth="6.5" fill="none" />
      <path d="M30 37.5l9 8.5L56 26" stroke={tile} strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M30 37.5l9 8.5L56 26" stroke={ink} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export default function Logo({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <span className={className} style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <LogoMark light={light} />
      <span
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          letterSpacing: "-0.035em",
          fontSize: "1.2rem",
          lineHeight: 1,
        }}
      >
        {brand.name}
      </span>
    </span>
  );
}
