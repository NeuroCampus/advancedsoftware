
import React, { useEffect, useState } from 'react';
import { UsersRound, UserRound, BookOpen, AlertTriangle } from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { hodService } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/sonner';

interface DashboardStats {
  total_students: number;
  total_faculty: number;
  total_subjects: number;
  low_attendance_count: number;
}

interface LowAttendanceStudent {
  id: string;
  name: string;
  usn: string;
  semester: string;
  section: string;
  subject: string;
  attendance_percentage: number;
}

const HodDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [lowAttendanceStudents, setLowAttendanceStudents] = useState<LowAttendanceStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const statsResponse = await hodService.getDashboardStats();
        setStats(statsResponse.data);
        
        const lowAttendanceResponse = await hodService.getLowAttendanceStudents();
        setLowAttendanceStudents(lowAttendanceResponse.data);
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
        <h1 className="text-2xl font-bold">HOD Dashboard</h1>
        <Button>New Announcement</Button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Students"
            value={stats.total_students}
            icon={<UsersRound size={24} />}
          />
          <StatCard
            title="Total Faculty"
            value={stats.total_faculty}
            icon={<UserRound size={24} />}
            iconColor="text-green-500"
          />
          <StatCard
            title="Total Subjects"
            value={stats.total_subjects}
            icon={<BookOpen size={24} />}
            iconColor="text-purple-500"
          />
          <StatCard
            title="Low Attendance"
            value={stats.low_attendance_count}
            icon={<AlertTriangle size={24} />}
            iconColor="text-red-500"
          />
        </div>
      )}

      <Tabs defaultValue="low-attendance">
        <TabsList>
          <TabsTrigger value="low-attendance">Low Attendance Students</TabsTrigger>
          <TabsTrigger value="semester-management">Semester Management</TabsTrigger>
          <TabsTrigger value="faculty-assignments">Faculty Assignments</TabsTrigger>
          <TabsTrigger value="leave-management">Leave Management</TabsTrigger>
        </TabsList>
        
        <TabsContent value="low-attendance" className="pt-6">
          <h2 className="text-lg font-semibold mb-4">Students with Attendance Below 75%</h2>
          <div className="dashboard-card">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">USN</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Semester</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {lowAttendanceStudents.map((student) => (
                    <tr key={student.id}>
                      <td className="px-6 py-4 whitespace-nowrap">{student.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{student.usn}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{student.semester}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{student.section}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{student.subject}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-red-500 font-medium">{student.attendance_percentage}%</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button className="text-blue-500 hover:text-blue-700">Send Notice</button>
                      </td>
                    </tr>
                  ))}
                  {lowAttendanceStudents.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                        No students with low attendance
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="semester-management" className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold mb-4">Manage Semesters</h2>
              <div className="dashboard-card">
                {/* Semester management interface would go here */}
                <p className="text-center py-10 text-gray-500">Semester management interface here</p>
              </div>
            </div>
            
            <div>
              <h2 className="text-lg font-semibold mb-4">Manage Sections</h2>
              <div className="dashboard-card">
                {/* Section management interface would go here */}
                <p className="text-center py-10 text-gray-500">Section management interface here</p>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-4">Manage Students</h2>
            <div className="dashboard-card">
              {/* Student management interface would go here */}
              <p className="text-center py-10 text-gray-500">Student management interface here</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="faculty-assignments" className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold mb-4">Manage Subjects</h2>
              <div className="dashboard-card">
                {/* Subject management interface would go here */}
                <p className="text-center py-10 text-gray-500">Subject management interface here</p>
              </div>
            </div>
            
            <div>
              <h2 className="text-lg font-semibold mb-4">Faculty Assignments</h2>
              <div className="dashboard-card">
                {/* Faculty assignment interface would go here */}
                <p className="text-center py-10 text-gray-500">Faculty assignment interface here</p>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="leave-management" className="pt-6">
          <h2 className="text-lg font-semibold mb-4">Faculty Leave Requests</h2>
          <div className="dashboard-card">
            {/* Faculty leave management interface would go here */}
            <p className="text-center py-10 text-gray-500">Faculty leave management interface here</p>
          </div>

          <h2 className="text-lg font-semibold mb-4 mt-6">Apply for Leave</h2>
          <div className="dashboard-card">
            {/* HOD leave application form would go here */}
            <p className="text-center py-10 text-gray-500">HOD leave application form here</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HodDashboard;
