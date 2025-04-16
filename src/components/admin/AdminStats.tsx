
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

const API_BASE_URL = "http://127.0.0.1:8000";

const AdminStats = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/admin/stats-overview/`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            "Content-Type": "application/json",
          },
        });
        
        const data = await response.json();
        
        if (data.success) {
          setStats(data.data);
        } else {
          setError(data.message || "Failed to fetch statistics");
        }
      } catch (err) {
        setError("Network error while fetching statistics");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <div className="text-center p-4">Loading statistics...</div>;
  }

  if (error) {
    return <div className="bg-red-500 text-white p-2 rounded">{error}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Students</CardTitle>
            <CardDescription>Enrolled in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.total_students || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Faculty</CardTitle>
            <CardDescription>Teaching staff</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.total_faculty || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total HODs</CardTitle>
            <CardDescription>Department heads</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.total_hods || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Branch Distribution</CardTitle>
          <CardDescription>Students and faculty per branch</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-left">Branch</th>
                  <th className="border p-2 text-left">Students</th>
                  <th className="border p-2 text-left">Faculty</th>
                </tr>
              </thead>
              <tbody>
                {stats?.branch_distribution?.map((branch: any, index: number) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border p-2">{branch.branch}</td>
                    <td className="border p-2">{branch.students}</td>
                    <td className="border p-2">{branch.faculty}</td>
                  </tr>
                )) || (
                  <tr>
                    <td colSpan={3} className="border p-2 text-center">No branch data available</td>
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

export default AdminStats;
