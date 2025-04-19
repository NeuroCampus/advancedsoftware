import { useState } from "react";
import {
  FileText,
  FileBarChart,
  FileCode,
  FileSpreadsheet,
  Download,
  Filter,
  Bookmark,
  BookmarkCheck,
  Clock,
} from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils"; // Optional, used to conditionally join classes

const initialMaterials = [
  {
    title: "Database Normalization",
    subject: "Database Systems",
    uploaded: "Today, 10:30 AM",
    size: "2.3 MB",
    type: "pdf",
    bookmarked: true,
  },
  {
    title: "TCP/IP Protocol Suite",
    subject: "Computer Networks",
    uploaded: "Yesterday, 2:15 PM",
    size: "5.7 MB",
    type: "ppt",
    bookmarked: false,
  },
  {
    title: "Binary Search Trees",
    subject: "Data Structures",
    uploaded: "2 days ago",
    size: "4.5 MB",
    type: "doc",
    bookmarked: true,
  },
  {
    title: "Process Scheduling",
    subject: "Operating Systems",
    uploaded: "3 days ago",
    size: "1.8 MB",
    type: "pdf",
    bookmarked: false,
  },
  {
    title: "Entity Relationship Diagrams",
    subject: "Database Systems",
    uploaded: "4 days ago",
    size: "3.2 MB",
    type: "pdf",
    bookmarked: false,
  },
  {
    title: "Sorting Algorithms",
    subject: "Data Structures",
    uploaded: "5 days ago",
    size: "3.8 MB",
    type: "doc",
    bookmarked: true,
  },
  {
    title: "OSI Model & TCP/IP",
    subject: "Computer Networks",
    uploaded: "1 week ago",
    size: "4.3 MB",
    type: "ppt",
    bookmarked: false,
  },
  {
    title: "Memory Management",
    subject: "Operating Systems",
    uploaded: "1 week ago",
    size: "2.5 MB",
    type: "pdf",
    bookmarked: false,
  },
];

const getFileIcon = (type: string) => {
  switch (type) {
    case "pdf":
      return <FileText className="text-red-500 w-5 h-5" />;
    case "ppt":
      return <FileBarChart className="text-orange-500 w-5 h-5" />;
    case "doc":
      return <FileSpreadsheet className="text-blue-500 w-5 h-5" />;
    default:
      return <FileCode className="text-gray-500 w-5 h-5" />;
  }
};

const getAllSubjects = () => [
  "All Subjects",
  ...Array.from(new Set(initialMaterials.map((m) => m.subject))),
];

const getAllTypes = () => [
  "All Types",
  ...Array.from(new Set(initialMaterials.map((m) => m.type))),
];

const StudentStudyMaterial = () => {
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("All Subjects");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [viewBookmarked, setViewBookmarked] = useState(false);
  const [materials, setMaterials] = useState(initialMaterials);

  const toggleBookmark = (index: number) => {
    const updated = [...materials];
    updated[index].bookmarked = !updated[index].bookmarked;
    setMaterials(updated);
  };

  const filteredMaterials = materials.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.subject.toLowerCase().includes(search.toLowerCase());
    const matchesSubject =
      subjectFilter === "All Subjects" || item.subject === subjectFilter;
    const matchesType = typeFilter === "All Types" || item.type === typeFilter;
    const matchesBookmark = !viewBookmarked || item.bookmarked;

    return matchesSearch && matchesSubject && matchesType && matchesBookmark;
  });

  return (
    <div className="p-6 space-y-6 text-gray-800">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Study Materials</h2>
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            className={cn(
              "flex items-center space-x-1 text-sm",
              !viewBookmarked && "text-black font-medium"
            )}
            onClick={() => setViewBookmarked(false)}
          >
            <Clock className="w-4 h-4" />
            <span>Recent</span>
          </Button>
          <Button
            variant="ghost"
            className={cn(
              "flex items-center space-x-1 text-sm",
              viewBookmarked && "text-black font-medium"
            )}
            onClick={() => setViewBookmarked(true)}
          >
            <Bookmark className="w-4 h-4" />
            <span>Bookmarked</span>
          </Button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-wrap gap-2 justify-between items-center">
        <Input
          placeholder="Search for study materials..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
        <div className="flex items-center space-x-2">
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
          >
            {getAllSubjects().map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
          >
            {getAllTypes().map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Materials Table */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm text-left">
              <thead className="bg-gray-100 text-gray-600 font-medium">
                <tr>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Uploaded</th>
                  <th className="px-4 py-3">Size</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredMaterials.length > 0 ? (
                  filteredMaterials.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">{getFileIcon(item.type)}</td>
                      <td className="px-4 py-3">
                        <a href="#" className="text-blue-600 hover:underline">
                          {item.title}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{item.subject}</td>
                      <td className="px-4 py-3 text-gray-600">{item.uploaded}</td>
                      <td className="px-4 py-3 text-gray-600">{item.size}</td>
                      <td className="px-4 py-3 flex space-x-2">
                        <Button size="icon" variant="ghost">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => toggleBookmark(materials.indexOf(item))}
                        >
                          {item.bookmarked ? (
                            <BookmarkCheck className="h-4 w-4 text-yellow-500" />
                          ) : (
                            <Bookmark className="h-4 w-4" />
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-gray-500">
                      No study materials found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentStudyMaterial;
