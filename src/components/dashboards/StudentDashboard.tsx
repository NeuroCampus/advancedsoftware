import { useState } from "react";
import Sidebar from "../common/Sidebar";
import Navbar from "../common/Navbar";
import StudentStats from "../student/StudentStats";
import StudentTimetable from "../student/StudentTimetable";
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
import StudentDashboardOverview from "../student/StudentDashboardOverview";
import StudentStudyMaterial from "../student/StudentStudyMaterial";
import StudentAssignments from "../student/StudentAssignments";


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
        return <StudentDashboardOverview />;
      case "timetable":
        return <StudentTimetable />;
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
      case "student-study-material":
        return <StudentStudyMaterial />;
      case "student-assignment":
        return <StudentAssignments />;
      default:
        return <StudentDashboardOverview />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100 text-gray-900">
      <Sidebar role="student" setPage={setActivePage} activePage={activePage} />
      <div className="ml-64 w-full">
        <div className="fixed top-0 left-64 right-0 z-10 bg-white shadow">
          <Navbar role="student" user={user} />
        </div>
        <div className="pt-20 px-6 pb-6 overflow-y-auto max-h-screen">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h1 className="text-2xl font-bold text-gray-800">Student Dashboard - Overview</h1>
            <div className="text-sm text-gray-500">
              Welcome, {user?.username || "Student"}
              {user?.branch && ` | ${user.branch}`}{" "}
              {user?.semester && ` | Semester: ${user.semester}`}{" "}
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
    </div>
  );
};

export default StudentDashboard;
