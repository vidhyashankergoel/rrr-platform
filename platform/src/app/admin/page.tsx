import type { Metadata } from "next";
import AdminConsole from "@/components/AdminConsole";

export const metadata: Metadata = {
  title: "Console",
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminPage() {
  return <AdminConsole />;
}
