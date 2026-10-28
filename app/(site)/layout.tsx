import type { ReactNode } from "react";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ViewTracker from "@/components/ViewTracker";
import { siteFonts } from "@/lib/fonts";

// Content comes from the database at request time (as with the old getServerSideProps).
export const dynamic = "force-dynamic";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`${siteFonts} flex min-h-screen flex-col text-gray-900`}>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <ViewTracker />
    </div>
  );
}
