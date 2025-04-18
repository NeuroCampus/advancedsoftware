import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Student {
  name: string;
  usn: string;
  semester: string;
  section: string;
  subject: string;
  attendance: number;
}

const LowAttendance = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [filtered, setFiltered] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [semesterFilter, setSemesterFilter] = useState<string>("All");
  const [sectionFilter, setSectionFilter] = useState<string>("All");

  useEffect(() => {
    const fetchLowAttendance = async () => {
      try {
        const dummyData: Student[] = [
          {
            name: "Akhil M",
            usn: "1AM21CS001",
            semester: "6",
            section: "A",
            subject: "AI",
            attendance: 68,
          },
          {
            name: "Bhavana S",
            usn: "1AM21CS021",
            semester: "6",
            section: "B",
            subject: "ML",
            attendance: 72,
          },
          {
            name: "Charan P",
            usn: "1AM21CS045",
            semester: "5",
            section: "A",
            subject: "OS",
            attendance: 69,
          },
        ];
        setStudents(dummyData);
        setFiltered(dummyData);
      } catch (err) {
        console.error("Error fetching data");
      } finally {
        setLoading(false);
      }
    };

    fetchLowAttendance();
  }, []);

  const handleFilter = () => {
    let temp = [...students];
    if (semesterFilter !== "All") {
      temp = temp.filter((s) => s.semester === semesterFilter);
    }
    if (sectionFilter !== "All") {
      temp = temp.filter((s) => s.section === sectionFilter);
    }
    setFiltered(temp);
  };

  const handleNotify = (student: Student) => {
    alert(`Notification sent to ${student.name} (${student.usn})`);
  };

  const handleNotifyAll = () => {
    if (filtered.length === 0) {
      alert("No students to notify.");
      return;
    }
    filtered.forEach((student) => {
      console.log(`Notified: ${student.name} (${student.usn})`);
    });
    alert(`Notification sent to ${filtered.length} students.`);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Low Attendance Students", 14, 15);
    const tableColumn = ["Name", "USN", "Semester", "Section", "Subject", "Attendance"];
    const tableRows = filtered.map((s) => [
      s.name,
      s.usn,
      s.semester,
      s.section,
      s.subject,
      `${s.attendance}%`,
    ]);
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      styles: { fontSize: 10 },
    });
    doc.save("low_attendance_students.pdf");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
    <div className="w-full bg-white rounded-2xl shadow-md p-6 h-full flex flex-col">
      <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-6">
          Low Attendance Students
        </h2>

        <div className="flex flex-wrap gap-4 mb-6 items-end">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-600 mb-1">Semester</label>
            <select
              className="border border-gray-300 rounded-md px-3 py-2 min-w-[120px]"
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
            >
              <option value="All">All</option>
              <option value="5">5</option>
              <option value="6">6</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-600 mb-1">Section</label>
            <select
              className="border border-gray-300 rounded-md px-3 py-2 min-w-[120px]"
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
            >
              <option value="All">All</option>
              <option value="A">A</option>
              <option value="B">B</option>
            </select>
          </div>

          <div className="flex gap-2 flex-wrap mt-4 md:mt-0">
            <button
              onClick={handleFilter}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm shadow-md"
            >
              Apply Filters
            </button>
            <button
              onClick={handleNotifyAll}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md text-sm shadow-md"
            >
              Notify All
            </button>
            <button
              onClick={exportPDF}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm shadow-md"
            >
              Export PDF
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-blue-600 text-lg font-medium">Loading...</p>
        ) : (
          <div className="overflow-auto rounded-xl border border-gray-200 flex-grow">
            <table className="min-w-full bg-white rounded-xl">
              <thead className="bg-gray-100 text-gray-700 text-sm uppercase sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">USN</th>
                  <th className="px-4 py-3 text-left">Semester</th>
                  <th className="px-4 py-3 text-left">Section</th>
                  <th className="px-4 py-3 text-left">Subject</th>
                  <th className="px-4 py-3 text-left">Attendance (%)</th>
                  <th className="px-4 py-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-6 text-gray-500">
                      No students with low attendance
                    </td>
                  </tr>
                ) : (
                  filtered.map((student, idx) => (
                    <tr
                      key={idx}
                      className="border-t border-gray-200 hover:bg-gray-50 transition-all"
                    >
                      <td className="px-4 py-3">{student.name}</td>
                      <td className="px-4 py-3">{student.usn}</td>
                      <td className="px-4 py-3">{student.semester}</td>
                      <td className="px-4 py-3">{student.section}</td>
                      <td className="px-4 py-3">{student.subject}</td>
                      <td className="px-4 py-3 text-red-600 font-semibold">
                        {student.attendance}%
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleNotify(student)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-md text-xs"
                        >
                          Notify
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default LowAttendance;
