import type { ReactNode } from "react";

/** Navy title band at the top of category, search and about pages. */
const PageHeading = ({ children, note }: { children: ReactNode; note?: ReactNode }) => (
  <div className="mb-6 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 bg-customBlue px-5 py-4 text-white">
    <h1 className="text-lg font-bold uppercase tracking-[0.15em] sm:text-xl">{children}</h1>
    {note && <p className="text-sm text-gray-300">{note}</p>}
  </div>
);

export default PageHeading;
