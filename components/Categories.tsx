import Link from "next/link";
import { getCategories } from "@/lib/posts";
import SearchInput from "./SearchInput";

type CategoriesProps = {
  /** Slug of the active sidebar entry (category slug, "about" or "curriculum-vitae"). */
  place?: string;
  query?: string;
};

// A wrapped row of links on phones, the original right-aligned column from lg up.
const itemClass = (active: boolean) =>
  `block px-3 py-2 text-xs sm:text-sm lg:text-[0.8125rem] font-bold uppercase tracking-wider lg:tracking-wide transition-colors lg:mx-2 lg:mb-1 lg:text-right ${
    active ? "bg-white text-customBlue" : "text-gray-200 hover:bg-white/10 hover:text-white"
  }`;

const Categories = async ({ place, query }: CategoriesProps) => {
  const categories = await getCategories();
  const items = [
    ...categories.map((category) => ({ key: category.slug, href: `/category/${category.slug}`, name: category.name })),
    { key: "curriculum-vitae", href: "/curriculum-vitae", name: "Curriculum Vitae" },
    { key: "about", href: "/about", name: "About" },
  ];

  return (
    <div className="pb-3 lg:pt-3 lg:pb-4 lg:mb-10">
      <SearchInput defaultValue={query} />
      <nav aria-label="Sections" className="flex flex-wrap gap-1 px-2 lg:block lg:px-0">
        {items.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className={itemClass(place === item.key)}
            aria-current={place === item.key ? "page" : undefined}
          >
            {item.name}
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default Categories;
