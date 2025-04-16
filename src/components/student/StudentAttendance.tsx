
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

// Mock data - replace with actual API data
const mockData = {
  overview: [
    { subject: "Mathematics", attendance: 85 },
    { subject: "Physics", attendance: 78 },
    { subject: "Chemistry", attendance: 92 },
    { subject: "Biology", attendance: 88 },
  ],
  detailed: [
    {
      date: "2024-04-01",
      status: "Present",
      subject: "Mathematics",
      time: "9:00 AM",
    },
    {
      date: "2024-04-01",
      status: "Absent",
      subject: "Physics",
      time: "10:30 AM",
    },
    // Add more records...
  ],
};

const StudentAttendance = () => {
  const [activeView, setActiveView] = useState("overview");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance Record</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={activeView} onValueChange={setActiveView}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="detailed">Detailed View</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="h-[300px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockData.overview}>
                  <XAxis
                    dataKey="subject"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip />
                  <Bar
                    dataKey="attendance"
                    fill="currentColor"
                    radius={[4, 4, 0, 0]}
                    className="fill-primary"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="detailed">
            <div className="rounded-md border">
              <div className="grid grid-cols-4 p-4 font-medium border-b">
                <div>Date</div>
                <div>Subject</div>
                <div>Time</div>
                <div>Status</div>
              </div>
              {mockData.detailed.map((record, index) => (
                <div
                  key={index}
                  className="grid grid-cols-4 p-4 hover:bg-muted/50 transition-colors"
                >
                  <div>{record.date}</div>
                  <div>{record.subject}</div>
                  <div>{record.time}</div>
                  <div
                    className={
                      record.status === "Present"
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {record.status}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default StudentAttendance;
