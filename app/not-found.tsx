import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import { siteFonts } from "@/lib/fonts";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div className={siteFonts}>
      <Header />
      <div className="container mx-auto flex min-h-[50vh] items-center justify-center px-3 text-center">
        <p className="text-xl text-gray-700">
          <span className="mr-4 border-r border-gray-300 pr-4 font-medium">404</span>
          This page could not be found.
        </p>
        <Link href="/" className="ml-4 text-base text-customBlue underline underline-offset-4">
          Go home
        </Link>
      </div>
    </div>
  );
}
