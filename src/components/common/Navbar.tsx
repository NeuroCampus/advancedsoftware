import { FiBell, FiMoon } from "react-icons/fi";

interface NavbarProps {
  role: "admin" | "hod" | "faculty" | "student";
  user?: any;
}

const Navbar = ({ role, user }: NavbarProps) => {
  return (
    <div className="bg-white shadow-md flex items-center justify-between px-6 py-4 border-b w-full">
      {/* Search bar */}
      <div className="flex-1 max-w-sm">
        <input
          type="text"
          placeholder="Search..."
          className="w-full px-4 py-2 rounded-md border border-gray-300 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Right section */}
      <div className="flex items-center gap-5">
        {/* Date & Time */}
        <div className="text-right text-sm text-gray-600">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
          <div className="text-xs">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        {/* Theme toggle */}
        <span className="text-xl cursor-pointer hover:text-gray-500">
          <FiMoon />
        </span>

        {/* Notification bell */}
        <div className="relative cursor-pointer">
          <FiBell size={24} className="text-xl" />
          <span className="absolute -top-1 -right-1 text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full">2</span>
        </div>

        {/* Profile section */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center font-semibold text-sm uppercase">
            {user?.name?.[0] || role[0]}
          </div>
          <div className="text-sm">
            <div className="font-medium">{user?.name || role.toUpperCase()}</div>
            {role === "admin" ? "Principal" : `${role}, Computer Science`}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
