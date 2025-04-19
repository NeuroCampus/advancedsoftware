import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { Button } from "../ui/button";
import { CalendarDays, Filter, Download, X } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";

// Dummy data for all semesters
const allSemesterData: Record<string, string[][]> = {
  "1st Semester": [
    ["9:00-10:00", "Subject 1", "Subject 2", "Subject 3", "Subject 4", "Subject 5"],
    ["10:00-11:00", "Break", "Break", "Subject 4", "Break", "Subject 1"],
    ["11:15-12:15", "Break", "Subject 4", "Subject 5", "Break", "Subject 2"],
    ["12:15-1:15", "Break", "Subject 5", "Subject 1", "Break", "Break"],
    ["2:00-3:00", "Subject 5", "Break", "Subject 2", "Subject 3", "Subject 4"],
    ["3:00-4:00", "Break", "Subject 2", "Subject 3", "Break", "Subject 5"],
  ],
  "2nd Semester": [
    ["9:00-10:00", "Subject A", "Subject B", "Subject C", "Subject D", "Subject E"],
    ["10:00-11:00", "Break", "Subject C", "Break", "Break", "Subject B"],
    ["11:15-12:15", "Subject D", "Break", "Subject E", "Subject A", "Break"],
    ["12:15-1:15", "Subject E", "Subject A", "Break", "Subject C", "Break"],
    ["2:00-3:00", "Break", "Subject B", "Subject D", "Break", "Subject C"],
    ["3:00-4:00", "Subject A", "Break", "Break", "Subject E", "Subject D"],
  ],
  // ... add data for 3rd to 8th semester similarly
};

const semesters = Object.keys(allSemesterData);

const Timetable = () => {
  const [selectedSemester, setSelectedSemester] = useState("1st Semester");
  const [showFilterModal, setShowFilterModal] = useState(false);

  const data = allSemesterData[selectedSemester];

  const renderCell = (subject: string, index: number) => {
    if (subject === "Break") return <i className="text-muted-foreground">{subject}</i>;
    return (
      <div>
        <strong>{subject}</strong>
        <div className="text-sm text-muted-foreground">Prof. Smith</div>
        <div className="text-sm text-muted-foreground">Room {100 + index}</div>
      </div>
    );
  };

  const exportToCSV = () => {
    const csvRows = [
      ["Time/Day", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      ...data.map((row) => row.join(",")),
    ];

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedSemester.replace(" ", "_").toLowerCase()}_timetable.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

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
        <Tabs defaultValue="1st Semester" value={selectedSemester} onValueChange={setSelectedSemester}>
          <TabsList className="mb-4 flex-wrap">
            {semesters.map((sem) => (
              <TabsTrigger key={sem} value={sem}>
                {sem}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <CalendarDays className="w-5 h-5" /> {selectedSemester} Timetable
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
                  {data.map((row, rowIndex) => (
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
        </Tabs>
      </CardContent>

      {/* Filter Modal */}
      <Dialog open={showFilterModal} onOpenChange={setShowFilterModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Filter Options
              <Button variant="ghost" size="icon" onClick={() => setShowFilterModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground">Filtering options will go here (e.g., by subject, faculty, room).</div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default Timetable;
