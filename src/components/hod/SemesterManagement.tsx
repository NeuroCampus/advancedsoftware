import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../ui/card";

const SemesterManagement = () => {
  const [isSemesterView, setIsSemesterView] = useState(true);
  const [isAddSemesterModalOpen, setIsAddSemesterModalOpen] = useState(false);
  const [isAddSectionModalOpen, setIsAddSectionModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [filterValue, setFilterValue] = useState("");

  const handleToggleView = (view) => {
    setIsSemesterView(view === "semesters");
    setFilterValue("");
    setCurrentPage(1);
  };
const [semesters, setSemesters] = useState([
    { semester: "Semester 1", academicYear: "2024-2025", status: "Active", created: "04/10/2024" },
    { semester: "Semester 2", academicYear: "2024-2025", status: "Inactive", created: "04/10/2024" },
    { semester: "Semester 3", academicYear: "2023-2024", status: "Inactive", created: "04/10/2023" },
  ]);

  const [sections, setSections] = useState([
    { section: "A", semester: "Semester 1", students: 60, created: "04/10/2024" },
    { section: "B", semester: "Semester 1", students: 55, created: "04/10/2024" },
    { section: "C", semester: "Semester 1", students: 58, created: "04/10/2024" },
  ]);

  const handleEdit = (type, index) => {
    alert(`Edit ${type} at index ${index}`);
  };

  const handleDelete = (type, index) => {
    if (window.confirm("Are you sure you want to delete this entry?")) {
      if (type === "semester") {
        const updated = [...semesters];
        updated.splice(index, 1);
        setSemesters(updated);
      } else {
        const updated = [...sections];
        updated.splice(index, 1);
        setSections(updated);
      }
    }
  };

  const handlePageChange = (page) => setCurrentPage(page);

  const getPaginatedData = (data) => {
    const filtered = data.filter((item) => {
      return isSemesterView
        ? item.academicYear.includes(filterValue)
        : item.section.toLowerCase().includes(filterValue.toLowerCase());
    });
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filtered.slice(startIndex, startIndex + rowsPerPage);
  };

  const filteredData = isSemesterView ? semesters : sections;
  const paginatedData = getPaginatedData(filteredData);

  // Filter data based on filterValue
const filteredSemesters = filterValue
? semesters.filter((s) => s.academicYear === filterValue)
: semesters;

const filteredSections = filterValue
? sections.filter((s) => s.section === filterValue)
: sections;

// Paginate filtered data
const totalItems = isSemesterView ? filteredSemesters.length : filteredSections.length;
const totalPages = Math.ceil(totalItems / rowsPerPage);
const startIndex = (currentPage - 1) * rowsPerPage;
const endIndex = startIndex + rowsPerPage;

const paginatedSemesters = filteredSemesters.slice(startIndex, endIndex);
const paginatedSections = filteredSections.slice(startIndex, endIndex);

  
  return (
    <Card className="shadow-xl">
      <CardHeader>
        <div className="flex justify-between items-center flex-wrap gap-2">
          <CardTitle className="text-xl font-semibold text-gray-800">
            Academic Structure Management
          </CardTitle>
          <div className="flex space-x-2">
            <button
              onClick={() => handleToggleView("semesters")}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                isSemesterView
                  ? "bg-blue-600 text-white shadow"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              }`}
            >
              Semesters
            </button>
            <button
              onClick={() => handleToggleView("sections")}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                !isSemesterView
                  ? "bg-blue-600 text-white shadow"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              }`}
            >
              Sections
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <select
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="">{isSemesterView ? "All Years" : "All Sections"}</option>
            {(isSemesterView
              ? [...new Set(semesters.map((s) => s.academicYear))]
              : [...new Set(sections.map((s) => s.section))]
            ).map((val, idx) => (
              <option key={idx} value={val}>
                {val}
              </option>
            ))}
          </select>
  
          <button
            onClick={() =>
              isSemesterView
                ? setIsAddSemesterModalOpen(true)
                : setIsAddSectionModalOpen(true)
            }
            className="bg-blue-600 hover:bg-blue-700 transition text-white px-4 py-2 rounded-lg shadow"
          >
            {isSemesterView ? "Add Semester" : "Add Section"}
          </button>
        </div>
  
        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-100 text-gray-700 uppercase text-xs font-semibold">
              <tr>
                {(isSemesterView
                  ? ["Semester", "Academic Year", "Status", "Created", "Actions"]
                  : ["Section", "Semester", "Students", "Created", "Actions"]
                ).map((heading) => (
                  <th key={heading} className="px-4 py-3 text-left">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {(isSemesterView ? paginatedSemesters : paginatedSections).map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  {isSemesterView ? (
                    <>
                      <td className="px-4 py-2">{item.semester}</td>
                      <td className="px-4 py-2">{item.academicYear}</td>
                      <td className="px-4 py-2">
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                            item.status === "Active"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-2">{item.created}</td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-2">{item.section}</td>
                      <td className="px-4 py-2">{item.semester}</td>
                      <td className="px-4 py-2">{item.students}</td>
                      <td className="px-4 py-2">{item.created}</td>
                    </>
                  )}
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
  
        {/* Pagination */}
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
  
      {/* Add Semester Modal */}
      {isAddSemesterModalOpen && (
        <Modal onClose={() => setIsAddSemesterModalOpen(false)} title="Add New Semester">
          <form className="space-y-4">
            <input
              type="number"
              placeholder="Semester Number"
              className="w-full px-3 py-2 border rounded"
            />
            <input
              type="text"
              placeholder="Academic Year (e.g., 2024-2025)"
              className="w-full px-3 py-2 border rounded"
            />
            <ModalActions onCancel={() => setIsAddSemesterModalOpen(false)} />
          </form>
        </Modal>
      )}
  
      {/* Add Section Modal */}
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
              {semesters.map((s, i) => (
                <option key={i}>{s.semester}</option>
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

export default SemesterManagement;
