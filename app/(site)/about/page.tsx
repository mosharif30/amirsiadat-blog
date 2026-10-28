/* eslint-disable react/no-unescaped-entities -- verbatim prose carried over from the original page */
import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import { openGraph } from "@/lib/metadata";
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

        <div className="grid   lg:col-span-9 xl:col-span-10 col-span-1 ">
          <div className="bg-customBlue text-white p-5 text-2xl my-auto">
            ABOUT
          </div>
          <span className=" p-5 text-xl my-auto">
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
          </span>
          <div className="bg-customBlue text-white p-5 text-2xl my-auto">
            Contact
          </div>
          <span className=" p-5 text-xl my-auto">
            amirhosein.siadat82@gmail.com
          </span>
        </div>
      </div>
    </div>
  );
}
