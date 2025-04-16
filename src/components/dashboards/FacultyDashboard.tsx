
import { useState } from "react";
import Sidebar from "../common/Sidebar";
import FacultyStats from "../faculty/FacultyStats";
import TakeAttendance from "../faculty/TakeAttendance";
import UploadMarks from "../faculty/UploadMarks";
import ApplyLeave from "../faculty/ApplyLeave";
import AttendanceRecords from "../faculty/AttendanceRecords";
import Announcements from "../faculty/Announcements";
import ProctorStudents from "../faculty/ProctorStudents";
import ManageStudentLeave from "../faculty/ManageStudentLeave";
import Timetable from "../faculty/Timetable";
import Chat from "../common/Chat";
import Profile from "../common/Profile";
import ScheduleMentoring from "../faculty/ScheduleMentoring";
import GenerateStatistics from "../faculty/GenerateStatistics";

interface FacultyDashboardProps {
  user: any;
  setPage: (page: string) => void;
}

const FacultyDashboard = ({ user, setPage }: FacultyDashboardProps) => {
  const [activePage, setActivePage] = useState("dashboard");
  const [error, setError] = useState<string | null>(null);

  const handlePageChange = (page: string) => {
    setActivePage(page);
  };

  const renderContent = () => {
    switch (activePage) {
      case "dashboard":
        return <FacultyStats />;
      case "take-attendance":
        return <TakeAttendance />;
      case "upload-marks":
        return <UploadMarks />;
      case "apply-leave":
        return <ApplyLeave />;
      case "attendance-records":
        return <AttendanceRecords />;
      case "announcements":
        return <Announcements role="faculty" />;
      case "proctor-students":
        return <ProctorStudents />;
      case "student-leave":
        return <ManageStudentLeave />;
      case "timetable":
        return <Timetable role="faculty" />;
      case "chat":
        return <Chat role="faculty" />;
      case "profile":
        return <Profile role="faculty" user={user} />;
      case "schedule-mentoring":
        return <ScheduleMentoring />;
      case "statistics":
        return <GenerateStatistics />;
      default:
        return <FacultyStats />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar role="teacher" setPage={handlePageChange} activePage={activePage} />
      <div className="flex-1 p-4 md:p-6 overflow-y-auto ml-0 md:ml-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-xl md:text-2xl font-bold">
            Faculty Dashboard - {activePage.charAt(0).toUpperCase() + activePage.slice(1)}
          </h1>
          <div className="text-sm text-gray-600">
            Welcome, {user?.username || "Faculty"}
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

export default FacultyDashboard;
