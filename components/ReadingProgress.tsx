"use client";

import { useEffect, useRef } from "react";

/** Thin bar at the top of long posts showing how far the reader has scrolled; hidden at the top. */
export default function ReadingProgress() {
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const visible = scrollable > window.innerHeight && window.scrollY > 80;
      if (!bar.current) return;
      bar.current.style.transform = `scaleX(${scrollable > 0 ? Math.min(1, window.scrollY / scrollable) : 0})`;
      bar.current.style.opacity = visible ? "1" : "0";
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  return (
    <div
      ref={bar}
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-customBlue opacity-0 transition-opacity duration-300 motion-reduce:transition-none"
      style={{ transform: "scaleX(0)" }}
    />
  );
}
