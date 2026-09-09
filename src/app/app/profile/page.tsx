import type { Metadata } from "next";
import ProfilePanel from "@/components/app/ProfilePanel";

export const metadata: Metadata = { title: "Resume profile" };

export default function Page() {
  return <ProfilePanel />;
}
