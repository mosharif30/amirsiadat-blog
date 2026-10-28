import { ImageResponse } from "next/og";
import { site } from "@/lib/site";

export const alt = site.name;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Default social preview for pages and posts without a cover image (the site's header colours). */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 96px",
          background: "#0a3d62",
          color: "#e5e7eb",
        }}
      >
        <div style={{ fontSize: 104, letterSpacing: 4 }}>AMIR SIADAT</div>
        <div style={{ marginTop: 24, fontSize: 34, color: "#cbd5e1" }}>Articles and film reviews</div>
      </div>
    ),
    size,
  );
}
