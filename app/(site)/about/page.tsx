/* eslint-disable react/no-unescaped-entities -- verbatim prose carried over from the original page */
import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import { openGraph } from "@/lib/metadata";
import PageHeading from "@/components/PageHeading";
import Sidebar from "@/components/Sidebar";
import { person } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "About",
  description: "About Amir Siadat, film critic from Iran, and this website.",
  alternates: { canonical: "/about" },
  openGraph: openGraph({ url: "/about", title: "About" }),
};

export default function About() {
  return (
    <div className="container mx-auto px-0 mb-2 ">
      <JsonLd data={[{ "@type": "ProfilePage", mainEntity: person() }]} />
      <div className="grid  grid-cols-1 lg:grid-cols-12 gap-3">
        <Sidebar place="about" />

        <div className="lg:col-span-9 xl:col-span-10 lg:ml-3 col-span-1 mt-4 lg:mt-0 px-3 sm:px-0">
          <PageHeading>About</PageHeading>
          <p className="mb-10 max-w-3xl px-1 sm:px-5 font-serif text-xl leading-relaxed text-gray-800">
            This website is a space for publishing my articles and reviews. My
            name is Amir Siadat. I am a film critic from Iran, and my
            professional background is presented in detail in the “Curriculum
            Vitae “ section of this website. Most of these articles and reviews
            have been written in Persian and published in Iranian monthly or
            quarterly film magazines, therefore the texts you read on this site
            have mostly been translated from Persian to English. The “Brief
            Encounter” section of this website consists of concise and compact
            texts that reflect my feelings about movies immediately after the
            first viewing. Please do reference this website if you quote a part
            of this site's writings.
          </p>
          <PageHeading>Contact</PageHeading>
          <p className="px-1 sm:px-5 font-serif text-xl">
            <a href="mailto:amirhosein.siadat82@gmail.com" className="text-customBlue underline underline-offset-4">
              amirhosein.siadat82@gmail.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
