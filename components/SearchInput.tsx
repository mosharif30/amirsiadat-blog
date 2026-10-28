import Form from "next/form";

const SearchInput = ({ defaultValue }: { defaultValue?: string }) => {
  return (
    <Form action="/searchResult" role="search" className="p-2 lg:p-3">
      <label htmlFor="site-search" className="sr-only">
        Search
      </label>
      <div className="relative">
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          name="searched"
          type="search"
          id="site-search"
          placeholder="Search…"
          defaultValue={defaultValue}
          className="block w-full border-0 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white/60"
          maxLength={100}
          required
        />
      </div>
    </Form>
  );
};

export default SearchInput;
