
import React, { useEffect, useState } from 'react';
import { Clock, CalendarDays, BookOpen, FileText } from 'lucide-react';
import { studentService } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/components/ui/sonner';
import { Progress } from '@/components/ui/progress';

interface DashboardData {
  next_class: {
    subject: string;
    time: string;
    room: string;
  } | null;
  attendance_status: {
    average: number;
    subjects_below_threshold: number;
  };
  timetable: {
    subject: string;
    time: string;
    room: string;
  }[];
  announcements: {
    id: string;
    title: string;
    message: string;
    created_at: string;
    created_by: string;
  }[];
  unread_notifications: number;
}

const StudentDashboard = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await studentService.getDashboard();
        setDashboardData(response.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!dashboardData) {
    return <div>No dashboard data available</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Student Dashboard</h1>
        <Button>Submit Leave Request</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <Clock size={20} className="text-blue-500" />
                Next Class
              </h2>
              <span className="text-sm text-gray-500">
                {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
              </span>
            </div>
            {dashboardData.next_class ? (
              <div>
                <div className="text-2xl font-bold">{dashboardData.next_class.subject}</div>
                <div className="flex justify-between mt-2">
                  <div className="text-sm text-gray-500">
                    <span className="font-medium text-gray-700">{dashboardData.next_class.time}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    Room <span className="font-medium text-gray-700">{dashboardData.next_class.room}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">No more classes scheduled for today</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <CalendarDays size={20} className="text-green-500" />
                Attendance Status
              </h2>
              <Button variant="ghost" size="sm">View All</Button>
            </div>
            <div className="mb-2 flex justify-between">
              <span className="font-medium">Average Attendance</span>
              <span className={`font-bold ${dashboardData.attendance_status.average < 75 ? 'text-red-500' : 'text-green-500'}`}>
                {dashboardData.attendance_status.average}%
              </span>
            </div>
            <Progress value={dashboardData.attendance_status.average} className="h-2" />
            <div className="mt-4 text-sm">
              {dashboardData.attendance_status.subjects_below_threshold > 0 ? (
                <div className="flex items-center text-red-500">
                  <span>
                    {dashboardData.attendance_status.subjects_below_threshold} subjects below 75%
                  </span>
                </div>
              ) : (
                <div className="text-green-500">All subjects above attendance threshold</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <FileText size={20} className="text-purple-500" />
                Quick Actions
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="bg-blue-50 hover:bg-blue-100 border-blue-100 text-blue-700">
                View Timetable
              </Button>
              <Button variant="outline" className="bg-green-50 hover:bg-green-100 border-green-100 text-green-700">
                Check Attendance
              </Button>
              <Button variant="outline" className="bg-purple-50 hover:bg-purple-100 border-purple-100 text-purple-700">
                View Internal Marks
              </Button>
              <Button variant="outline" className="bg-orange-50 hover:bg-orange-100 border-orange-100 text-orange-700">
                Study Materials
              </Button>
              <Button variant="outline" className="bg-red-50 hover:bg-red-100 border-red-100 text-red-700">
                Submit Leave
              </Button>
              <Button variant="outline" className="bg-indigo-50 hover:bg-indigo-100 border-indigo-100 text-indigo-700">
                Upload Certificate
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <BookOpen size={20} className="text-blue-500" />
                Today's Schedule
              </h2>
              <Button variant="ghost" size="sm">Full Timetable</Button>
            </div>
            <div className="space-y-3">
              {dashboardData.timetable && dashboardData.timetable.length > 0 ? (
                dashboardData.timetable.map((cls, index) => (
                  <div key={index} className="flex justify-between items-center bg-gray-50 p-3 rounded-md">
                    <div>
                      <div className="font-medium">{cls.subject}</div>
                      <div className="text-sm text-gray-500">Room {cls.room}</div>
                    </div>
                    <div className="text-sm font-medium">{cls.time}</div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-gray-500">No classes scheduled for today</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <CalendarDays size={20} className="text-green-500" />
                Latest Announcements
              </h2>
              <Button variant="ghost" size="sm">View All</Button>
            </div>
            <div className="space-y-3">
              {dashboardData.announcements && dashboardData.announcements.length > 0 ? (
                dashboardData.announcements.map((announcement) => (
                  <div key={announcement.id} className="bg-gray-50 p-3 rounded-md">
                    <div className="font-medium">{announcement.title}</div>
                    <div className="text-sm text-gray-600 mt-1 line-clamp-2">{announcement.message}</div>
                    <div className="text-xs text-gray-500 mt-2">
                      {new Date(announcement.created_at).toLocaleDateString()} • {announcement.created_by}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-gray-500">No announcements available</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentDashboard;
