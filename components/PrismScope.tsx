"use client";

import Prism from "prismjs";
import "prismjs/plugins/line-numbers/prism-line-numbers";
import "prismjs/themes/prism-tomorrow.css";
import "prismjs/plugins/line-numbers/prism-line-numbers.css";
import { useEffect, useRef, type ReactNode } from "react";

/** A <div> whose code blocks get Prism syntax highlighting and line numbers after hydration. */
export default function PrismScope({ className, children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current?.querySelector("pre code")) Prism.highlightAllUnder(ref.current);
  }, []);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
