import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import CSVReader from "react-csv-reader"; // Import the CSV reader

// Sample data format for mock data
interface Student {
  id: number;
  name: string;
  usn: string;
  semester: string;
  course: string;
}

const StudentManagement = () => {
  const [students, setStudents] = useState<Student[]>([
    { id: 1, name: "John Doe", usn: "1BM18CS001", semester: "Semester 1", course: "Computer Science" },
    { id: 2, name: "Jane Smith", usn: "1BM18CS002", semester: "Semester 2", course: "Electrical Engineering" },
    { id: 3, name: "Alice Johnson", usn: "1BM18CS003", semester: "Semester 3", course: "Mechanical Engineering" }
  ]);
  
  const [newStudent, setNewStudent] = useState({ name: "", usn: "", semester: "", course: "" });
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Mock function for adding student (simulates the API)
  const addStudent = () => {
    if (newStudent.name && newStudent.usn && newStudent.semester && newStudent.course) {
      const newStudentData = {
        id: students.length + 1,
        name: newStudent.name,
        usn: newStudent.usn,
        semester: newStudent.semester,
        course: newStudent.course
      };
      setStudents([...students, newStudentData]);
      setNewStudent({ name: "", usn: "", semester: "", course: "" }); // Clear the form
    }
  };

  // Mock function for deleting student (simulates the API)
  const deleteStudent = (id: number) => {
    setStudents(students.filter(student => student.id !== id));
  };

  // Mock function for updating student (simulates the API)
  const updateStudent = () => {
    if (editStudent) {
      setStudents(
        students.map((student) =>
          student.id === editStudent.id ? { ...student, ...editStudent } : student
        )
      );
      setEditStudent(null); // Clear the edit form
    }
  };

  // Function to handle bulk enrollment via CSV upload
  const handleBulkEnrollment = (data: any) => {
    const newStudents = data.map((item: any, index: number) => ({
      id: students.length + index + 1,
      name: item.name,
      usn: item.usn,
      semester: item.semester,
      course: item.course
    }));
    setStudents([...students, ...newStudents]);
  };

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.usn.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card className="shadow-lg border-2 rounded-lg p-6 bg-white">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold text-gray-800">Student Management</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by name or USN"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
        </div>

        {/* Add Student Form */}
        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
          <h3 className="font-medium text-gray-700 mb-4">Add New Student</h3>
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Name"
              value={newStudent.name}
              onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
              className="w-full border rounded-lg px-4 py-2 text-sm"
            />
            <input
              type="text"
              placeholder="USN"
              value={newStudent.usn}
              onChange={(e) => setNewStudent({ ...newStudent, usn: e.target.value })}
              className="w-full border rounded-lg px-4 py-2 text-sm"
            />
          </div>
          <div className="flex gap-4 mt-4">
            <input
              type="text"
              placeholder="Semester"
              value={newStudent.semester}
              onChange={(e) => setNewStudent({ ...newStudent, semester: e.target.value })}
              className="w-full border rounded-lg px-4 py-2 text-sm"
            />
            <input
              type="text"
              placeholder="Course"
              value={newStudent.course}
              onChange={(e) => setNewStudent({ ...newStudent, course: e.target.value })}
              className="w-full border rounded-lg px-4 py-2 text-sm"
            />
          </div>
          <button
            onClick={addStudent}
            className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Add Student
          </button>
        </div>

        {/* Bulk Enrollment (CSV Upload) */}
        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
          <h3 className="font-medium text-gray-700 mb-4">Bulk Enrollment</h3>
          <CSVReader
            onFileLoaded={handleBulkEnrollment}
            parserOptions={{ header: true }} // Ensures the first row is used as header
            inputStyle={{ padding: '8px', borderRadius: '4px', border: '1px solid gray' }}
          />
        </div>

        {/* Student List Table */}
        <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm mt-6">
          <table className="min-w-full text-xs divide-y divide-gray-200">
            <thead className="bg-gray-100 text-gray-700 uppercase font-medium">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">USN</th>
                <th className="px-4 py-3 text-left">Semester</th>
                <th className="px-4 py-3 text-left">Course</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{student.name}</td>
                  <td className="px-4 py-3">{student.usn}</td>
                  <td className="px-4 py-3">{student.semester}</td>
                  <td className="px-4 py-3">{student.course}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setEditStudent(student)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteStudent(student.id)}
                      className="ml-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-3 text-center text-gray-500">
                    No students found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Edit Student Form */}
        {editStudent && (
          <div className="mt-6 p-4 border rounded-lg bg-gray-50">
            <h3 className="font-medium text-gray-700 mb-4">Edit Student</h3>
            <div className="flex gap-4">
              <input
                type="text"
                value={editStudent.name}
                onChange={(e) => setEditStudent({ ...editStudent, name: e.target.value })}
                className="w-full border rounded-lg px-4 py-2 text-sm"
              />
              <input
                type="text"
                value={editStudent.usn}
                onChange={(e) => setEditStudent({ ...editStudent, usn: e.target.value })}
                className="w-full border rounded-lg px-4 py-2 text-sm"
              />
            </div>
            <div className="flex gap-4 mt-4">
              <input
                type="text"
                value={editStudent.semester}
                onChange={(e) => setEditStudent({ ...editStudent, semester: e.target.value })}
                className="w-full border rounded-lg px-4 py-2 text-sm"
              />
              <input
                type="text"
                value={editStudent.course}
                onChange={(e) => setEditStudent({ ...editStudent, course: e.target.value })}
                className="w-full border rounded-lg px-4 py-2 text-sm"
              />
            </div>
            <button
              onClick={updateStudent}
              className="mt-4 px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
            >
              Update Student
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StudentManagement;
