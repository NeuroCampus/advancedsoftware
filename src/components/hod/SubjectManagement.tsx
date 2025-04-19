import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

const SubjectManagement = () => {
  const [subjects, setSubjects] = useState([
    { name: "Mathematics", code: "MATH101", semester: "Semester 1", created: "04/10/2024" },
    { name: "Computer Science", code: "CS101", semester: "Semester 1", created: "04/10/2024" },
    { name: "Physics", code: "PHY101", semester: "Semester 2", created: "04/10/2024" },
  ]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [filterSemester, setFilterSemester] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [newSubject, setNewSubject] = useState({ name: "", code: "", semester: "" });

  const handleAddSubject = (e) => {
    e.preventDefault();
    const newEntry = {
      ...newSubject,
      created: new Date().toLocaleDateString("en-GB"),
    };
    setSubjects((prev) => [...prev, newEntry]);
    setNewSubject({ name: "", code: "", semester: "" });
    setIsAddModalOpen(false);
  };

  const handleDelete = (subj) => {
    if (window.confirm("Are you sure you want to delete this subject?")) {
      setSubjects(subjects.filter((s) => s !== subj));
    }
  };

  const handleEdit = (subj) => {
    alert(`Edit subject: ${subj.name}`);
  };

  const filteredSubjects = filterSemester
    ? subjects.filter((s) => s.semester === filterSemester)
    : subjects;

  const totalItems = filteredSubjects.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedSubjects = filteredSubjects.slice(startIndex, endIndex);

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-gray-800">Subject Management</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <select
            value={filterSemester}
            onChange={(e) => setFilterSemester(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="">All Semesters</option>
            {[...new Set(subjects.map((s) => s.semester))].map((sem, i) => (
              <option key={i} value={sem}>
                {sem}
              </option>
            ))}
          </select>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 transition text-white px-4 py-2 rounded-lg shadow"
          >
            Add Subject
          </button>
        </div>

        <div className="overflow-x-auto border border-gray-200 rounded">
          <table className="min-w-full text-sm divide-y divide-gray-200">
            <thead className="bg-gray-100 text-gray-700 uppercase text-xs font-semibold">
              <tr>
                {["Name", "Code", "Semester", "Created", "Actions"].map((header) => (
                  <th key={header} className="px-4 py-3 text-left">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {paginatedSubjects.map((s, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-2">{s.name}</td>
                  <td className="px-4 py-2">{s.code}</td>
                  <td className="px-4 py-2">{s.semester}</td>
                  <td className="px-4 py-2">{s.created}</td>
                  <td className="px-4 py-2 flex gap-2">
                    <button
                      onClick={() => handleEdit(s)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(s)}
                      className="text-red-600 hover:text-red-800"
                    >
                      ❌
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-center mt-6 text-sm">
          <span>Rows per page: {rowsPerPage}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => prev - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
            >
              ← Prev
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => prev + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
            >
              Next →
            </button>
          </div>
        </div>
      </CardContent>

      {isAddModalOpen && (
        <Modal onClose={() => setIsAddModalOpen(false)} title="Add New Subject">
          <form onSubmit={handleAddSubject} className="space-y-4">
            <input
              type="text"
              placeholder="Subject Name"
              value={newSubject.name}
              onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
              className="w-full px-3 py-2 border rounded"
              required
            />
            <input
              type="text"
              placeholder="Subject Code"
              value={newSubject.code}
              onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value })}
              className="w-full px-3 py-2 border rounded"
              required
            />
            <input
              type="text"
              placeholder="Semester"
              value={newSubject.semester}
              onChange={(e) => setNewSubject({ ...newSubject, semester: e.target.value })}
              className="w-full px-3 py-2 border rounded"
              required
            />
            <ModalActions onCancel={() => setIsAddModalOpen(false)} />
          </form>
        </Modal>
      )}
    </Card>
  );
};

const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md relative">
      <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">
        ✕
      </button>
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      {children}
    </div>
  </div>
);

const ModalActions = ({ onCancel }) => (
  <div className="flex justify-end space-x-2">
    <button
      type="button"
      onClick={onCancel}
      className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
    >
      Cancel
    </button>
    <button
      type="submit"
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
    >
      Submit
    </button>
  </div>
);

export default SubjectManagement;
