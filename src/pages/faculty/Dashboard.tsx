
import React, { useEffect, useState } from 'react';
import { Clock, BookOpen, Users, ClipboardCheck } from 'lucide-react';
import { facultyService } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/components/ui/sonner';

interface TodayClass {
  subject: string;
  time: string;
  room: string;
  section: string;
  semester: string;
}

interface AttendanceSnapshot {
  subject: string;
  percentage: number;
}

interface ProctorStudent {
  id: string;
  name: string;
  usn: string;
  attendance_percentage: number;
  pending_requests: number;
}

const FacultyDashboard = () => {
  const [todayClasses, setTodayClasses] = useState<TodayClass[]>([]);
  const [attendanceSnapshots, setAttendanceSnapshots] = useState<AttendanceSnapshot[]>([]);
  const [proctorStudents, setProctorStudents] = useState<ProctorStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await facultyService.getDashboard();
        setTodayClasses(response.data.today_classes || []);
        setAttendanceSnapshots(response.data.attendance_snapshot || []);
        
        const proctorResponse = await facultyService.getProctorStudents();
        setProctorStudents(proctorResponse.data || []);
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Faculty Dashboard</h1>
        <div className="space-x-2">
          <Button variant="outline">Apply Leave</Button>
          <Button>Take Attendance</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <Clock size={20} className="text-blue-500" />
                Today's Classes
              </h2>
            </div>
            <div className="space-y-4">
              {todayClasses.length > 0 ? (
                todayClasses.map((cls, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-md">
                    <div className="flex justify-between">
                      <div className="font-medium">{cls.subject}</div>
                      <div className="text-sm">{cls.time}</div>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      Semester {cls.semester}, Section {cls.section} • Room {cls.room}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-gray-500">No classes scheduled today</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <BookOpen size={20} className="text-green-500" />
                Attendance Snapshot
              </h2>
              <Button variant="ghost" size="sm">View All</Button>
            </div>
            <div className="space-y-4">
              {attendanceSnapshots.length > 0 ? (
                attendanceSnapshots.map((snapshot, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>{snapshot.subject}</div>
                    <div className={`font-medium ${snapshot.percentage < 75 ? 'text-red-500' : 'text-green-500'}`}>
                      {snapshot.percentage}%
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-gray-500">No attendance data available</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <ClipboardCheck size={20} className="text-purple-500" />
                Quick Actions
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="bg-blue-50 hover:bg-blue-100 border-blue-100 text-blue-700">
                Take Attendance
              </Button>
              <Button variant="outline" className="bg-green-50 hover:bg-green-100 border-green-100 text-green-700">
                Upload Marks
              </Button>
              <Button variant="outline" className="bg-purple-50 hover:bg-purple-100 border-purple-100 text-purple-700">
                View Timetable
              </Button>
              <Button variant="outline" className="bg-orange-50 hover:bg-orange-100 border-orange-100 text-orange-700">
                Schedule Mentoring
              </Button>
              <Button variant="outline" className="bg-red-50 hover:bg-red-100 border-red-100 text-red-700">
                Apply Leave
              </Button>
              <Button variant="outline" className="bg-indigo-50 hover:bg-indigo-100 border-indigo-100 text-indigo-700">
                Send Announcement
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Proctor Students</h2>
        <div className="dashboard-card">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">USN</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pending Requests</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {proctorStudents.map((student) => (
                  <tr key={student.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{student.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{student.usn}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`font-medium ${student.attendance_percentage < 75 ? 'text-red-500' : 'text-green-500'}`}>
                        {student.attendance_percentage}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {student.pending_requests > 0 ? (
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                          {student.pending_requests} pending
                        </span>
                      ) : (
                        <span className="text-gray-500">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button className="text-blue-500 hover:text-blue-700 mr-3">View Details</button>
                      <button className="text-green-500 hover:text-green-700">Chat</button>
                    </td>
                  </tr>
                ))}
                {proctorStudents.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                      No proctor students assigned
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {proctorStudents.length > 5 && (
            <div className="mt-3 flex justify-between px-6 py-3">
              <span className="text-sm text-gray-500">Showing 5 of {proctorStudents.length} students</span>
              <button className="text-sm text-blue-500 hover:underline">View All</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FacultyDashboard;
