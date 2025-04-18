import { useState } from "react";
import Sidebar from "../common/Sidebar";
import AdminStats from "../admin/AdminStats";
import EnrollUser from "../admin/EnrollUser";
import BulkUpload from "../admin/BulkUpload";
import BranchesManagement from "../admin/BranchesManagement";
import NotificationsManagement from "../admin/NotificationsManagement";
import HODLeavesManagement from "../admin/HODLeavesManagement";
import UsersManagement from "../admin/UsersManagement";

interface AdminDashboardProps {
  user: any;
  setPage: (page: string) => void;
}

const AdminDashboard = ({ user, setPage }: AdminDashboardProps) => {
  const [activePage, setActivePage] = useState("dashboard");
  const [error, setError] = useState<string | null>(null);

  const handlePageChange = (page: string) => {
    setActivePage(page);
  };

  const renderContent = () => {
    switch (activePage) {
      case "dashboard":
        return <AdminStats />;
      case "enroll-user":
        return <EnrollUser />;
      case "bulk-upload":
        return <BulkUpload />;
      case "branches":
        return <BranchesManagement />;
      case "notifications":
        return <NotificationsManagement />;
      case "hod-leaves":
        return <HODLeavesManagement />;
      case "users":
        return <UsersManagement />;
      default:
        return <AdminStats />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar role="admin" setPage={handlePageChange} activePage={activePage} />

      {/* Main content */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-xl md:text-2xl font-bold">
            Admin Dashboard - {activePage.charAt(0).toUpperCase() + activePage.slice(1)}
          </h1>
          <div className="text-sm text-gray-600">
            Welcome, {user?.username || "Admin"}
          </div>
        </div>

        {error && (
          <div className="bg-red-500 text-white p-2 rounded mb-4">
            {error}
          </div>
        )}

        {renderContent()}
      </div>
    </div>
  );
};

export default AdminDashboard;
