import Link from "next/link";

const Header = () => {
  return (
    <div className="container bg-customBlue mx-auto px-3 mb-8 mt-2">
      <div className=" w-full inline-block  py-3 mt-1">
        <div className="md:float-left block">
          <Link href="/" className="cursor-pointer ml-2   sm:text-5xl text-4xl text-gray-200">
            AMIR SIADAT
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Header;
