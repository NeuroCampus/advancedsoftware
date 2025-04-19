import { useState } from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import {
  Menu, X, LayoutDashboard, Users, User, Calendar,
  FileText, Bell, BarChart2, Settings, LogOut, ClipboardList, MessageSquare
} from "lucide-react";
import { logoutUser } from "../../utils/authService";
import { useIsMobile } from "../../hooks/use-mobile";

interface SidebarProps {
  role: string;
  setPage: (page: string) => void;
  activePage: string;
}

const Sidebar = ({ role, setPage, activePage }: SidebarProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
    if (isMobile) {
      setMobileMenuOpen(!mobileMenuOpen);
    }
  };

  const handlePageChange = (page: string) => {
    setPage(page);
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    localStorage.clear();
    window.location.href = "/";
  };

  // 🔥 Icon mapping
  const iconMap: Record<string, JSX.Element> = {
    dashboard: <LayoutDashboard size={20} />,
    "enroll-user": <User size={20} />,
    "bulk-upload": <ClipboardList size={20} />,
    branches: <Users size={20} />,
    notifications: <Bell size={20} />,
    "hod-leaves": <ClipboardList size={20} />,
    users: <User size={20} />,
    "low-attendance": <ClipboardList size={20} />,
    semesters: <Calendar size={20} />,
    sections: <Calendar size={20} />,
    students: <User size={20} />,
    subjects: <FileText size={20} />,
    "faculty-assignments": <User size={20} />,
    timetable: <Calendar size={20} />,
    leaves: <ClipboardList size={20} />,
    attendance: <ClipboardList size={20} />,
    marks: <BarChart2 size={20} />,
    announcements: <Bell size={20} />,
    proctors: <User size={20} />,
    chat: <MessageSquare size={20} />,
    profile: <Settings size={20} />,
    "take-attendance": <ClipboardList size={20} />,
    "upload-marks": <FileText size={20} />,
    "apply-leave": <ClipboardList size={20} />,
    "attendance-records": <ClipboardList size={20} />,
    "proctor-students": <User size={20} />,
    "student-leave": <ClipboardList size={20} />,
    "schedule-mentoring": <Calendar size={20} />,
    statistics: <BarChart2 size={20} />,
    "weekly-schedule": <Calendar size={20} />,
    "leave-request": <ClipboardList size={20} />,
    "leave-status": <ClipboardList size={20} />,
    certificates: <FileText size={20} />,
    "face-recognition": <User size={20} />,
  };

  // 🧠 Sidebar links by role
  const links = {
    admin: [
      { name: "Dashboard", page: "dashboard" },
      { name: "Enroll User", page: "enroll-user" },
      { name: "Bulk Upload", page: "bulk-upload" },
      { name: "Branches", page: "branches" },
      { name: "Notifications", page: "notifications" },
      { name: "HOD Leaves", page: "hod-leaves" },
      { name: "Users", page: "users" },
    ],
    hod: [
      { name: "Dashboard", page: "dashboard" },
      { name: "Low Attendance", page: "low-attendance" },
      { name: "Semester management", page: "semesters" },
      { name: "Sections", page: "sections" },
      { name: "Students", page: "students" },
      { name: "Subjects", page: "subjects" },
      { name: "Faculty Assignments", page: "faculty-assignments" },
      { name: "Timetable", page: "timetable" },
      { name: "Faculty Leaves", page: "leaves" },
      { name: "Attendance", page: "attendance" },
      { name: "Marks", page: "marks" },
      { name: "Announcements", page: "announcements" },
      { name: "Notifications", page: "notifications" },
      { name: "Proctors", page: "proctors" },
      { name: "Chat", page: "chat" },
      { name: "Profile", page: "profile" },
    ],
    teacher: [
      { name: "Dashboard", page: "dashboard" },
      { name: "Take Attendance", page: "take-attendance" },
      { name: "Upload Marks", page: "upload-marks" },
      { name: "Apply Leave", page: "apply-leave" },
      { name: "Attendance Records", page: "attendance-records" },
      { name: "Announcements", page: "announcements" },
      { name: "Proctor Students", page: "proctor-students" },
      { name: "Manage Student Leave", page: "student-leave" },
      { name: "Timetable", page: "timetable" },
      { name: "Chat", page: "chat" },
      { name: "Profile", page: "profile" },
      { name: "Schedule Mentoring", page: "schedule-mentoring" },
      { name: "Generate Statistics", page: "statistics" },
    ],
    student: [
      { name: "Dashboard", page: "dashboard" },
      { name: "Timetable", page: "timetable" },
      { name: "Attendance", page: "attendance" },
      { name: "Internal Marks", page: "marks" },
      { name: "Leave Request", page: "leave-request" },
      { name: "Leave Status", page: "leave-status" },
      { name: "Certificates", page: "certificates" },
      { name: "Profile", page: "profile" },
      { name: "Announcements", page: "announcements" },
      { name: "Chat", page: "chat" },
      { name: "Notifications", page: "notifications" },
      { name: "Face Recognition", page: "face-recognition" },
      { name: "Study Material", page: "student-study-material" },
      { name: "Student Assignments", page: "student-assignment" },
    ]
  }[role] || [];

  const sidebarContent = (
    <div className="flex flex-col h-full p-4">
      <h2 className="text-xl font-bold mb-6 text-white">{role === "admin" ? "AdminHub" : "Dashboard"}</h2>

      <div className="flex-1 space-y-1 overflow-y-auto scrollbar-hide">
        {links.map(link => (
          <div
            key={link.page}
            onClick={() => handlePageChange(link.page)}
            className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-all ${
              activePage === link.page ? "bg-blue-600 text-white" : "hover:bg-gray-700 text-white"
            }`}
          >
            {iconMap[link.page] || <LayoutDashboard size={20} />}
            <span className="text-sm">{link.name}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-700">
        <Button
          variant="ghost"
          className="w-full flex justify-start gap-2 text-white hover:bg-red-600"
          onClick={handleLogout}
        >
          <LogOut size={20} />
          <span>Logout</span>
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        <div className="fixed top-0 left-0 z-40 h-16 w-full bg-gray-800 flex items-center px-4">
          <Button variant="ghost" className="text-white" onClick={toggleSidebar}>
            <Menu />
          </Button>
          <h2 className="text-xl font-bold text-white ml-4">AMS</h2>
        </div>
        <div
          className={`fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity ${
            mobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          onClick={() => setMobileMenuOpen(false)}
        />
        <Card
          className={`fixed top-0 left-0 h-full bg-gray-800 text-white z-40 transition-transform duration-300 ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          } w-64`}
        >
          {sidebarContent}
        </Card>
        <div className="h-16" /> {/* Spacer for header */}
      </>
    );
  }

  return (
    <div className="fixed top-0 left-0 h-screen w-64 bg-gray-800 text-white z-40 shadow-lg">
      {sidebarContent}
    </div>
  );
};

export default Sidebar;
