import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import { Camera, Upload, Check, Users, X } from 'lucide-react';
import Webcam from 'react-webcam';
import axios from 'axios';
import Header from '../../components/Header';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const TakeAttendancePage: React.FC = () => {
  const navigate = useNavigate();
  const { semester, section, subject, token, role, logout } = useUser();
  const [photos, setPhotos] = useState<File[]>([]);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [showCamera, setShowCamera] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    present?: string[];
    absent?: string[];
    sheetUrl?: string;
    facultyName?: string; // Added to store faculty name
  } | null>(null);
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const capturePhoto = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setCapturedImages([...capturedImages, imageSrc]);
        fetch(imageSrc)
          .then(res => res.blob())
          .then(blob => {
            const file = new File([blob], `class-${Date.now()}.jpg`, { type: 'image/jpeg' });
            setPhotos([...photos, file]);
          });
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setPhotos([...photos, ...newFiles]);
      newFiles.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => setCapturedImages(prev => [...prev, reader.result as string]);
        reader.readAsDataURL(file);
      });
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
    setCapturedImages(capturedImages.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (photos.length === 0) {
      setResult({ success: false, message: 'Please add at least one photo of the class' });
      return;
    }
    if (!token) {
      setResult({ success: false, message: 'Session expired. Please log in again.' });
      logout();
      navigate('/login');
      return;
    }
    if (role !== 'teacher') {
      setResult({ success: false, message: 'Only teachers can take attendance.' });
      return;
    }

    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('semester', semester || '');
    formData.append('section', section || '');
    formData.append('subject', subject || '');
    photos.forEach(photo => formData.append('class_images', photo));

    console.log('Submitting with:');
    console.log('Token:', token);
    console.log('Role:', role);
    console.log('FormData:', Object.fromEntries(formData.entries()));

    try {
      const response = await axios.post('http://localhost:8000/api/faculty/take-attendance/', formData, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      setResult({
        success: true,
        message: response.data.message,
        present: response.data.present_students,
        absent: response.data.absent_students,
        sheetUrl: response.data.sheet_url,
        facultyName: response.data.faculty_name, // Expecting backend to provide this
      });
    } catch (err: any) {
      console.log('Error Response:', err.response?.data);
      setResult({ success: false, message: err.response?.data?.message || 'Attendance failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setPhotos([]);
    setCapturedImages([]);
    setShowCamera(false);
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 flex flex-col">
      <Header />
      <main className="flex-grow p-6">
        <motion.div
          className="max-w-3xl mx-auto bg-white rounded-xl shadow-2xl p-8"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <h2 className="text-4xl font-extrabold text-gray-800 mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
            Take Attendance
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            Semester {semester} | Section {section} | Subject: {subject}
          </p>
          {result && (
            <motion.div
              className={`mb-6 p-4 rounded-lg ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <p className={`font-medium ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                {result.message} {result.success && result.facultyName && `(Taken by: ${result.facultyName})`}
              </p>
              {result.success && result.present && result.absent && (
                <div className="mt-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-medium text-gray-800 flex items-center mb-2">
                        <Users size={18} className="mr-2 text-green-600" /> Present Students ({result.present.length})
                      </h3>
                      <div className="bg-white p-3 rounded border border-gray-200 max-h-60 overflow-y-auto">
                        {result.present.length > 0 ? (
                          <ul className="list-disc list-inside">
                            {result.present.map((student, index) => (
                              <motion.li
                                key={index}
                                className="text-sm text-gray-700"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                              >
                                {student}
                              </motion.li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-gray-500">No students present</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800 flex items-center mb-2">
                        <Users size={18} className="mr-2 text-red-600" /> Absent Students ({result.absent.length})
                      </h3>
                      <div className="bg-white p-3 rounded border border-gray-200 max-h-60 overflow-y-auto">
                        {result.absent.length > 0 ? (
                          <ul className="list-disc list-inside">
                            {result.absent.map((student, index) => (
                              <motion.li
                                key={index}
                                className="text-sm text-gray-700"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                              >
                                {student}
                              </motion.li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-gray-500">No students absent</p>
                        )}
                      </div>
                    </div>
                  </div>
                  {result.sheetUrl && (
                    <motion.div
                      className="mt-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    >
                      <a
                        href={result.sheetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        View Attendance Sheet
                      </a>
                    </motion.div>
                  )}
                  {result.success && (
                    <motion.button
                      onClick={resetForm}
                      className="mt-4 text-blue-600 hover:text-blue-800"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.4 }}
                    >
                      Take Another Attendance
                    </motion.button>
                  )}
                </div>
              )}
            </motion.div>
          )}
          <form onSubmit={handleSubmit}>
            <motion.div
              className="mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <label className="block text-gray-700 font-medium mb-2">Class Photos (for Attendance)</label>
              <div className="flex flex-wrap gap-4 mb-4">
                {capturedImages.map((img, index) => (
                  <motion.div
                    key={index}
                    className="relative"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <img src={img} alt={`Class ${index + 1}`} className="w-24 h-24 object-cover rounded border border-gray-300" />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X size={16} />
                    </button>
                  </motion.div>
                ))}
              </div>
              <div className="flex flex-wrap gap-4">
                <motion.button
                  type="button"
                  onClick={() => setShowCamera(!showCamera)}
                  className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Camera size={18} className="mr-2" /> {showCamera ? 'Hide Camera' : 'Use Camera'}
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Upload size={18} className="mr-2" /> Upload Photos
                </motion.button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  multiple
                  className="hidden"
                />
              </div>
              {showCamera && (
                <motion.div
                  className="mt-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    className="w-full max-w-md rounded border border-gray-300"
                  />
                  <motion.button
                    type="button"
                    onClick={capturePhoto}
                    className="mt-2 flex items-center bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Camera size={18} className="mr-2" /> Capture Photo
                  </motion.button>
                </motion.div>
              )}
            </motion.div>
            <motion.div
              className="flex justify-end gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <motion.button
                type="button"
                onClick={() => navigate(-1)}
                className="flex items-center bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowLeft size={18} className="mr-2" /> Back
              </motion.button>
              <motion.button
                type="submit"
                disabled={loading}
                className={`flex items-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded transition-colors ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {loading ? 'Processing...' : <><Check size={18} className="mr-2" /> Take Attendance</>}
              </motion.button>
            </motion.div>
          </form>
        </motion.div>
      </main>
    </div>
  );
};

export default TakeAttendancePage;