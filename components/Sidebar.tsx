import Categories from "./Categories";

/** Left column shared by all public pages. */
const Sidebar = ({ place }: { place?: string }) => (
  <div className="xl:col-span-2 lg:col-span-3 col-span-1 bg-customBlue">
    <div className="lg:sticky relative top-4 ">
      <Categories place={place} />
    </div>
  </div>
);

export default Sidebar;
