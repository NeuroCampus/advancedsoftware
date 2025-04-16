
import { useState } from "react";
import Sidebar from "../common/Sidebar";
import StudentStats from "../student/StudentStats";
import StudentTimetable from "../student/StudentTimetable";
import WeeklySchedule from "../student/WeeklySchedule";
import StudentAttendance from "../student/StudentAttendance";
import InternalMarks from "../student/InternalMarks";
import SubmitLeaveRequest from "../student/SubmitLeaveRequest";
import LeaveStatus from "../student/LeaveStatus";
import CertificatesManagement from "../student/CertificatesManagement";
import StudentProfile from "../student/StudentProfile";
import StudentAnnouncements from "../student/StudentAnnouncements";
import Chat from "../common/Chat";
import StudentNotifications from "../student/StudentNotifications";
import FaceRecognition from "../student/FaceRecognition";

interface StudentDashboardProps {
  user: any;
  setPage: (page: string) => void;
}

const StudentDashboard = ({ user, setPage }: StudentDashboardProps) => {
  const [activePage, setActivePage] = useState("dashboard");
  const [error, setError] = useState<string | null>(null);

  const handlePageChange = (page: string) => {
    setActivePage(page);
  };

  const renderContent = () => {
    switch (activePage) {
      case "dashboard":
        return <StudentStats />;
      case "timetable":
        return <StudentTimetable />;
      case "weekly-schedule":
        return <WeeklySchedule />;
      case "attendance":
        return <StudentAttendance />;
      case "marks":
        return <InternalMarks />;
      case "leave-request":
        return <SubmitLeaveRequest />;
      case "leave-status":
        return <LeaveStatus />;
      case "certificates":
        return <CertificatesManagement />;
      case "profile":
        return <StudentProfile user={user} />;
      case "announcements":
        return <StudentAnnouncements />;
      case "chat":
        return <Chat role="student" />;
      case "notifications":
        return <StudentNotifications />;
      case "face-recognition":
        return <FaceRecognition />;
      default:
        return <StudentStats />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar role="student" setPage={handlePageChange} activePage={activePage} />
      <div className="flex-1 p-4 md:p-6 overflow-y-auto ml-0 md:ml-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-xl md:text-2xl font-bold">
            Student Dashboard - {activePage.charAt(0).toUpperCase() + activePage.slice(1)}
          </h1>
          <div className="text-sm text-gray-600">
            Welcome, {user?.username || "Student"}
            {user?.branch && ` | ${user.branch}`}
            {user?.semester && ` | Semester: ${user.semester}`}
            {user?.section && ` | Section: ${user.section}`}
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

export default StudentDashboard;
