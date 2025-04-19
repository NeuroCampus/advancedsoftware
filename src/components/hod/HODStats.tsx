import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

// HODStats Component
const HODStats = () => {
  const [stats, setStats] = useState({
    faculty_count: 0,
    student_count: 0,
    pending_leaves: 0,
    average_attendance: 0,
    attendance_trend: [],
  });

  // Fetch statistics from the backend API
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/dashboard/stats/"); // Adjust API URL as necessary
        if (response.ok) {
          const data = await response.json();
          setStats(data.data); // Update state with data
        } else {
          console.error("Error fetching stats:", response.status);
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchStats();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>HOD Dashboard Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Displaying Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {/* Total Students */}
          <div className="p-4 border rounded-lg bg-gray-50 shadow-md">
            <h4 className="font-semibold text-gray-700">Total Students</h4>
            <p className="text-2xl font-bold text-blue-600">{stats.student_count}</p>
          </div>

          {/* Total Faculty */}
          <div className="p-4 border rounded-lg bg-gray-50 shadow-md">
            <h4 className="font-semibold text-gray-700">Total Faculty</h4>
            <p className="text-2xl font-bold text-green-600">{stats.faculty_count}</p>
          </div>

          {/* Pending Leave Requests */}
          <div className="p-4 border rounded-lg bg-gray-50 shadow-md">
            <h4 className="font-semibold text-gray-700">Pending Leave Requests</h4>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending_leaves}</p>
          </div>

          {/* Average Attendance */}
          <div className="p-4 border rounded-lg bg-gray-50 shadow-md">
            <h4 className="font-semibold text-gray-700">Average Attendance</h4>
            <p className="text-2xl font-bold text-indigo-600">{stats.average_attendance}%</p>
          </div>
        </div>

        {/* Attendance Trend for Last 4 Weeks */}
        <div className="mt-6">
          <h4 className="font-semibold text-gray-700">Attendance Trend (Last 4 Weeks)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            {stats.attendance_trend.map((week, index) => (
              <div key={index} className="p-4 border rounded-lg bg-gray-50 shadow-md">
                <h5 className="text-lg font-semibold text-gray-700">{week.week}</h5>
                <p className="text-sm text-gray-500">
                  {week.start_date} - {week.end_date}
                </p>
                <p className="text-xl font-bold text-purple-600">
                  {week.attendance_percentage}% Attendance
                </p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HODStats;
