import { useMemo, useState } from "react";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { format, isBefore } from "date-fns";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

const assignments = [
  {
    title: "Database Schema Design",
    dueDate: "2025-04-15",
    status: "Pending",
    subject: "Database",
  },
  {
    title: "TCP Socket Programming",
    dueDate: "2025-04-10",
    status: "Submitted",
    subject: "Networks",
  },
  {
    title: "AVL Tree Implementation",
    dueDate: "2025-04-05",
    status: "Submitted",
    subject: "Data Structures",
  },
  {
    title: "Process Synchronization",
    dueDate: "2025-03-28",
    status: "Pending",
    subject: "Operating Systems",
  },
  {
    title: "Network Topology Design",
    dueDate: "2025-04-20",
    status: "Pending",
    subject: "Networks",
  },
  {
    title: "SQL Query Optimization",
    dueDate: "2025-04-25",
    status: "Pending",
    subject: "Database",
  },
];

const getStatusBadge = (status: string, dueDate: string) => {
  const now = new Date();
  const due = new Date(dueDate);

  if (status === "Submitted") return <Badge className="bg-blue-100 text-blue-700">Submitted</Badge>;
  if (status === "Pending" && isBefore(due, now)) {
    return <Badge className="bg-red-100 text-red-700">Overdue</Badge>;
  }
  return <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>;
};

const StudentAssignment = () => {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return assignments.filter((a) =>
      a.title.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  const summary = useMemo(() => {
    let pending = 0;
    let submitted = 0;
    let overdue = 0;
    const now = new Date();

    assignments.forEach((a) => {
      if (a.status === "Submitted") submitted++;
      else if (isBefore(new Date(a.dueDate), now)) overdue++;
      else pending++;
    });

    return {
      total: assignments.length,
      pending,
      submitted,
      overdue,
    };
  }, []);

  return (
    <div className="p-6 space-y-6 text-gray-800">
      {/* Heading */}
      <h2 className="text-xl font-semibold text-gray-900">Assignments</h2>

      {/* Summary Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
        <div className="bg-gray-100 rounded-lg p-4">
          <p className="text-sm text-gray-600">Total</p>
          <p className="text-xl font-bold">{summary.total}</p>
        </div>
        <div className="bg-yellow-100 rounded-lg p-4">
          <p className="text-sm text-yellow-800">Pending</p>
          <p className="text-xl font-bold text-yellow-900">{summary.pending}</p>
        </div>
        <div className="bg-blue-100 rounded-lg p-4">
          <p className="text-sm text-blue-800">Submitted</p>
          <p className="text-xl font-bold text-blue-900">{summary.submitted}</p>
        </div>
        <div className="bg-red-100 rounded-lg p-4">
          <p className="text-sm text-red-800">Overdue</p>
          <p className="text-xl font-bold text-red-900">{summary.overdue}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Input
          placeholder="Search assignments..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex gap-2">
          <Button variant="outline">All Statuses</Button>
          <Button variant="outline">All Subjects</Button>
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-x-auto">
        <CardContent className="p-0">
          <table className="min-w-full divide-y divide-gray-200 text-sm text-left">
            <thead className="bg-gray-100 text-gray-600 font-medium">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">End Date</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((assignment, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 text-gray-800">{assignment.title}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {format(new Date(assignment.dueDate), "MMM dd, yyyy")}
                  </td>
                  <td className="px-4 py-3">
                    {getStatusBadge(assignment.status, assignment.dueDate)}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-4 text-center text-gray-500">
                    No assignments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentAssignment;
