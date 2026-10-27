import type { Metadata } from "next";
import Header from "@/components/Header";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <>
      <Header />
      <div className="container mx-auto flex min-h-[50vh] items-center justify-center px-3 text-center">
        <p className="text-xl text-gray-700">
          <span className="mr-4 border-r border-gray-300 pr-4 font-medium">404</span>
          This page could not be found.
        </p>
      </div>
    </>
  );
}
