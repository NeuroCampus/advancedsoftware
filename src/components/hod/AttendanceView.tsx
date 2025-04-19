import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Doughnut, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const AttendanceView = () => {
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const attendanceData = [
    {
      name: "John Doe",
      usn: "1AM21CS001",
      subject: "Mathematics",
      semester: "Semester 1",
      date: "2024-04-01",
      status: "Present",
    },
    {
      name: "Jane Smith",
      usn: "1AM21CS002",
      subject: "Mathematics",
      semester: "Semester 1",
      date: "2024-04-01",
      status: "Absent",
    },
    {
      name: "Alice Johnson",
      usn: "1AM21CS003",
      subject: "Physics",
      semester: "Semester 2",
      date: "2024-04-02",
      status: "Present",
    },
    {
      name: "Mark Green",
      usn: "1AM21CS004",
      subject: "Physics",
      semester: "Semester 2",
      date: "2024-04-02",
      status: "Absent",
    },
  ];

  const filteredData = attendanceData.filter((entry) => {
    return (
      (!selectedSubject || entry.subject === selectedSubject) &&
      (!selectedSemester || entry.semester === selectedSemester) &&
      (!selectedDate || entry.date === selectedDate)
    );
  });

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + rowsPerPage);

  const presentCount = filteredData.filter((d) => d.status === "Present").length;
  const absentCount = filteredData.filter((d) => d.status === "Absent").length;

  // Doughnut chart data
  const doughnutData = {
    labels: ["Present", "Absent"],
    datasets: [
      {
        data: [presentCount, absentCount],
        backgroundColor: ["#34D399", "#F87171"], // Green & Red
        hoverOffset: 8,
        borderWidth: 2,
        borderColor: "white", // Adding border around segments
      },
    ],
  };

  // Bar chart data
  const subjectCounts = filteredData.reduce((acc, curr) => {
    acc[curr.subject] = acc[curr.subject] || { Present: 0, Absent: 0 };
    acc[curr.subject][curr.status]++;
    return acc;
  }, {} as Record<string, { Present: number; Absent: number }>);

  const barData = {
    labels: Object.keys(subjectCounts),
    datasets: [
      {
        label: "Present",
        data: Object.values(subjectCounts).map((s) => s.Present),
        backgroundColor: "#60A5FA", // Light Blue
        borderRadius: 8,
        borderWidth: 2,
      },
      {
        label: "Absent",
        data: Object.values(subjectCounts).map((s) => s.Absent),
        backgroundColor: "#F87171", // Red
        borderRadius: 8,
        borderWidth: 2,
      },
    ],
  };

  return (
    <Card className="shadow-md border-2 rounded-lg">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-gray-800">Attendance View</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex gap-4 flex-wrap items-center mb-4">
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Subjects</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Physics">Physics</option>
          </select>

          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Semesters</option>
            <option value="Semester 1">Semester 1</option>
            <option value="Semester 2">Semester 2</option>
          </select>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Attendance Table */}
        <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
          <table className="min-w-full text-xs divide-y divide-gray-200">
            <thead className="bg-gray-100 text-gray-700 uppercase font-medium">
              <tr>
                <th className="px-3 py-2 text-left">USN</th>
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-left">Subject</th>
                <th className="px-3 py-2 text-left">Semester</th>
                <th className="px-3 py-2 text-left">Date</th>
                <th className="px-3 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {paginatedData.map((entry, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-3 py-2">{entry.usn}</td>
                  <td className="px-3 py-2">{entry.name}</td>
                  <td className="px-3 py-2">{entry.subject}</td>
                  <td className="px-3 py-2">{entry.semester}</td>
                  <td className="px-3 py-2">{entry.date}</td>
                  <td
                    className={`px-3 py-2 font-semibold ${
                      entry.status === "Present" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {entry.status}
                  </td>
                </tr>
              ))}
              {paginatedData.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-3 text-center text-gray-500">
                    No attendance records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-4 text-xs">
          <span>Rows per page: {rowsPerPage}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => prev - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-gray-300 rounded-lg hover:bg-gray-400 disabled:opacity-50"
            >
              ← Prev
            </button>
            <span>
              Page {currentPage} of {totalPages || 1}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => prev + 1)}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-3 py-1 bg-gray-300 rounded-lg hover:bg-gray-400 disabled:opacity-50"
            >
              Next →
            </button>
          </div>
        </div>

        {/* Charts */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="p-3 bg-white rounded-lg shadow-sm">
            <h3 className="font-medium text-sm text-gray-700 mb-3">Overall Attendance Status</h3>
            <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: true }} width={100} height={100} />
          </div>
          <div className="p-3 bg-white rounded-lg shadow-sm">
            <h3 className="font-medium text-sm text-gray-700 mb-3">Subject-wise Attendance</h3>
            <Bar data={barData} options={{ responsive: true, maintainAspectRatio: true }} width={100} height={100} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AttendanceView;
