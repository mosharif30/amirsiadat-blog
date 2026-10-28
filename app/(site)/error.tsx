"use client";

/** Shown inside the site layout when a page fails to render (no details reach the browser). */
export default function SiteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="container mx-auto flex min-h-[50vh] flex-col items-center justify-center gap-4 px-3 text-center">
      <p className="text-xl text-gray-700">
        <span className="mr-4 border-r border-gray-300 pr-4 font-medium">500</span>
        Something went wrong.
      </p>
      <button type="button" onClick={reset} className="text-gray-500 transition-colors hover:text-gray-900">
        Try again
      </button>
    </div>
  );
}
