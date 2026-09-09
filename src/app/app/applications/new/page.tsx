import type { Metadata } from "next";
import NewApplicationForm from "@/components/app/NewApplicationForm";

export const metadata: Metadata = { title: "New application" };

export default function Page() {
  return <NewApplicationForm />;
}
