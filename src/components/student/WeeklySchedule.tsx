
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Mock data - replace with actual API data
const mockSchedule = {
  Monday: [
    { time: "9:00 AM", subject: "Mathematics", room: "101", teacher: "Dr. Smith" },
    { time: "10:30 AM", subject: "Physics", room: "102", teacher: "Dr. Johnson" },
  ],
  Tuesday: [
    { time: "9:00 AM", subject: "Chemistry", room: "103", teacher: "Dr. Williams" },
    { time: "10:30 AM", subject: "Biology", room: "104", teacher: "Dr. Brown" },
  ],
  // ... add more days
};

const WeeklySchedule = () => {
  const [activeDay, setActiveDay] = useState("Monday");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Weekly Schedule</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={activeDay} onValueChange={setActiveDay}>
          <TabsList className="grid grid-cols-3 md:grid-cols-6 mb-4">
            {daysOfWeek.map((day) => (
              <TabsTrigger
                key={day}
                value={day}
                className="data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                {day.slice(0, 3)}
              </TabsTrigger>
            ))}
          </TabsList>

          {daysOfWeek.map((day) => (
            <TabsContent key={day} value={day}>
              <div className="space-y-4">
                {mockSchedule[day as keyof typeof mockSchedule]?.map((slot, index) => (
                  <div
                    key={index}
                    className="flex flex-col md:flex-row justify-between p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0 w-16 text-sm font-medium text-muted-foreground">
                        {slot.time}
                      </div>
                      <div>
                        <p className="font-medium">{slot.subject}</p>
                        <p className="text-sm text-muted-foreground">
                          {slot.teacher} • Room {slot.room}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {(!mockSchedule[day as keyof typeof mockSchedule] ||
                  mockSchedule[day as keyof typeof mockSchedule].length === 0) && (
                  <p className="text-center text-muted-foreground py-8">
                    No classes scheduled for {day}
                  </p>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default WeeklySchedule;
