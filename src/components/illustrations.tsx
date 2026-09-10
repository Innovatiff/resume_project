"use client";

import { useId } from "react";

/* ------------------------------------------------------------------
   Illustrations for the hero diagram and the six rules. Each is a
   100 x 100 scene built from layered shapes in the site palette, drawn
   to read at 64 px. Colours are literal so the artwork does not shift
   with the surrounding text colour.
------------------------------------------------------------------- */

const ink = "#0d0d10";
const muted = "#9a9aa6";
const line = "#d8d8e0";
const coral = "#ef4f42";
const purple = "#8b5cf6";
const purpleDeep = "#6d3ff0";
const purpleSoft = "#efe9ff";
const green = "#22b573";
const yellowSoft = "#fff6d1";
const cyanSoft = "#dff7fd";
const coralSoft = "#fdeae7";

type Props = { className?: string };

function Svg({ className, children, title }: Props & { children: React.ReactNode; title?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden={title ? undefined : "true"} role={title ? "img" : undefined} focusable="false">
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

/** Text lines on a document. */
function Lines({ x, y, widths, gap = 7, h = 3.6, color = line }: { x: number; y: number; widths: number[]; gap?: number; h?: number; color?: string }) {
  return (
    <g>
      {widths.map((w, i) => (
        <rect key={i} x={x} y={y + i * gap} width={w} height={h} rx={h / 2} fill={color} />
      ))}
    </g>
  );
}

function Check({ cx, cy, r, fill = green }: { cx: number; cy: number; r: number; fill?: string }) {
  const s = r / 11;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={fill} stroke="#fff" strokeWidth={r * 0.28} />
      <path d={`M${cx - 5 * s} ${cy + 0.5 * s}l${3.6 * s} ${3.6 * s}l${6.8 * s} ${-8 * s}`} stroke="#fff" strokeWidth={2.6 * s} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}

/* ---------- hero ---------- */

/** The candidate: a warm, friendly bust. */
export function IllustCandidate({ className }: Props) {
  return (
    <Svg className={className}>
      <path d="M4 106C4 80 24 68 50 68s46 12 46 38Z" fill="#fff" />
      <path d="M37 69c3.5 6.5 8 9.5 13 9.5s9.5-3 13-9.5c-3.5 2.2-8 3.3-13 3.3s-9.5-1.1-13-3.3Z" fill={coral} />
      <rect x="42.5" y="52" width="15" height="19" rx="6.5" fill="#e39a86" />
      <circle cx="50" cy="40" r="19" fill="#f4b9a4" />
      <path d="M31 41c0-16 8.5-24 19-24s19 8 19 24c-3-9-9.5-13-19-13s-16 4-19 13Z" fill="#3b2b2b" />
      <circle cx="43" cy="42.5" r="2" fill="#2a1d1d" />
      <circle cx="57" cy="42.5" r="2" fill="#2a1d1d" />
      <path d="M44 49.5q6 5 12 0" stroke="#b0604d" strokeWidth="2" fill="none" strokeLinecap="round" />
    </Svg>
  );
}

/** A resume with a highlighted, verified figure. */
export function IllustResume({ className }: Props) {
  return (
    <Svg className={className}>
      <g transform="rotate(-7 50 52)">
        <rect x="21" y="12" width="58" height="78" rx="7" fill="#fff" />
        <rect x="29" y="22" width="26" height="5.5" rx="2.75" fill={ink} />
        <rect x="29" y="31" width="18" height="3.6" rx="1.8" fill={muted} />
        <Lines x={29} y={43} widths={[42, 36]} />
        <rect x="29" y="57" width="20" height="3.6" rx="1.8" fill={line} />
        <rect x="52" y="54.5" width="19" height="8.5" rx="4.25" fill={purpleSoft} />
        <rect x="56" y="57.7" width="11" height="2.2" rx="1.1" fill={purpleDeep} />
        <Lines x={29} y={68} widths={[40, 30]} />
      </g>
      <Check cx={75} cy={79} r={11.5} />
    </Svg>
  );
}

/** A job posting card. */
export function IllustPosting({ className }: Props) {
  return (
    <Svg className={className}>
      <rect x="14" y="20" width="72" height="60" rx="9" fill="#fff" />
      <rect x="22" y="28" width="15" height="15" rx="4.5" fill={ink} />
      <path d="M26.5 35.5h6M29.5 32.5v6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
      <rect x="41" y="29" width="31" height="5.2" rx="2.6" fill={ink} />
      <rect x="41" y="37.5" width="21" height="3.6" rx="1.8" fill={muted} />
      <rect x="22" y="50" width="26" height="9" rx="4.5" fill={cyanSoft} />
      <circle cx="28" cy="54.5" r="2" fill="#1eb9de" />
      <rect x="32" y="53" width="12" height="3" rx="1.5" fill="#1eb9de" />
      <rect x="51" y="50" width="27" height="9" rx="4.5" fill={yellowSoft} />
      <rect x="55" y="53" width="19" height="3" rx="1.5" fill="#c9971a" />
      <Lines x={22} y={66} widths={[56, 40]} gap={6.5} h={3.2} />
    </Svg>
  );
}

/** The verdict: score ring and an apply chip. */
export function IllustVerdict({ className }: Props) {
  return (
    <Svg className={className}>
      <circle cx="50" cy="43" r="26" stroke="rgba(255,255,255,.28)" strokeWidth="7" fill="none" />
      <path d="M50 17A26 26 0 1 1 32.2 24" stroke="#fff" strokeWidth="7" strokeLinecap="round" fill="none" />
      <text x="50" y="52" fontSize="25" fontWeight="700" fill="#fff" textAnchor="middle" fontFamily="var(--font-display), Inter Tight, sans-serif" letterSpacing="-1.2">
        88
      </text>
      <rect x="29" y="77" width="42" height="14" rx="7" fill={green} />
      <text x="50" y="87" fontSize="8.5" fontWeight="600" fill="#fff" textAnchor="middle" fontFamily="var(--font-body), Outfit, sans-serif">
        Apply
      </text>
    </Svg>
  );
}

/** A posting with a flagged line. */
export function IllustFlag({ className }: Props) {
  return (
    <Svg className={className}>
      <rect x="14" y="20" width="72" height="62" rx="9" fill="#fff" />
      <rect x="22" y="29" width="34" height="5" rx="2.5" fill={ink} />
      <rect x="22" y="38" width="48" height="3.6" rx="1.8" fill={line} />
      <rect x="19" y="46.5" width="56" height="12" rx="4.5" fill={coralSoft} />
      <rect x="25" y="50.7" width="32" height="3.6" rx="1.8" fill={coral} />
      <Lines x={22} y={64} widths={[44, 30]} />
      <circle cx="77" cy="26" r="12.5" fill={coral} stroke="#fff" strokeWidth="3" />
      <path d="M72.5 33.5V18.5M72.5 19h9l-2.2 3.6 2.2 3.6h-9" fill="#fff" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
    </Svg>
  );
}

/** The pay band with the settled figure. */
export function IllustPay({ className }: Props) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <Svg className={className}>
      <defs>
        <linearGradient id={`band${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={purpleSoft} />
          <stop offset="1" stopColor={purple} />
        </linearGradient>
      </defs>
      <text x="50" y="42" fontSize="21" fontWeight="700" fill={ink} textAnchor="middle" fontFamily="var(--font-display), Inter Tight, sans-serif" letterSpacing="-1">
        $70K
      </text>
      <rect x="16" y="52" width="68" height="9" rx="4.5" fill={`url(#band${id})`} />
      <rect x="61" y="47" width="3.5" height="19" rx="1.75" fill={ink} />
      <rect x="16" y="69" width="12" height="3.2" rx="1.6" fill={line} />
      <rect x="44" y="69" width="12" height="3.2" rx="1.6" fill={muted} />
      <rect x="72" y="69" width="12" height="3.2" rx="1.6" fill={line} />
    </Svg>
  );
}

/** The recruiter on the other side, with glasses and a yes. */
export function IllustRecruiter({ className }: Props) {
  return (
    <Svg className={className}>
      <path d="M4 106C4 80 24 68 50 68s46 12 46 38Z" fill={ink} />
      <path d="M38 68l12 15 12-15Z" fill="#fff" />
      <path d="M47 68l3 4 3-4-3 14Z" fill={purple} />
      <rect x="42.5" y="52" width="15" height="19" rx="6.5" fill="#d9a583" />
      <circle cx="50" cy="40" r="19" fill="#ecbc99" />
      <path d="M31 40c0-15 8.5-23 19-23s19 8 19 23c-4-7-10-9.5-19-9.5s-15 2.5-19 9.5Z" fill="#5a3b2a" />
      <circle cx="43" cy="43" r="5.4" stroke={ink} strokeWidth="1.9" fill="rgba(255,255,255,.35)" />
      <circle cx="57" cy="43" r="5.4" stroke={ink} strokeWidth="1.9" fill="rgba(255,255,255,.35)" />
      <path d="M48.4 43h3.2" stroke={ink} strokeWidth="1.9" strokeLinecap="round" />
      <circle cx="43" cy="43" r="1.8" fill="#2a1d1d" />
      <circle cx="57" cy="43" r="1.8" fill="#2a1d1d" />
      <path d="M45 50.5q5 3.5 10 0" stroke="#a8674a" strokeWidth="1.9" fill="none" strokeLinecap="round" />
      <Check cx={79} cy={23} r={11.5} />
    </Svg>
  );
}

/* ---------- the six rules ---------- */

/** Never fabricate: a figure on the page, verified. */
export function IllustRuleFabricate({ className }: Props) {
  return (
    <Svg className={className}>
      <rect x="22" y="12" width="50" height="66" rx="6.5" fill="#fff" stroke={line} />
      <rect x="30" y="21" width="22" height="5" rx="2.5" fill={ink} />
      <Lines x={30} y={31} widths={[34, 28]} />
      <rect x="30" y="45" width="16" height="3.6" rx="1.8" fill={line} />
      <rect x="48" y="42.5" width="17" height="8.5" rx="4.25" fill={purpleSoft} />
      <rect x="51.5" y="45.7" width="10" height="2.2" rx="1.1" fill={purpleDeep} />
      <Lines x={30} y={56} widths={[30, 22]} />
      <path d="M71 55l16 5.5v11c0 10-7 16.5-16 19.5-9-3-16-9.5-16-19.5v-11Z" fill={coral} stroke="#fff" strokeWidth="3" />
      <path d="M64.5 72l4.5 4.5 9-10" stroke="#fff" strokeWidth="3.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Never guess at pay: a band from market data, no estimate. */
export function IllustRulePay({ className }: Props) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <Svg className={className}>
      <defs>
        <linearGradient id={`rb${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={purpleSoft} />
          <stop offset="1" stopColor={purple} />
        </linearGradient>
      </defs>
      <rect x="12" y="20" width="76" height="60" rx="9" fill="#fff" stroke={line} />
      <rect x="20" y="29" width="24" height="5" rx="2.5" fill={ink} />
      <rect x="20" y="43" width="60" height="9" rx="4.5" fill={`url(#rb${id})`} />
      <rect x="57" y="38.5" width="3.5" height="18" rx="1.75" fill={ink} />
      <rect x="20" y="60" width="10" height="3" rx="1.5" fill={line} />
      <rect x="45" y="60" width="10" height="3" rx="1.5" fill={muted} />
      <rect x="70" y="60" width="10" height="3" rx="1.5" fill={line} />
      <g transform="translate(63 10) scale(0.82)">
        <ellipse cx="14" cy="6" rx="12" ry="4.5" fill={coral} />
        <path d="M2 6v9c0 2.5 5.4 4.5 12 4.5s12-2 12-4.5V6c0 2.5-5.4 4.5-12 4.5S2 8.5 2 6Z" fill={coral} />
        <path d="M2 14v8c0 2.5 5.4 4.5 12 4.5s12-2 12-4.5v-8" fill="#d9432f" />
        <circle cx="26" cy="24" r="6.5" fill={green} stroke="#fff" strokeWidth="2" />
        <path d="M23 24l2.2 2.2 4-4.6" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </Svg>
  );
}

/** Never block: an open door and the way through. */
export function IllustRuleBlock({ className }: Props) {
  return (
    <Svg className={className}>
      <path d="M52 84L92 96V20L52 30Z" fill={purpleSoft} opacity=".9" />
      <rect x="30" y="14" width="34" height="70" rx="3" fill="#fff" stroke={ink} strokeWidth="2.5" />
      <path d="M34 18h26v62H34Z" fill={purpleSoft} />
      <path d="M60 18l-24 6v58l24-6Z" fill={purple} />
      <path d="M60 18l-24 6" stroke={purpleDeep} strokeWidth="1.5" />
      <circle cx="40" cy="52" r="2.3" fill="#fff" />
      <path d="M8 60h30" stroke={ink} strokeWidth="3.5" strokeLinecap="round" />
      <path d="M31 52l8 8-8 8" stroke={ink} strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Never submit on your behalf: you press the button. */
export function IllustRuleSubmit({ className }: Props) {
  return (
    <Svg className={className}>
      <rect x="12" y="18" width="76" height="64" rx="9" fill="#fff" stroke={line} />
      <rect x="20" y="28" width="30" height="5" rx="2.5" fill={ink} />
      <rect x="20" y="38" width="44" height="3.6" rx="1.8" fill={line} />
      <rect x="20" y="49" width="9" height="9" rx="2.5" fill="#fff" stroke={coral} strokeWidth="2.2" />
      <rect x="33" y="51.5" width="30" height="3.6" rx="1.8" fill={coral} />
      <rect x="20" y="66" width="38" height="12" rx="6" fill={ink} />
      <rect x="28" y="70.7" width="22" height="2.6" rx="1.3" fill="#fff" />
      <path d="M58 60l3 22 5.5-6 6 8 4-3-6-8h8Z" fill="#fff" stroke={ink} strokeWidth="2.2" strokeLinejoin="round" />
    </Svg>
  );
}

/** Never auto-renew: one card, one payment, no cycle. */
export function IllustRuleRenew({ className }: Props) {
  return (
    <Svg className={className}>
      <rect x="12" y="26" width="76" height="48" rx="8" fill="#fff" stroke={line} />
      <rect x="12" y="36" width="76" height="9" fill={ink} />
      <rect x="20" y="53" width="26" height="4" rx="2" fill={muted} />
      <rect x="20" y="61" width="16" height="4" rx="2" fill={line} />
      <rect x="66" y="52" width="14" height="10" rx="3" fill={yellowSoft} stroke="#e6c14a" />
      <g transform="translate(60 8)">
        <circle cx="16" cy="16" r="15" fill="#fff" stroke={coral} strokeWidth="3" />
        <path d="M22.5 11.5a7.5 7.5 0 1 0 1.5 7" stroke={muted} strokeWidth="2.6" fill="none" strokeLinecap="round" />
        <path d="M23 8v5h-5" stroke={muted} strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6 26L26 6" stroke={coral} strokeWidth="3" strokeLinecap="round" />
      </g>
    </Svg>
  );
}

/** Never promise a job: the score is guaranteed, the offer is not ours to give. */
export function IllustRulePromise({ className }: Props) {
  return (
    <Svg className={className}>
      <rect x="40" y="14" width="46" height="60" rx="6.5" fill="#fff" stroke={line} strokeDasharray="4 3" />
      <Lines x={48} y={24} widths={[26, 30, 22, 30]} color="#e6e6ec" />
      <path d="M24 62l7 26 7-8 7 8 7-26Z" fill={purpleDeep} />
      <circle cx="38" cy="50" r="22" fill={purple} stroke="#fff" strokeWidth="3.5" />
      <circle cx="38" cy="50" r="15.5" fill="none" stroke="rgba(255,255,255,.45)" strokeWidth="2" />
      <text x="38" y="56" fontSize="16" fontWeight="700" fill="#fff" textAnchor="middle" fontFamily="var(--font-display), Inter Tight, sans-serif" letterSpacing="-0.8">
        85
      </text>
    </Svg>
  );
}

/* ---------- bento ---------- */

/** Just the candidate's face, for avatars. */
export function IllustFace({ className }: Props) {
  return (
    <Svg className={className}>
      <circle cx="50" cy="52" r="30" fill="#f4b9a4" />
      <path d="M20 54c0-25 13.5-38 30-38s30 13 30 38c-4.5-14-15-20-30-20s-25.5 6-30 20Z" fill="#3b2b2b" />
      <circle cx="39" cy="56" r="3" fill="#2a1d1d" />
      <circle cx="61" cy="56" r="3" fill="#2a1d1d" />
      <path d="M41 67q9 7 18 0" stroke="#b0604d" strokeWidth="3" fill="none" strokeLinecap="round" />
    </Svg>
  );
}

/** A small score ring, ink on white. */
export function IllustRing({ className, value = 88 }: Props & { value?: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <Svg className={className}>
      <circle cx="50" cy="50" r={r} stroke="#ececf1" strokeWidth="9" fill="none" />
      <circle cx="50" cy="50" r={r} stroke={purple} strokeWidth="9" fill="none" strokeLinecap="round" strokeDasharray={`${(c * value) / 100} ${c}`} transform="rotate(-90 50 50)" />
      <text x="50" y="58" fontSize="24" fontWeight="700" fill={ink} textAnchor="middle" fontFamily="var(--font-display), Inter Tight, sans-serif" letterSpacing="-1">
        {value}
      </text>
    </Svg>
  );
}

/** A city at dusk: pay in your city. */
export function IllustSkyline({ className }: Props) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const towers: [number, number, number][] = [
    [6, 62, 22],
    [32, 40, 18],
    [54, 78, 26],
    [84, 30, 16],
    [104, 58, 30],
    [138, 46, 20],
    [162, 84, 24],
    [190, 36, 14],
    [208, 64, 28],
    [240, 50, 18],
    [262, 90, 22],
    [288, 42, 26],
    [318, 70, 20],
    [342, 56, 30],
    [376, 78, 18],
  ];
  return (
    <svg viewBox="0 0 400 140" className={className} aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMax slice">
      <defs>
        <linearGradient id={`sky${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#efe9ff" stopOpacity="0" />
          <stop offset="1" stopColor="#efe9ff" />
        </linearGradient>
        <linearGradient id={`tw${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d9ccff" />
          <stop offset="1" stopColor="#c3b1fb" />
        </linearGradient>
      </defs>
      <rect width="400" height="140" fill={`url(#sky${id})`} />
      <circle cx="318" cy="46" r="18" fill="#ffe28a" opacity=".9" />
      <path d="M0 132c60-42 120-42 200-42s140 0 200 42" stroke="#b9a4ff" strokeWidth="2" fill="none" opacity=".7" />
      <path d="M96 132V78M304 132V78" stroke="#b9a4ff" strokeWidth="3" strokeLinecap="round" opacity=".8" />
      {towers.map(([x, h, w], i) => (
        <g key={i}>
          <rect x={x} y={140 - h} width={w} height={h} rx="2" fill={`url(#tw${id})`} />
          {Array.from({ length: Math.max(1, Math.floor(h / 14)) }).map((_, j) => (
            <rect key={j} x={x + 4} y={140 - h + 6 + j * 14} width={w - 8} height="4" rx="1" fill="#fff" opacity=".55" />
          ))}
        </g>
      ))}
      <rect x="0" y="132" width="400" height="8" fill="#c9b9ff" />
    </svg>
  );
}

/** A magnifying glass with a purple rim. */
export function IllustMagnifier({ className }: Props) {
  return (
    <Svg className={className}>
      <path d="M62 62l24 24" stroke={ink} strokeWidth="13" strokeLinecap="round" />
      <path d="M62 62l24 24" stroke={purple} strokeWidth="7" strokeLinecap="round" />
      <circle cx="40" cy="40" r="30" fill="rgba(255,255,255,.55)" stroke={ink} strokeWidth="7" />
      <circle cx="40" cy="40" r="30" fill="none" stroke="rgba(255,255,255,.7)" strokeWidth="2" />
      <path d="M24 30c3-7 9-11 15-12" stroke="#fff" strokeWidth="4" strokeLinecap="round" fill="none" opacity=".9" />
      <rect x="27" y="36" width="26" height="8" rx="4" fill={coral} />
    </Svg>
  );
}

/** A street map with three pins: better roles nearby. */
export function IllustMap({ className }: Props) {
  return (
    <Svg className={className}>
      <rect width="100" height="100" fill="#f4f4f7" />
      <path d="M0 62c20-8 40-8 60 0s30 14 40 10v28H0Z" fill={cyanSoft} />
      <circle cx="22" cy="24" r="14" fill="#dff5e8" />
      <path d="M0 40h100M0 76h100M34 0v100M68 0v100" stroke="#fff" strokeWidth="7" />
      <path d="M0 40h100M0 76h100M34 0v100M68 0v100" stroke="#e2e2e9" strokeWidth="1.5" />
      <path d="M8 0c10 30 20 40 60 100" stroke="#fff" strokeWidth="5" fill="none" />
      <path d="M8 0c10 30 20 40 60 100" stroke="#e2e2e9" strokeWidth="1.2" fill="none" />
      <g>
        <ellipse cx="50" cy="60" rx="9" ry="3.5" fill="rgba(13,13,16,.15)" />
        <path d="M50 58c-8-9-12-15-12-21a12 12 0 0 1 24 0c0 6-4 12-12 21Z" fill={coral} />
        <circle cx="50" cy="37" r="5" fill="#fff" />
      </g>
      <g>
        <ellipse cx="80" cy="34" rx="7" ry="2.8" fill="rgba(13,13,16,.12)" />
        <path d="M80 32.5c-6.5-7.5-9.5-12-9.5-17a9.5 9.5 0 0 1 19 0c0 5-3 9.5-9.5 17Z" fill={purple} />
        <circle cx="80" cy="15.5" r="4" fill="#fff" />
      </g>
      <g>
        <ellipse cx="24" cy="88" rx="7" ry="2.8" fill="rgba(13,13,16,.12)" />
        <path d="M24 86.5c-6.5-7.5-9.5-12-9.5-17a9.5 9.5 0 0 1 19 0c0 5-3 9.5-9.5 17Z" fill="#f6c52e" />
        <circle cx="24" cy="69.5" r="4" fill="#fff" />
      </g>
    </Svg>
  );
}
