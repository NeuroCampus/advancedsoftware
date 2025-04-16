
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

const API_BASE_URL = "http://127.0.0.1:8000";

const EnrollUser = () => {
  const [formData, setFormData] = useState({
    email: "",
    first_name: "",
    last_name: "",
    role: "hod",
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (value: string) => {
    setFormData((prev) => ({ ...prev, role: value }));
  };

  const handleSubmit = async () => {
    // Validate form
    if (!formData.email || !formData.first_name || !formData.last_name) {
      setError("All fields are required");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${API_BASE_URL}/admin/enroll-user/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("User enrolled successfully");
        // Reset form
        setFormData({
          email: "",
          first_name: "",
          last_name: "",
          role: "hod",
        });
      } else {
        setError(data.message || "Failed to enroll user");
      }
    } catch (err) {
      setError("Network error while enrolling user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Enroll New User</CardTitle>
        <CardDescription>Add a new HOD or Faculty</CardDescription>
      </CardHeader>
      <CardContent>
        {error && <div className="bg-red-500 text-white p-2 rounded mb-4">{error}</div>}
        {success && <div className="bg-green-500 text-white p-2 rounded mb-4">{success}</div>}

        <div className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-medium">Email</label>
            <Input
              id="email"
              name="email"
              placeholder="user@example.com"
              value={formData.email}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="space-y-1">
            <label htmlFor="first_name" className="text-sm font-medium">First Name</label>
            <Input
              id="first_name"
              name="first_name"
              placeholder="First Name"
              value={formData.first_name}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="space-y-1">
            <label htmlFor="last_name" className="text-sm font-medium">Last Name</label>
            <Input
              id="last_name"
              name="last_name"
              placeholder="Last Name"
              value={formData.last_name}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="space-y-1">
            <label htmlFor="role" className="text-sm font-medium">Role</label>
            <Select
              value={formData.role}
              onValueChange={handleRoleChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hod">HOD</SelectItem>
                <SelectItem value="teacher">Faculty/Teacher</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            className="w-full" 
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Enrolling..." : "Enroll User"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnrollUser;
