import { brand } from "@/lib/content";

export default function Logo({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <span className={className} style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <svg viewBox="0 0 64 64" width="28" height="28" aria-hidden="true" focusable="false">
        <rect width="64" height="64" rx="18" fill={light ? "#fff" : "#0d0d10"} />
        <path d="M18 22h16M18 32h12M18 42h9" stroke={light ? "#0d0d10" : "#fff"} strokeWidth="5" strokeLinecap="round" />
        <path d="m35 41 5 5 9-11" stroke="#8b5cf6" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
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
