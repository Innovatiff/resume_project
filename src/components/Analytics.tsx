"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { analytics, analyticsEnabled, trackPageView } from "@/lib/firebase/analytics";

/** Mounts Google Analytics in production and reports client-side navigations. Renders nothing. */
export default function Analytics() {
  const pathname = usePathname();
  const first = useRef(true);

  useEffect(() => {
    if (!analyticsEnabled) return;
    if (first.current) {
      first.current = false;
      void analytics();
      return;
    }
    trackPageView(pathname);
  }, [pathname]);

  return null;
}
