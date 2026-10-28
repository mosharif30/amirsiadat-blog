import Categories from "./Categories";

type SidebarProps = {
  place?: string;
  /** Current search, shown in the search box on the results page. */
  query?: string;
};

/** Left column shared by all public pages. */
const Sidebar = ({ place, query }: SidebarProps) => (
  <aside className="xl:col-span-2 lg:col-span-3 col-span-1 bg-customBlue">
    <div className="lg:sticky relative top-4 ">
      <Categories place={place} query={query} />
    </div>
  </aside>
);

export default Sidebar;
