import type { ReactNode } from "react";
import Header from "@/components/Header";

// Content comes from the database at request time (as with the old getServerSideProps).
export const dynamic = "force-dynamic";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      {children}
    </>
  );
}
