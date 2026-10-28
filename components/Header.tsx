import Link from "next/link";

const Header = () => {
  return (
    <header id="top" className="container bg-customBlue mx-auto px-5 py-5 mb-6 lg:mb-8 mt-2">
      <Link href="/" className="inline-block cursor-pointer text-gray-100 transition-colors hover:text-white">
        <span className="block text-3xl sm:text-5xl font-medium tracking-[0.08em]">AMIR SIADAT</span>
        <span className="mt-1.5 block text-xs sm:text-sm uppercase tracking-[0.25em] text-gray-300">
          Film critic · Articles &amp; reviews
        </span>
      </Link>
    </header>
  );
};

export default Header;
