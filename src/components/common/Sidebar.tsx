import { useState } from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Menu, X } from "lucide-react";
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
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  const adminLinks = [
    { name: "Dashboard", page: "dashboard" },
    { name: "Enroll User", page: "enroll-user" },
    { name: "Bulk Upload", page: "bulk-upload" },
    { name: "Branches", page: "branches" },
    { name: "Notifications", page: "notifications" },
    { name: "HOD Leaves", page: "hod-leaves" },
    { name: "Users", page: "users" },
  ];

  const hodLinks = [
    { name: "Dashboard", page: "dashboard" },
    { name: "Low Attendance", page: "low-attendance" },
    { name: "Semesters", page: "semesters" },
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
  ];

  const facultyLinks = [
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
  ];

  const studentLinks = [
    { name: "Dashboard", page: "dashboard" },
    { name: "Timetable", page: "timetable" },
    { name: "Weekly Schedule", page: "weekly-schedule" },
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
  ];

  let links;
  switch (role) {
    case "admin":
      links = adminLinks;
      break;
    case "hod":
      links = hodLinks;
      break;
    case "teacher":
      links = facultyLinks;
      break;
    case "student":
      links = studentLinks;
      break;
    default:
      links = [];
  }

  const sidebarContent = (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        {(!isMobile || isExpanded) && <h2 className="text-xl font-bold">AMS</h2>}
        <Button 
          variant="ghost" 
          className="text-white p-2" 
          onClick={toggleSidebar}
        >
          {isMobile ? (mobileMenuOpen ? <X /> : <Menu />) : (isExpanded ? "←" : "→")}
        </Button>
      </div>

      <div className="space-y-1">
        {links.map((link) => (
          <div
            key={link.page}
            onClick={() => handlePageChange(link.page)}
            className={`cursor-pointer p-2 rounded transition-colors ${
              activePage === link.page
                ? "bg-blue-600 text-white"
                : "hover:bg-gray-700"
            }`}
          >
            {isExpanded ? link.name : link.name.charAt(0)}
          </div>
        ))}
      </div>

      <div className={`${isMobile ? "relative mt-4" : "absolute bottom-4"} w-full pr-8`}>
        <Button
          variant="destructive"
          className={`${isExpanded ? "w-full" : "w-12"} mt-4`}
          onClick={handleLogout}
        >
          {isExpanded ? "Logout" : "X"}
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        <div className="fixed top-0 left-0 z-40 h-16 w-full bg-gray-800 flex items-center px-4">
          <Button 
            variant="ghost" 
            className="text-white"
            onClick={toggleSidebar}
          >
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
        <div className="h-16" /> {/* Spacer for mobile header */}
      </>
    );
  }

  return (
    <Card className={`h-screen bg-gray-800 text-white transition-all ${isExpanded ? "w-60" : "w-20"}`}>
      {sidebarContent}
    </Card>
  );
};

export default Sidebar;
