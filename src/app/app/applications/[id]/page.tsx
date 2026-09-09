import type { Metadata } from "next";
import ApplicationDetail from "@/components/app/ApplicationDetail";

export const metadata: Metadata = { title: "Application" };

export default async function Page(props: PageProps<"/app/applications/[id]">) {
  const { id } = await props.params;
  return <ApplicationDetail id={id} />;
}
