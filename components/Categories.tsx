import Link from "next/link";
import { getCategories } from "@/lib/posts";
import SearchInput from "./SearchInput";

type CategoriesProps = {
  /** Slug of the active sidebar entry (category slug, "about" or "curriculum-vitae"). */
  place?: string;
};

// The original markup combined conflicting utilities (e.g. text-gray-200 + text-white) and relied
// on Tailwind 3.1's CSS order to pick a winner. These are the colors it actually rendered,
// spelled out so the result no longer depends on rule order.
const itemClass = (active: boolean) =>
  `font-bold cursor-pointer block p-2 mb-1 lg:mx-3  xl:text-base  lg:text-right ${
    active ? "bg-white text-gray-500 hover:text-black" : "bg-customBlue text-gray-200 hover:text-white"
  }`;

const Categories = async ({ place }: CategoriesProps) => {
  const categories = await getCategories();

  return (
    <div className="    lg:pt-3 pb-4 lg:mb-10  ">
      <SearchInput />
      {categories.map((category) => (
        <Link key={category.slug} href={`/category/${category.slug}`} className={itemClass(place === category.slug)}>
          {category.name}
        </Link>
      ))}
      <Link href={`/curriculum-vitae`} className={itemClass(place === "curriculum-vitae")}>
        CURRICULUM VITAE
      </Link>
      <Link href={`/about`} className={itemClass(place === "about")}>
        ABOUT
      </Link>
    </div>
  );
};

export default Categories;
