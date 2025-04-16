import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";

const API_BASE_URL = "http://127.0.0.1:8000";

const FaceRecognition = () => {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = e.target.files;
      setSelectedFiles(files);
      
      // Create and display previews
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const objectUrl = URL.createObjectURL(files[i]);
        urls.push(objectUrl);
      }
      setPreviewUrls(urls);
    }
  };

  const handleUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      setError("Please select at least one image");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      for (let i = 0; i < selectedFiles.length; i++) {
        formData.append("images", selectedFiles[i]);
      }

      const response = await fetch(`${API_BASE_URL}/student/upload-face-encodings/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("Face encodings registered successfully");
        setSelectedFiles(null);
        setPreviewUrls([]);
        // Reset file input
        const fileInput = document.getElementById("face-images") as HTMLInputElement;
        if (fileInput) {
          fileInput.value = "";
        }
      } else {
        setError(data.message || "Failed to upload face images");
      }
    } catch (err) {
      setError("Network error while uploading face images");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Face Recognition</CardTitle>
        <CardDescription>Upload your face images for attendance recognition</CardDescription>
      </CardHeader>
      <CardContent>
        {error && <div className="bg-red-500 text-white p-2 rounded mb-4">{error}</div>}
        {success && <div className="bg-green-500 text-white p-2 rounded mb-4">{success}</div>}

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="face-images" className="block text-sm font-medium">
              Upload Face Images (3-5 recommended)
            </label>
            <input
              id="face-images"
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
            <p className="text-xs text-gray-500">
              Upload clear images of your face from different angles. JPG or PNG format recommended.
            </p>
          </div>

          {previewUrls.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2">Selected Images:</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {previewUrls.map((url, index) => (
                  <div key={index} className="relative">
                    <img
                      src={url}
                      alt={`Face ${index + 1}`}
                      className="w-full h-32 object-cover rounded"
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {previewUrls.length} images selected
              </p>
            </div>
          )}

          <Button
            onClick={handleUpload}
            disabled={loading || !selectedFiles}
            className="w-full"
          >
            {loading ? "Uploading..." : "Upload Images"}
          </Button>

          <div className="bg-blue-50 p-4 rounded text-sm">
            <h3 className="font-medium text-blue-800 mb-1">Why we need your face images:</h3>
            <p className="text-blue-600">
              These images will be used for automatic attendance marking using facial recognition.
              Your images will be securely stored and only used for attendance purposes.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FaceRecognition;
