import { Button } from "../ui/button";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { Card } from "../ui/card";
import { Bell, Clock, Users } from "lucide-react";

const announcements = [
  {
    title: "End Semester Examination Schedule",
    date: "2025-04-10",
    audience: "faculty, student",
    description:
      "The end semester examinations will commence from May 15th, 2025. All faculty are requested to submit question papers by April 30th.",
    priority: "high",
  },
  {
    title: "Faculty Meeting",
    date: "2025-04-08",
    audience: "faculty",
    description:
      "A faculty meeting is scheduled on April 20th, 2025 at 2:00 PM in the Conference Hall to discuss the upcoming accreditation visit.",
    priority: "medium",
  },
  {
    title: "Project Submission Deadline",
    date: "2025-04-05",
    audience: "faculty, student",
    description:
      "Final year project submissions are due by April 25th, 2025. All project guides are requested to ensure timely submissions.",
    priority: "medium",
  },
];

const AnnouncementsPage = () => {
  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Announcements</h1>
        <Button className="bg-blue-600 text-white hover:bg-blue-700 text-sm px-4 py-2">
          + New Announcement
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="bg-white shadow-sm p-1 rounded-md space-x-2">
          <TabsTrigger value="all" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-sm px-4 py-1 rounded-md">
            All
          </TabsTrigger>
          <TabsTrigger value="faculty" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-sm px-4 py-1 rounded-md">
            Faculty
          </TabsTrigger>
          <TabsTrigger value="students" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-sm px-4 py-1 rounded-md">
            Students
          </TabsTrigger>
          <TabsTrigger value="drafts" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-sm px-4 py-1 rounded-md">
            Drafts
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.map((announcement, index) => (
          <Card key={index} className="p-5 border-l-4 border-blue-600 shadow-sm bg-white rounded-lg">
            <div className="flex justify-between items-start gap-6">
              {/* Left */}
              <div className="flex-1">
                <div className="flex items-center gap-2 text-blue-600">
                  <Bell size={18} />
                  <h2 className="text-lg font-semibold">{announcement.title}</h2>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                  <div className="flex items-center gap-1">
                    <Clock size={14} /> {announcement.date}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users size={14} /> {announcement.audience}
                  </div>
                </div>
                <p className="mt-3 text-sm text-gray-800">{announcement.description}</p>
              </div>

              {/* Right */}
              <div className="flex flex-col items-end justify-between gap-3">
                <span
                  className={`text-xs font-medium px-3 py-1 rounded-full capitalize ${
                    announcement.priority === "high"
                      ? "bg-red-500 text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {announcement.priority}
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                  <Button variant="outline" size="sm">
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AnnouncementsPage;
