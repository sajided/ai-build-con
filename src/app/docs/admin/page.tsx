import type { Metadata } from "next";
import DocsAdmin from "@/components/docs/DocsAdmin";

export const metadata: Metadata = {
  title: "Jotno docs: admin",
  robots: { index: false, follow: false },
};

export default function DocsAdminPage() {
  return <DocsAdmin />;
}
