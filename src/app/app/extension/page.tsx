import type { Metadata } from "next";
import ExtensionPanel from "@/components/app/ExtensionPanel";

export const metadata: Metadata = { title: "Browser extension" };

export default function Page() {
  return <ExtensionPanel />;
}
