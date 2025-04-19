import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Button } from "../ui/button";
import { CalendarDays, Download, Filter } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";

// Dummy data for one semester
const timetableData = [
  ["9:00-10:00", "Math", "Physics", "Chemistry", "English", "Biology"],
  ["10:00-11:00", "Break", "Break", "Math", "Break", "Physics"],
  ["11:15-12:15", "Break", "Math", "English", "Break", "Chemistry"],
  ["12:15-1:15", "Break", "English", "Biology", "Break", "Break"],
  ["2:00-3:00", "Biology", "Break", "Physics", "Chemistry", "Math"],
  ["3:00-4:00", "Break", "Physics", "Chemistry", "Break", "Biology"],
];

const facultyRoomMap: Record<string, { faculty: string; room: string }> = {
  Math: { faculty: "Dr. Alan", room: "101" },
  Physics: { faculty: "Dr. Brian", room: "102" },
  Chemistry: { faculty: "Dr. Claire", room: "103" },
  English: { faculty: "Prof. Diana", room: "104" },
  Biology: { faculty: "Dr. Eva", room: "105" },
};

const getUniqueSubjects = () => {
  const flat = timetableData.flat().filter((v) => v !== "Break" && !v.includes(":"));
  return [...new Set(flat)];
};

const StudentTimetable = () => {
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [facultyFilter, setFacultyFilter] = useState("all");
  const [roomFilter, setRoomFilter] = useState("all");

  const filterCell = (subject: string): boolean => {
    if (subject === "Break") return true;
    const faculty = facultyRoomMap[subject]?.faculty || "";
    const room = facultyRoomMap[subject]?.room || "";

    return (
      (subjectFilter === "all" || subject === subjectFilter) &&
      (facultyFilter === "all" || faculty === facultyFilter) &&
      (roomFilter === "all" || room === roomFilter)
    );
  };

  const renderCell = (subject: string, index: number) => {
    if (!filterCell(subject)) return null;

    if (subject === "Break") {
      return <i className="text-muted-foreground">Break</i>;
    }

    const faculty = facultyRoomMap[subject]?.faculty || "Prof. Smith";
    const room = facultyRoomMap[subject]?.room || `Room ${100 + index}`;

    return (
      <div>
        <strong>{subject}</strong>
        <div className="text-sm text-muted-foreground">{faculty}</div>
        <div className="text-sm text-muted-foreground">{room}</div>
      </div>
    );
  };

  const exportToCSV = () => {
    const csvRows = [
      ["Time/Day", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      ...timetableData.map((row) => row.join(",")),
    ];

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `timetable.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSubjectFilter("all");
    setFacultyFilter("all");
    setRoomFilter("all");
  };

  const uniqueSubjects = getUniqueSubjects();
  const uniqueFaculty = [...new Set(Object.values(facultyRoomMap).map((f) => f.faculty))];
  const uniqueRooms = [...new Set(Object.values(facultyRoomMap).map((f) => f.room))];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Timetable</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowFilterModal(true)}>
            <Filter className="w-4 h-4 mr-2" /> Filter
          </Button>
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <CalendarDays className="w-5 h-5" /> 1st Semester Timetable
            </h2>
            <span className="text-sm text-muted-foreground">Section A</span>
          </div>

          <ScrollArea className="w-full overflow-auto">
            <table className="w-full border text-sm">
              <thead>
                <tr className="bg-muted">
                  <th className="text-left p-2">Time/Day</th>
                  <th className="text-left p-2">Monday</th>
                  <th className="text-left p-2">Tuesday</th>
                  <th className="text-left p-2">Wednesday</th>
                  <th className="text-left p-2">Thursday</th>
                  <th className="text-left p-2">Friday</th>
                </tr>
              </thead>
              <tbody>
                {timetableData.map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-t">
                    <td className="p-2 font-medium">{row[0]}</td>
                    {row.slice(1).map((cell, colIndex) => (
                      <td key={colIndex} className="p-2 align-top">
                        {renderCell(cell, rowIndex * 5 + colIndex)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollArea>
        </div>
      </CardContent>

      {/* Filter Modal */}
      <Dialog open={showFilterModal} onOpenChange={setShowFilterModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filter Timetable</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Subject</label>
              <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {uniqueSubjects.map((subj) => (
                    <SelectItem key={subj} value={subj}>
                      {subj}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Faculty</label>
              <Select value={facultyFilter} onValueChange={setFacultyFilter}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select faculty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {uniqueFaculty.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Room</label>
              <Select value={roomFilter} onValueChange={setRoomFilter}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select room" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {uniqueRooms.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="secondary" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default StudentTimetable;
