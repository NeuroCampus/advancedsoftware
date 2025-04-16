
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

const API_BASE_URL = "http://127.0.0.1:8000";

const BulkUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file to upload");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Create FormData and append file
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_BASE_URL}/admin/bulk-upload-faculty/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("Faculty list uploaded successfully");
        setFile(null);
        // Reset file input
        const fileInput = document.getElementById("file") as HTMLInputElement;
        if (fileInput) {
          fileInput.value = "";
        }
      } else {
        setError(data.message || "Failed to upload file");
      }
    } catch (err) {
      setError("Network error while uploading file");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Bulk Upload Faculty</CardTitle>
        <CardDescription>Upload CSV/Excel file containing faculty details</CardDescription>
      </CardHeader>
      <CardContent>
        {error && <div className="bg-red-500 text-white p-2 rounded mb-4">{error}</div>}
        {success && <div className="bg-green-500 text-white p-2 rounded mb-4">{success}</div>}

        <div className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="file" className="text-sm font-medium">Upload File</label>
            <Input
              id="file"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
            />
            <p className="text-xs text-gray-500 mt-1">Allowed file types: CSV, Excel (.xlsx, .xls)</p>
          </div>
          
          <Button 
            className="w-full" 
            onClick={handleUpload}
            disabled={loading || !file}
          >
            {loading ? "Uploading..." : "Upload Faculty List"}
          </Button>
          
          <div className="text-sm text-gray-600 mt-4">
            <p className="font-medium">File Format Instructions:</p>
            <ul className="list-disc list-inside mt-1 space-y-1 pl-2">
              <li>First row should contain column headers</li>
              <li>Required columns: email, first_name, last_name</li>
              <li>Optional columns: department, designation</li>
              <li>File size limit: 5MB</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BulkUpload;
