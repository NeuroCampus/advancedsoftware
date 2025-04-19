import {
    FaBookOpen,
    FaCheckCircle,
    FaClipboardList,
    FaBell,
    FaFileAlt,
    FaNetworkWired,
    FaTree,
    FaCogs,
    FaCalendarAlt,
    FaUsers,
    FaExclamationTriangle,
    FaBullhorn,
    FaLightbulb,
    FaBook,
    FaThumbtack,
    FaDownload,
  } from "react-icons/fa";
  
  import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
  
  const todaySchedule = [
    {
      subject: "Math",
      time: "09:00 AM - 10:00 AM",
      room: "A101",
      teacher: "Mr. Smith",
    },
    {
      subject: "Physics",
      time: "10:15 AM - 11:15 AM",
      room: "B202",
      teacher: "Dr. Brown",
    },
    {
      subject: "English",
      time: "11:30 AM - 12:30 PM",
      room: "C303",
      teacher: "Ms. Johnson",
    },
  ];
  
  const StudentDashboardOverview = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Top Row Cards */}
        <div className="bg-white border rounded-md p-4 flex items-center gap-4 relative shadow-sm">
          <div className="absolute top-0 left-0 h-full w-1 bg-blue-600 rounded-l-md" />
          <div className="bg-blue-100 p-2 rounded-md text-blue-600">
            <FaBookOpen className="w-5 h-5" />
          </div>
          <div className="text-sm text-gray-800">
            <p className="text-gray-500">Today's Lectures</p>
            <p className="text-lg font-semibold">3</p>
            <p className="text-xs text-gray-500">Next: Database Systems at 11:30 AM</p>
          </div>
        </div>
  
        <div className="bg-white border rounded-md p-4 flex items-center gap-4 relative shadow-sm">
          <div className="absolute top-0 left-0 h-full w-1 bg-yellow-500 rounded-l-md" />
          <div className="bg-yellow-100 p-2 rounded-md text-yellow-500">
            <FaCheckCircle className="w-5 h-5" />
          </div>
          <div className="text-sm text-gray-800">
            <p className="text-gray-500">Attendance Status</p>
            <p className="text-lg font-semibold">85%</p>
            <p className="text-xs text-gray-500">Warning: Low in Computer Networks (68%)</p>
          </div>
        </div>
  
        <div className="bg-white border rounded-md p-4 flex items-center gap-4 relative shadow-sm">
          <div className="absolute top-0 left-0 h-full w-1 bg-red-500 rounded-l-md" />
          <div className="bg-red-100 p-2 rounded-md text-red-500">
            <FaClipboardList className="w-5 h-5" />
          </div>
          <div className="text-sm text-gray-800">
            <p className="text-gray-500">Pending Assignments</p>
            <p className="text-lg font-semibold">2</p>
            <p className="text-xs text-gray-500">Due Today: Algorithm Analysis</p>
          </div>
        </div>
  
        <div className="bg-white border rounded-md p-4 flex items-center gap-4 relative shadow-sm">
          <div className="absolute top-0 left-0 h-full w-1 bg-yellow-400 rounded-l-md" />
          <div className="bg-yellow-100 p-2 rounded-md text-yellow-600">
            <FaBell className="w-5 h-5" />
          </div>
          <div className="text-sm text-gray-800">
            <p className="text-gray-500">Unread Announcements</p>
            <p className="text-lg font-semibold">3</p>
            <p className="text-xs text-gray-500">Latest: Mid-term exam schedule</p>
          </div>
        </div>
  
        {/* Middle Section */}
        {/* Today's Schedule - takes up 2 cols */}
        <Card className="bg-white border border-gray-200 shadow-sm col-span-1 md:col-span-3">
          <CardHeader>
            <CardTitle className="text-base text-gray-800">Today's Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {todaySchedule.map((item, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-md p-4 bg-white shadow-sm space-y-2"
                >
                  <h4 className="font-medium text-gray-900">{item.subject}</h4>
                  <div className="text-sm text-gray-600">
                    <div>🕘 {item.time}</div>
                    <div>🏫 Room: {item.room}</div>
                    <div>👨‍🏫 {item.teacher}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
  
        {/* Performance Overview */}
        <div className="bg-white p-4 rounded-lg shadow col-span-1">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Performance Overview</h2>
          <p className="text-sm text-gray-500">Correlation between attendance and marks</p>
          <div className="text-gray-400 text-sm mt-4">[Scatter Chart Placeholder]</div>
        </div>
  
        {/* Bottom Section */}
        <div className="col-span-1 md:col-span-2 xl:col-span-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {/* Study Materials */}
          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Latest Study Materials</h2>
            <ul className="space-y-4">
              {[
                {
                  icon: <FaFileAlt />,
                  color: "text-red-500",
                  title: "Database Normalization",
                  desc: "Database Systems • Today, 10:30 AM • 2.3 MB",
                },
                {
                  icon: <FaNetworkWired />,
                  color: "text-orange-500",
                  title: "TCP/IP Protocol Suite",
                  desc: "Computer Networks • Yesterday, 2:15 PM • 5.7 MB",
                },
                {
                  icon: <FaTree />,
                  color: "text-green-600",
                  title: "Binary Search Trees",
                  desc: "Data Structures • 2 days ago • 4.5 MB",
                },
                {
                  icon: <FaCogs />,
                  color: "text-purple-600",
                  title: "Process Scheduling",
                  desc: "Operating Systems • 3 days ago • 1.8 MB",
                },
              ].map((item, i) => (
                <li key={i} className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 ${item.color}`}>{item.icon}</div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{item.title}</p>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                  <FaDownload className="text-gray-400 hover:text-gray-600 cursor-pointer" />
                </li>
              ))}
            </ul>
            <div className="mt-4 text-sm text-blue-600 hover:underline cursor-pointer">View All Materials</div>
          </div>
  
          {/* Leave Requests */}
          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Leave Request Status</h2>
            <ul className="space-y-4">
              <li className="flex items-start justify-between">
                <div className="flex gap-3">
                  <FaCalendarAlt className="text-blue-600 mt-1" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">Medical Leave</p>
                    <p className="text-xs text-gray-500">Apr 15–17, 2025 • Applied on Apr 12</p>
                  </div>
                </div>
                <span className="text-xs text-yellow-500 mt-1 font-medium">● Pending</span>
              </li>
              <li className="flex items-start justify-between">
                <div className="flex gap-3">
                  <FaUsers className="text-blue-600 mt-1" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">Family Function</p>
                    <p className="text-xs text-gray-500">Mar 25, 2025 • Applied on Mar 20</p>
                  </div>
                </div>
                <span className="text-xs text-green-600 mt-1 font-medium">✔ Approved</span>
              </li>
              <li className="flex items-start justify-between">
                <div className="flex gap-3">
                  <FaExclamationTriangle className="text-blue-600 mt-1" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">Personal Emergency</p>
                    <p className="text-xs text-gray-500">Feb 10–12, 2025 • Applied on Feb 8</p>
                  </div>
                </div>
                <span className="text-xs text-red-500 mt-1 font-medium">✖ Rejected</span>
              </li>
            </ul>
            <div className="mt-4 text-sm text-blue-600 hover:underline cursor-pointer">Apply for Leave</div>
          </div>
  
          {/* Notifications */}
          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Notification Panel</h2>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <FaBullhorn className="text-purple-600 mt-1" />
                <div>
                  <p className="text-sm font-medium text-gray-800">Mid-Term Examinations</p>
                  <p className="text-xs text-gray-500">The mid-term exams will commence from April 20, 2025</p>
                  <p className="text-xs text-gray-400 mt-1">2 hours ago</p>
                </div>
              </li>
              <li className="flex gap-3">
                <FaCalendarAlt className="text-blue-500 mt-1" />
                <div>
                  <p className="text-sm font-medium text-gray-800">Tech Symposium 2025</p>
                  <p className="text-xs text-gray-500">Register for the annual tech symposium by April 15</p>
                  <p className="text-xs text-gray-400 mt-1">Yesterday</p>
                </div>
              </li>
              <li className="flex gap-3">
                <FaBook className="text-yellow-600 mt-1" />
                <div>
                  <p className="text-sm font-medium text-gray-800">Updated Curriculum</p>
                  <p className="text-xs text-gray-500">The curriculum for the next semester has been updated</p>
                  <p className="text-xs text-gray-400 mt-1">2 days ago</p>
                </div>
              </li>
              <li className="flex gap-3">
                <FaThumbtack className="text-red-500 mt-1" />
                <div>
                  <p className="text-sm font-medium text-gray-800">Assignment Deadline Extended</p>
                  <p className="text-xs text-gray-500">Database assignment deadline extended to April 18</p>
                  <p className="text-xs text-gray-400 mt-1">3 days ago</p>
                </div>
              </li>
            </ul>
            <div className="mt-4 text-sm text-blue-600 hover:underline cursor-pointer">View All Notifications</div>
          </div>
        </div>
      </div>
    );
  };
  
  export default StudentDashboardOverview;
  