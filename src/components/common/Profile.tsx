
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

const API_BASE_URL = "http://127.0.0.1:8000";

interface ProfileProps {
  role: string;
  user: any;
}

const Profile = ({ role, user }: ProfileProps) => {
  const [formData, setFormData] = useState({
    email: user?.email || "",
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
  });
  
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(user?.profile_image || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setProfilePicture(selectedFile);
      
      // Create preview URL
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreviewUrl(objectUrl);
      
      // Free memory when this component is unmounted
      return () => URL.revokeObjectURL(objectUrl);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const formDataObj = new FormData();
      formDataObj.append("email", formData.email);
      formDataObj.append("first_name", formData.first_name);
      formDataObj.append("last_name", formData.last_name);
      
      if (profilePicture) {
        formDataObj.append("profile_picture", profilePicture);
      }

      // Different endpoints based on role
      const endpoint = role === "student" 
        ? `${API_BASE_URL}/student/update-profile/`
        : `${API_BASE_URL}/${role}/profile/`;
      
      const method = role === "student" ? "POST" : "PATCH";

      const response = await fetch(endpoint, {
        method: method,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: formDataObj,
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("Profile updated successfully");
        
        // Update user info in localStorage
        const updatedUser = { ...user, ...formData };
        if (data.data?.profile_image) {
          updatedUser.profile_image = data.data.profile_image;
        }
        localStorage.setItem("user", JSON.stringify(updatedUser));
      } else {
        setError(data.message || "Failed to update profile");
      }
    } catch (err) {
      setError("Error updating profile");
    } finally {
      setLoading(false);
    }
  };

  const getInitials = () => {
    const firstName = formData.first_name || user?.first_name || "";
    const lastName = formData.last_name || user?.last_name || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Edit Profile</CardTitle>
        <CardDescription>Update your profile information</CardDescription>
      </CardHeader>
      <CardContent>
        {error && <div className="bg-red-500 text-white p-2 rounded mb-4">{error}</div>}
        {success && <div className="bg-green-500 text-white p-2 rounded mb-4">{success}</div>}

        <div className="space-y-6">
          <div className="flex justify-center">
            <Avatar className="w-24 h-24">
              {previewUrl ? (
                <AvatarImage src={previewUrl} alt="Profile" />
              ) : (
                <AvatarFallback>{getInitials()}</AvatarFallback>
              )}
            </Avatar>
          </div>
          
          <div className="space-y-1">
            <label htmlFor="profile_picture" className="text-sm font-medium">Profile Picture</label>
            <Input
              id="profile_picture"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>
          
          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-medium">Email</label>
            <Input
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="email@example.com"
            />
          </div>
          
          <div className="space-y-1">
            <label htmlFor="first_name" className="text-sm font-medium">First Name</label>
            <Input
              id="first_name"
              name="first_name"
              value={formData.first_name}
              onChange={handleInputChange}
              placeholder="First Name"
            />
          </div>
          
          <div className="space-y-1">
            <label htmlFor="last_name" className="text-sm font-medium">Last Name</label>
            <Input
              id="last_name"
              name="last_name"
              value={formData.last_name}
              onChange={handleInputChange}
              placeholder="Last Name"
            />
          </div>
          
          <Button 
            className="w-full" 
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Updating..." : "Update Profile"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default Profile;
