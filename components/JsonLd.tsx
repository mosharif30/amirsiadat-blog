import { headers } from "next/headers";

/** Structured data for search engines; `<` is escaped so content can't close the script tag. */
export default async function JsonLd({ data }: { data: object[] }) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const json = JSON.stringify({ "@context": "https://schema.org", "@graph": data }).replace(/</g, "\\u003c");
  return <script type="application/ld+json" nonce={nonce} dangerouslySetInnerHTML={{ __html: json }} />;
}
