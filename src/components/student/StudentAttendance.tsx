import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface AttendanceRecord {
  date: string;
  status: "Present" | "Absent";
}

interface SubjectAttendance {
  records: AttendanceRecord[];
  present: number;
  total: number;
  percentage: number;
}

interface AttendanceData {
  [subject: string]: SubjectAttendance;
}

const StudentAttendance = () => {
  const [attendanceData, setAttendanceData] = useState<AttendanceData>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const res = await fetch("/student/attendance/");
        const data = await res.json();
        if (data.success) {
          setAttendanceData(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch attendance data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, []);

  const generateTrendData = () => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May"];
    const subjects = Object.keys(attendanceData);
    return months.map((month) => {
      const obj: any = { name: month };
      subjects.forEach((sub) => {
        obj[sub] = attendanceData[sub]?.percentage || 0;
      });
      return obj;
    });
  };

  const overview = Object.values(attendanceData).reduce(
    (acc, subject) => {
      acc.total += subject.total;
      acc.attended += subject.present;
      return acc;
    },
    { total: 0, attended: 0 }
  );

  const overallPercentage =
    overview.total > 0
      ? `${Math.round((overview.attended / overview.total) * 100)}%`
      : "0%";

  if (loading) {
    return (
      <div className="w-full h-48 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 text-gray-800">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Attendance Tracker</h2>
        <p className="text-sm text-gray-500">
          Monitor your subject-wise attendance and trends
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="col-span-2 bg-white border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base text-gray-800">Attendance Trends</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={generateTrendData()}>
                <XAxis dataKey="name" stroke="#666" />
                <YAxis stroke="#666" domain={[0, 100]} />
                <Tooltip />
                {Object.keys(attendanceData).map((subject, idx) => (
                  <Line
                    key={subject}
                    type="monotone"
                    dataKey={subject}
                    stroke={
                      ["#3b82f6", "#22c55e", "#f97316", "#a855f7", "#ef4444"][
                        idx % 5
                      ]
                    }
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base text-gray-800">Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total Classes</span>
                <span>{overview.total}</span>
              </div>
              <div className="flex justify-between">
                <span>Classes Attended</span>
                <span>{overview.attended}</span>
              </div>
              <div className="flex justify-between">
                <span>Overall Percentage</span>
                <span className="text-blue-600">{overallPercentage}</span>
              </div>
              <div className="flex justify-between">
                <span>Minimum Required</span>
                <span className="text-orange-600">75%</span>
              </div>
              <div className="flex justify-between">
                <span>Classes to Attend</span>
                <span>{Math.max(0, Math.ceil((0.75 * overview.total - overview.attended) / 0.25))}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base text-gray-800">Subject-wise Attendance</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="min-w-full text-sm text-left text-gray-800">
            <thead className="border-b border-gray-200">
              <tr className="uppercase text-xs text-gray-500">
                <th className="p-3">Subject</th>
                <th className="p-3">Total Classes</th>
                <th className="p-3">Present</th>
                <th className="p-3">Percentage</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(attendanceData).map(([subject, data], index) => {
                const percentage = Math.round(data.percentage);
                const status = percentage < 75 ? "At Risk" : "Good";
                return (
                  <tr key={index} className="border-t border-gray-100">
                    <td className="p-3">{subject}</td>
                    <td className="p-3">{data.total}</td>
                    <td className="p-3">{data.present}</td>
                    <td className="p-3">{percentage}%</td>
                    <td className="p-3">
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded ${
                          status === "Good"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentAttendance;
