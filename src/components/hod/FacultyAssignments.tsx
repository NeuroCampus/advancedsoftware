import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../ui/card";

const FacultyAssignments = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);

  const assignments = [
    { faculty: "Dr. Jane Smith", subject: "Data Structures", code: "CS201", section: "A", semester: "Semester 1", year: "2024-2025" },
    { faculty: "Dr. John Doe", subject: "Algorithms", code: "CS202", section: "A", semester: "Semester 1", year: "2024-2025" },
    { faculty: "Prof. Sarah Johnson", subject: "Database Systems", code: "CS301", section: "A", semester: "Semester 2", year: "2024-2025" },
    // Add more assignments as needed
  ];

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const getPaginatedData = (data) => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const paginatedAssignments = getPaginatedData(assignments);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Faculty Assignment</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2">Assign Faculty to Subjects</h2>
          <div className="flex space-x-4">
            <select className="px-3 py-2 border border-gray-300 rounded">
              <option>Select semester</option>
              <option>Semester 1</option>
              <option>Semester 2</option>
            </select>
            <select className="px-3 py-2 border border-gray-300 rounded">
              <option>Select subject</option>
              <option>Data Structures</option>
              <option>Algorithms</option>
            </select>
            <select className="px-3 py-2 border border-gray-300 rounded">
              <option>Select section</option>
              <option>Section A</option>
              <option>Section B</option>
            </select>
            <select className="px-3 py-2 border border-gray-300 rounded">
              <option>Select faculty</option>
              <option>Dr. Jane Smith</option>
              <option>Dr. John Doe</option>
            </select>
            <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              + Assign
            </button>
          </div>
        </div>

        {/* Table for Assigned Faculty */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg shadow">
            <thead className="bg-gray-100 text-gray-700 text-sm uppercase">
              <tr>
                <th className="px-4 py-2 text-left">Faculty</th>
                <th className="px-4 py-2 text-left">Subject</th>
                <th className="px-4 py-2 text-left">Section</th>
                <th className="px-4 py-2 text-left">Semester</th>
                <th className="px-4 py-2 text-left">Academic Year</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedAssignments.map((assignment, idx) => (
                <tr key={idx} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2">{assignment.faculty}</td>
                  <td className="px-4 py-2">{assignment.subject} ({assignment.code})</td>
                  <td className="px-4 py-2">{assignment.section}</td>
                  <td className="px-4 py-2">{assignment.semester}</td>
                  <td className="px-4 py-2">{assignment.year}</td>
                  <td className="px-4 py-2">
                    <button className="text-red-500 hover:text-red-700">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 18L18 6M6 6l12 12"
                        ></path>
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-4">
          <span>Rows per page: {rowsPerPage}</span>
          <div className="flex space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 bg-gray-200 rounded"
            >
              ← Previous
            </button>
            <span>
              Page {currentPage} of {Math.ceil(assignments.length / rowsPerPage)}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === Math.ceil(assignments.length / rowsPerPage)}
              className="px-3 py-1.5 bg-gray-200 rounded"
            >
              Next →
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FacultyAssignments;
