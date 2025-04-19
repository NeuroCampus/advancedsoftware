import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../ui/card";

const SectionManagement = () => {
  const [isAddSectionModalOpen, setIsAddSectionModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [filterValue, setFilterValue] = useState("");

  const [sections, setSections] = useState([
    { section: "A", semester: "Semester 1", students: 60, created: "04/10/2024" },
    { section: "B", semester: "Semester 1", students: 55, created: "04/10/2024" },
    { section: "C", semester: "Semester 1", students: 58, created: "04/10/2024" },
  ]);

  const handleEdit = (item) => {
    alert(`Edit section: ${item.section}`);
  };

  const handleDelete = (item) => {
    if (window.confirm("Are you sure you want to delete this section?")) {
      const updated = sections.filter((s) => s !== item);
      setSections(updated);
    }
  };

  const filteredSections = filterValue
    ? sections.filter((s) => s.section === filterValue)
    : sections;

  const totalItems = filteredSections.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedSections = filteredSections.slice(startIndex, endIndex);

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-gray-800">
          Section Management
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <select
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="">All Sections</option>
            {[...new Set(sections.map((s) => s.section))].map((val, idx) => (
              <option key={idx} value={val}>
                {val}
              </option>
            ))}
          </select>

          <button
            onClick={() => setIsAddSectionModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 transition text-white px-4 py-2 rounded-lg shadow"
          >
            Add Section
          </button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-100 text-gray-700 uppercase text-xs font-semibold">
              <tr>
                {["Section", "Semester", "Students", "Created", "Actions"].map((heading) => (
                  <th key={heading} className="px-4 py-3 text-left">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {paginatedSections.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-2">{item.section}</td>
                  <td className="px-4 py-2">{item.semester}</td>
                  <td className="px-4 py-2">{item.students}</td>
                  <td className="px-4 py-2">{item.created}</td>
                  <td className="px-4 py-2 flex gap-2">
                    <button
                      className="text-blue-600 hover:text-blue-800 transition"
                      onClick={() => handleEdit(item)}
                    >
                      ✏️
                    </button>
                    <button
                      className="text-red-600 hover:text-red-800 transition"
                      onClick={() => handleDelete(item)}
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
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
            >
              ← Prev
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
            >
              Next →
            </button>
          </div>
        </div>
      </CardContent>

      {isAddSectionModalOpen && (
        <Modal onClose={() => setIsAddSectionModalOpen(false)} title="Add New Section">
          <form className="space-y-4">
            <input
              type="text"
              placeholder="Section Name (e.g., A, B)"
              className="w-full px-3 py-2 border rounded"
            />
            <select className="w-full px-3 py-2 border rounded">
              <option>Select semester</option>
              {[...new Set(sections.map((s) => s.semester))].map((sem, i) => (
                <option key={i}>{sem}</option>
              ))}
            </select>
            <ModalActions onCancel={() => setIsAddSectionModalOpen(false)} />
          </form>
        </Modal>
      )}
    </Card>
  );
};

// Reusable Modal Component
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

// Modal action buttons
const ModalActions = ({ onCancel }) => (
  <div className="flex justify-end space-x-2">
    <button
      onClick={onCancel}
      type="button"
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

export default SectionManagement;
