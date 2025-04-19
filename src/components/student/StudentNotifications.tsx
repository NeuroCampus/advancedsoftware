import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { Megaphone, Bell } from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
}

// Sample notifications (can be removed once API is connected)
const sampleNotifications: Notification[] = [
  {
    id: "1",
    title: "Internal Marks Released",
    message: "Your internal marks for Semester 4 have been published.",
  },
  {
    id: "2",
    title: "Assignment Deadline Extended",
    message: "The submission deadline for the DBMS assignment is now April 22.",
  },
  {
    id: "3",
    title: "Class Cancelled",
    message: "Tomorrow's Applied Mathematics lecture (10:00 AM) is cancelled.",
  },
];

const StudentNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call with sample data
    const fetchNotifications = async () => {
      setTimeout(() => {
        setNotifications(sampleNotifications); // Replace with real API response later
        setLoading(false);
      }, 1000);
    };

    fetchNotifications();
  }, []);

  if (loading) {
    return (
      <div className="w-full h-48 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            <CardTitle>Notifications</CardTitle>
          </div>
          <CardDescription>
            View all recent updates from your institution
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {notifications.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border p-4 hover:bg-accent transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="font-medium">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {item.message}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    New
                  </Badge>
                </div>
              </div>
            ))}

            {notifications.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="mx-auto h-8 w-8 mb-2" />
                <p>No notifications available</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentNotifications;
