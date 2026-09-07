import type { SVGProps } from "react";

/* Inline icon set: 24x24 grid, 1.8 stroke, round caps. */

type P = SVGProps<SVGSVGElement>;

function Svg({ children, ...rest }: P) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const IconCheck = (p: P) => (
  <Svg {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Svg>
);

export const IconCheckCircle = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m8.5 12.2 2.4 2.4 4.8-5" />
  </Svg>
);

export const IconDoc = (p: P) => (
  <Svg {...p}>
    <path d="M7 3.5h7l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-9.5A1.5 1.5 0 0 1 5.5 19V5A1.5 1.5 0 0 1 7 3.5Z" />
    <path d="M14 3.5V8h4M8.5 12h7M8.5 15.5h5" />
  </Svg>
);

export const IconBriefcase = (p: P) => (
  <Svg {...p}>
    <rect x="3.5" y="7.5" width="17" height="12" rx="2.5" />
    <path d="M8.5 7.5V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v1.5M3.5 12.5h17" />
  </Svg>
);

export const IconDollar = (p: P) => (
  <Svg {...p}>
    <path d="M12 3.5v17M16 7.5c0-1.4-1.6-2.5-4-2.5s-4 1.1-4 2.5c0 3.5 8 1.5 8 5.5 0 1.4-1.6 2.5-4 2.5s-4-1.1-4-2.5" />
  </Svg>
);

export const IconFlag = (p: P) => (
  <Svg {...p}>
    <path d="M5.5 21V4.5M5.5 5h11.2l-1.6 3.5 1.6 3.5H5.5" />
  </Svg>
);

export const IconShield = (p: P) => (
  <Svg {...p}>
    <path d="M12 3.5 5 6.2v5.3c0 4.2 2.9 7.6 7 9 4.1-1.4 7-4.8 7-9V6.2L12 3.5Z" />
    <path d="M12.8 8.5 10.2 12.6h3.3l-1.5 3" />
  </Svg>
);

export const IconEyes = (p: P) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...p}>
    <ellipse cx="7.6" cy="12" rx="4.3" ry="5.6" fill="#fff" stroke="#111" strokeWidth="1.5" />
    <ellipse cx="16.4" cy="12" rx="4.3" ry="5.6" fill="#fff" stroke="#111" strokeWidth="1.5" />
    <circle cx="8.6" cy="13.2" r="1.9" fill="#111" />
    <circle cx="17.4" cy="13.2" r="1.9" fill="#111" />
  </svg>
);

export const IconSparkle = (p: P) => (
  <Svg {...p}>
    <path d="M12 3.5c.6 4.6 2.6 6.9 8.5 8.5-5.9 1.6-7.9 3.9-8.5 8.5-.6-4.6-2.6-6.9-8.5-8.5 5.9-1.6 7.9-3.9 8.5-8.5Z" />
  </Svg>
);

export const IconBulb = (p: P) => (
  <Svg {...p}>
    <path d="M9 18.5h6M10 21h4M8 13.6A5.5 5.5 0 1 1 16 13.6c-.9.9-1.5 1.7-1.5 2.9h-5c0-1.2-.6-2-1.5-2.9Z" />
  </Svg>
);

export const IconCompass = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m15.5 8.5-2.2 5.2-4.8 1.8 2.2-5.2 4.8-1.8Z" />
  </Svg>
);

export const IconChat = (p: P) => (
  <Svg {...p}>
    <path d="M4.5 6.5A2.5 2.5 0 0 1 7 4h10a2.5 2.5 0 0 1 2.5 2.5v7A2.5 2.5 0 0 1 17 16h-6.2L7 19.2V16A2.5 2.5 0 0 1 4.5 13.5v-7Z" />
    <path d="M8.5 9h7M8.5 12h4" />
  </Svg>
);

export const IconHand = (p: P) => (
  <Svg {...p}>
    <path d="M8 12.5V6a1.5 1.5 0 0 1 3 0v5.5M11 11V4.5a1.5 1.5 0 0 1 3 0V11M14 11V6a1.5 1.5 0 0 1 3 0v8.5a5.5 5.5 0 0 1-5.5 5.5H11a5 5 0 0 1-4.2-2.3L4 13.3a1.4 1.4 0 0 1 2.3-1.6L8 13.5" />
  </Svg>
);

export const IconDoorOpen = (p: P) => (
  <Svg {...p}>
    <path d="M4.5 20.5h15M6.5 20.5V4.5h8v16M14.5 6.5l4 1.3v12.7M11 12.5h.01" />
  </Svg>
);

export const IconCardOff = (p: P) => (
  <Svg {...p}>
    <rect x="3.5" y="6" width="17" height="12" rx="2.5" />
    <path d="M3.5 10.5h17M7 14.5h3" />
    <path d="m4 3.5 16 17" />
  </Svg>
);

export const IconHandshake = (p: P) => (
  <Svg {...p}>
    <path d="m4.5 9 3.5-3 4 1.5 4-1.5 3.5 3v6l-4 4-2.5-2M8 6l-3.5 3M16 6l3.5 3" />
    <path d="m8.5 11.5 3 3 2-2 2 2M4.5 15l4 4 2-2" />
  </Svg>
);

export const IconBan = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m6 6 12 12" />
  </Svg>
);

export const IconTarget = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="4.5" />
    <circle cx="12" cy="12" r="1" fill="currentColor" />
  </Svg>
);

export const IconClock = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Svg>
);

export const IconArrowRight = (p: P) => (
  <Svg {...p}>
    <path d="M4.5 12h15M13.5 6l6 6-6 6" />
  </Svg>
);

export const IconArrowLeft = (p: P) => (
  <Svg {...p}>
    <path d="M19.5 12h-15M10.5 6l-6 6 6 6" />
  </Svg>
);

export const IconChevronRight = (p: P) => (
  <Svg {...p}>
    <path d="m9 6 6 6-6 6" />
  </Svg>
);

export const IconChevronLeft = (p: P) => (
  <Svg {...p}>
    <path d="m15 6-6 6 6 6" />
  </Svg>
);

export const IconChevronDown = (p: P) => (
  <Svg {...p}>
    <path d="m6 9 6 6 6-6" />
  </Svg>
);

export const IconPlus = (p: P) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

export const IconMenu = (p: P) => (
  <Svg {...p}>
    <path d="M4 7.5h16M4 12h16M4 16.5h16" />
  </Svg>
);

export const IconX = (p: P) => (
  <Svg {...p}>
    <path d="m6 6 12 12M18 6 6 18" />
  </Svg>
);

export const IconUpload = (p: P) => (
  <Svg {...p}>
    <path d="M12 16V5M7.5 9.5 12 5l4.5 4.5M4.5 16.5v1.5A2 2 0 0 0 6.5 20h11a2 2 0 0 0 2-2v-1.5" />
  </Svg>
);

export const IconMail = (p: P) => (
  <Svg {...p}>
    <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" />
    <path d="m4.5 7.5 7.5 5.5 7.5-5.5" />
  </Svg>
);

export const IconStar = (p: P) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="currentColor" {...p}>
    <path d="m12 3.2 2.7 5.6 6.1.8-4.5 4.2 1.2 6L12 16.9l-5.5 2.9 1.2-6-4.5-4.2 6.1-.8L12 3.2Z" />
  </svg>
);

export const IconTranslate = (p: P) => (
  <Svg {...p}>
    <path d="M4 5.5h9M8.5 3.5v2M6 8.5c1.2 3 3.2 5 6 6.5M11 8.5c-1 3.5-3.2 6.2-6.5 8M13 20.5l4-9 4 9M14.4 17.5h5.2" />
  </Svg>
);

export const IconLock = (p: P) => (
  <Svg {...p}>
    <rect x="5.5" y="10.5" width="13" height="10" rx="2.5" />
    <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5M12 14.5v2" />
  </Svg>
);

export const IconInstagram = (p: P) => (
  <Svg {...p}>
    <rect x="4" y="4" width="16" height="16" rx="4.5" />
    <circle cx="12" cy="12" r="3.6" />
    <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
  </Svg>
);

export const IconXSocial = (p: P) => (
  <Svg {...p}>
    <path d="m5 4 14 16M19 4 5 20" />
  </Svg>
);

export const IconLinkedIn = (p: P) => (
  <Svg {...p}>
    <rect x="4" y="4" width="16" height="16" rx="3" />
    <path d="M8 10.5V17M8 7.8v.2M11.5 17v-6.5M11.5 13.5c0-2 1.2-3 2.8-3s2.2 1 2.2 3V17" />
  </Svg>
);

export const IconMapPin = (p: P) => (
  <Svg {...p}>
    <path d="M12 21s6.5-5.6 6.5-11a6.5 6.5 0 1 0-13 0c0 5.4 6.5 11 6.5 11Z" />
    <circle cx="12" cy="10" r="2.3" />
  </Svg>
);

export const IconFile = (p: P) => (
  <Svg {...p}>
    <path d="M7 3.5h7l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-9.5A1.5 1.5 0 0 1 5.5 19V5A1.5 1.5 0 0 1 7 3.5Z" />
    <path d="M14 3.5V8h4" />
  </Svg>
);

export const IconTrash = (p: P) => (
  <Svg {...p}>
    <path d="M5 7h14M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M7 7l.8 12a1.5 1.5 0 0 0 1.5 1.4h5.4a1.5 1.5 0 0 0 1.5-1.4L17 7" />
  </Svg>
);

export const IconBolt = (p: P) => (
  <Svg {...p}>
    <path d="M13 3.5 5.5 13.5H12l-1 7 7.5-10H12l1-7Z" />
  </Svg>
);
