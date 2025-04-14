
import React, { useEffect, useState } from 'react';
import { Users, Building, BookOpen, School } from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { adminService } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/sonner';

interface AdminStats {
  total_students: number;
  total_faculty: number;
  total_hods: number;
  total_branches: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: 'active' | 'inactive';
}

interface Branch {
  id: string;
  name: string;
  hod: {
    name: string;
    id: string;
  };
  students_count: number;
  faculty_count: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await adminService.getStatsOverview();
        setStats(response.data.stats);
        setUsers(response.data.recent_users || []);
        setBranches(response.data.branches || []);
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
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <Button>New Announcement</Button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Students"
            value={stats.total_students}
            icon={<Users size={24} />}
          />
          <StatCard
            title="Total Faculty"
            value={stats.total_faculty}
            icon={<Users size={24} />}
            iconColor="text-green-500"
          />
          <StatCard
            title="Total HODs"
            value={stats.total_hods}
            icon={<BookOpen size={24} />}
            iconColor="text-purple-500"
          />
          <StatCard
            title="Total Branches"
            value={stats.total_branches}
            icon={<Building size={24} />}
            iconColor="text-orange-500"
          />
        </div>
      )}

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="user-enrollment">User Enrollment</TabsTrigger>
          <TabsTrigger value="branch-management">Branch Management</TabsTrigger>
          <TabsTrigger value="leave-management">Leave Management</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="pt-6">
          <h2 className="text-lg font-semibold mb-4">User Directory</h2>
          <div className="dashboard-card">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">{user.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.role === 'hod' ? 'bg-blue-100 text-blue-800' : 
                          user.role === 'faculty' ? 'bg-green-100 text-green-800' : 
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {user.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{user.department}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`status-badge ${user.status === 'active' ? 'active' : 'bg-red-100 text-red-800'}`}>
                          {user.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button className="text-blue-500 hover:text-blue-700 mr-3">Edit</button>
                        <button className="text-red-500 hover:text-red-700">Deactivate</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex justify-between">
              <span className="text-sm text-gray-500">Showing 5 of {users.length} users</span>
              <button className="text-sm text-blue-500 hover:underline">View All</button>
            </div>
          </div>

          <h2 className="text-lg font-semibold mb-4 mt-8">Branch Overview</h2>
          <div className="dashboard-card">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HOD</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Faculty</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {branches.map((branch) => (
                    <tr key={branch.id}>
                      <td className="px-6 py-4 whitespace-nowrap">{branch.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{branch.hod.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{branch.students_count}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{branch.faculty_count}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button className="text-blue-500 hover:text-blue-700">View Details</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="user-enrollment" className="pt-6">
          <h2 className="text-lg font-semibold mb-4">Enroll New User</h2>
          <div className="dashboard-card">
            {/* User enrollment form would go here */}
            <p className="text-center py-10 text-gray-500">User enrollment form here</p>
          </div>
        </TabsContent>

        <TabsContent value="branch-management" className="pt-6">
          <h2 className="text-lg font-semibold mb-4">Manage Branches</h2>
          <div className="dashboard-card">
            {/* Branch management interface would go here */}
            <p className="text-center py-10 text-gray-500">Branch management interface here</p>
          </div>
        </TabsContent>

        <TabsContent value="leave-management" className="pt-6">
          <h2 className="text-lg font-semibold mb-4">HOD Leave Approvals</h2>
          <div className="dashboard-card">
            {/* HOD leave approvals interface would go here */}
            <p className="text-center py-10 text-gray-500">HOD leave approvals interface here</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
