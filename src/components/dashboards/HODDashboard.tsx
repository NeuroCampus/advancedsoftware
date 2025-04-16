
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

  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar role="hod" setPage={handlePageChange} activePage={activePage} />
      <div className="flex-1 p-4 md:p-6 overflow-y-auto ml-0 md:ml-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-xl md:text-2xl font-bold">
            HOD Dashboard - {activePage.charAt(0).toUpperCase() + activePage.slice(1)}
          </h1>
          <div className="text-sm text-gray-600">
            Welcome, {user?.username || "HOD"}
            {user?.department && ` | ${user.department}`}
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

export default HODDashboard;
