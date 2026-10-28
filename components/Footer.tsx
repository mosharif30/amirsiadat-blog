import Link from "next/link";
import { site } from "@/lib/site";

const link = "transition-colors hover:text-white";

const Footer = () => (
  <footer className="container mx-auto mt-12 mb-2 bg-customBlue px-5 py-6 text-sm text-gray-300">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <p>
        © {new Date().getFullYear()} {site.author}. Please credit this website when quoting.
      </p>
      <nav aria-label="Footer" className="flex gap-6">
        <Link href="/about" className={link}>
          Contact
        </Link>
        <a href="/feed.xml" className={link}>
          RSS
        </a>
        <a href="#top" className={link}>
          Back to top ↑
        </a>
      </nav>
    </div>
  </footer>
);

export default Footer;
