"use client";

import "../styles/globals.scss";

/** Last-resort boundary for errors in the root layout itself. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-3 text-center">
          <p className="text-xl text-gray-700">
            <span className="mr-4 border-r border-gray-300 pr-4 font-medium">500</span>
            Something went wrong.
          </p>
          <button type="button" onClick={reset} className="text-gray-500 transition-colors hover:text-gray-900">
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
