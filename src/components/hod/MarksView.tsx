import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { CalendarIcon, UploadIcon } from "lucide-react";

const mockData = [
  {
    subject: "Mathematics I",
    faculty: "Dr. A. Kumar",
    semester: "1st",
    status: "Uploaded",
    actions: "View",
  },
  {
    subject: "Engineering Physics",
    faculty: "Dr. Meena R.",
    semester: "1st",
    status: "Pending",
    actions: "Remind",
  },
  {
    subject: "C Programming",
    faculty: "Mr. John D.",
    semester: "1st",
    status: "Uploaded",
    actions: "View",
  },
  {
    subject: "Basic Electrical",
    faculty: "Mrs. Leela P.",
    semester: "1st",
    status: "Not Started",
    actions: "Notify",
  },
  {
    subject: "Workshop",
    faculty: "Mr. Kiran M.",
    semester: "1st",
    status: "Uploaded",
    actions: "View",
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "Uploaded":
      return "text-green-700";
    case "Pending":
      return "text-yellow-700";
    case "Not Started":
      return "text-red-700";
    default:
      return "text-muted-foreground";
  }
};

const MarksView = () => {
  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Internal Marks Management</h1>
        <div className="space-x-2">
          <Button variant="outline">
            <CalendarIcon className="w-4 h-4 mr-2" />
            Export Template
          </Button>
          <Button>
            <UploadIcon className="w-4 h-4 mr-2" />
            Upload Marks
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <Tabs defaultValue="cie1" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="cie1">CIE 1</TabsTrigger>
          <TabsTrigger value="cie2">CIE 2</TabsTrigger>
          <TabsTrigger value="cie3">CIE 3</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="labmarks">Lab Marks</TabsTrigger>
          <TabsTrigger value="consolidated">Consolidated</TabsTrigger>
        </TabsList>

        {/* Main Card */}
        <Card>
          <CardHeader>
            <CardTitle>CIE 1 Marks Status</CardTitle>
            <span className="text-sm text-muted-foreground">
              Last Updated: April 10, 2025
            </span>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-100 border border-green-300 rounded-lg p-4">
                <h2 className="text-green-700 text-sm font-medium">Uploaded</h2>
                <p className="text-xl font-bold">3 Subjects</p>
              </div>
              <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4">
                <h2 className="text-yellow-700 text-sm font-medium">Pending</h2>
                <p className="text-xl font-bold">1 Subject</p>
              </div>
              <div className="bg-red-100 border border-red-300 rounded-lg p-4">
                <h2 className="text-red-700 text-sm font-medium">Not Started</h2>
                <p className="text-xl font-bold">1 Subject</p>
              </div>
            </div>

            {/* Subject-wise status heading and export button */}
            <div className="flex items-center justify-between mt-4">
              <h3 className="text-sm font-medium">Subject-wise Mark Upload Status</h3>
              <Button variant="outline" size="sm">
                <CalendarIcon className="w-4 h-4 mr-1" />
                Export Report
              </Button>
            </div>

            {/* Table */}
            <div className="overflow-auto">
              <table className="w-full text-sm border mt-2">
                <thead className="bg-gray-100 text-left">
                  <tr>
                    <th className="p-2 border">Subject</th>
                    <th className="p-2 border">Faculty</th>
                    <th className="p-2 border">Semester</th>
                    <th className="p-2 border">Status</th>
                    <th className="p-2 border">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mockData.map((row, idx) => (
                    <tr key={idx}>
                      <td className="p-2 border">{row.subject}</td>
                      <td className="p-2 border">{row.faculty}</td>
                      <td className="p-2 border">{row.semester}</td>
                      <td className={`p-2 border font-medium ${getStatusColor(row.status)}`}>
                        {row.status}
                      </td>
                      <td className="p-2 border">
                        <Button size="sm" variant="outline">
                          {row.actions}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
};

export default MarksView;
