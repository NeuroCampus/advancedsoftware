import { useState } from "react";
import Sidebar from "../common/Sidebar";
import HODStats from "../hod/HODStats";
import LowAttendance from "../hod/LowAttendance";
import SemesterManagement from "../hod/SemesterManagement";
import SectionManagement from "../hod/SectionManagement";
import StudentManagement from "../hod/StudentManagement";
import SubjectManagement from "../hod/SubjectManagement";
import FacultyAssignments from "../hod/FacultyAssignments";
import Timetable from "../hod/Timetable";
import LeaveManagement from "../hod/LeaveManagement";
import AttendanceView from "../hod/AttendanceView";
import MarksView from "../hod/MarksView";
import Announcements from "../hod/Announcements";
import NotificationsManagement from "../hod/NotificationsManagement";
import ProctorManagement from "../hod/ProctorManagement";
import Chat from "../common/Chat";
import Profile from "../common/Profile";
import Navbar from "../common/Navbar";
import { FiBell, FiMoon } from "react-icons/fi";

interface HODDashboardProps {
  user: any;
  setPage: (page: string) => void;
}

const HODDashboard = ({ user, setPage }: HODDashboardProps) => {
  const [activePage, setActivePage] = useState("dashboard");
  const [error, setError] = useState<string | null>(null);

  const handlePageChange = (page: string) => {
    setActivePage(page);
  };

  const renderContent = () => {
    switch (activePage) {
      case "dashboard":
        return <HODStats />;
      case "low-attendance":
        return <LowAttendance />;
      case "semesters":
        return <SemesterManagement />;
      case "sections":
        return <SectionManagement />;
      case "students":
        return <StudentManagement />;
      case "subjects":
        return <SubjectManagement />;
      case "faculty-assignments":
        return <FacultyAssignments />;
      case "timetable":
        return <Timetable role="hod" />;
      case "leaves":
        return <LeaveManagement />;
      case "attendance":
        return <AttendanceView />;
      case "marks":
        return <MarksView />;
      case "announcements":
        return <Announcements role="hod" />;
      case "notifications":
        return <NotificationsManagement />;
      case "proctors":
        return <ProctorManagement />;
      case "chat":
        return <Chat role="hod" />;
      case "profile":
        return <Profile role="hod" user={user} />;
      default:
        return <HODStats />;
    }
  };

  const topbarPages = ["dashboard", "low-attendance", "semesters", "faculty-assignments", "leaves"];

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar role="hod" setPage={handlePageChange} activePage={activePage} />

      {/* Main Content */}
      <div className="ml-64 w-full max-h-screen overflow-y-auto bg-gray-100">
        {/* Common Topbar - shown for all pages */}
       
        <Navbar role="hod" user={user} />
        
        {/* Pages with tab layout */}
        {topbarPages.includes(activePage) ? (
          <>
            {/* Header */}
            <div className="flex justify-between items-center p-6">
              <div className="text-3xl font-semibold text-gray-900">HOD Dashboard</div>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm transition duration-300 ease-in-out transform hover:scale-105">
                New Announcement
              </button>
            </div>

            {/* Tab buttons */}
            <div className="bg-gray-100 px-6 pt-4 w-full">
              <div className="flex gap-4 border-b border-gray-300 pb-2">
                <button
                  onClick={() => setActivePage("low-attendance")}
                  className={`px-4 py-2 rounded-t-md text-sm font-medium transition-all ${
                    activePage === "low-attendance"
                      ? "bg-blue-500 text-white shadow-md"
                      : "text-gray-500 hover:text-black hover:bg-blue-100"
                  }`}
                >
                  Low Attendance Students
                </button>
                <button
                  onClick={() => setActivePage("semesters")}
                  className={`px-4 py-2 rounded-t-md text-sm font-medium transition-all ${
                    activePage === "semesters"
                      ? "bg-blue-500 text-white shadow-md"
                      : "text-gray-500 hover:text-black hover:bg-blue-100"
                  }`}
                >
                  Semester Management
                </button>
                <button
                  onClick={() => setActivePage("faculty-assignments")}
                  className={`px-4 py-2 rounded-t-md text-sm font-medium transition-all ${
                    activePage === "faculty-assignments"
                      ? "bg-blue-500 text-white shadow-md"
                      : "text-gray-500 hover:text-black hover:bg-blue-100"
                  }`}
                >
                  Faculty Assignments
                </button>
                <button
                  onClick={() => setActivePage("leaves")}
                  className={`px-4 py-2 rounded-t-md text-sm font-medium transition-all ${
                    activePage === "leaves"
                      ? "bg-blue-500 text-white shadow-md"
                      : "text-gray-500 hover:text-black hover:bg-blue-100"
                  }`}
                >
                  Leave Management
                </button>
              </div>
            </div>

            {/* Tab content */}
            <div className="p-6 overflow-y-auto flex-1 bg-gray-100">
              {error && (
                <div className="bg-red-500 text-white p-2 rounded mb-4">
                  {error}
                </div>
              )}
              {renderContent()}
            </div>
          </>
        ) : (
          // Full-screen pages
          <div className="p-6 w-full">
            {renderContent()}
          </div>
        )}
      </div>
    </div>
  );
};

export default HODDashboard;
