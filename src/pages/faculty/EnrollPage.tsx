import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import { Camera, Upload, Check, X, FileText } from 'lucide-react';
import Webcam from 'react-webcam';
import axios from 'axios';
import Header from '../../components/Header';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

// Define TypeScript interface for bulkMessage
interface BulkMessage {
  text: string;
  type: '' | 'success' | 'error';
  details: {
    enrolled?: { name: string; usn: string }[];
    updated?: { name: string; usn: string }[];  // Added for updated students
    warnings?: string[];
  } | null;
}

const EnrollPage: React.FC = () => {
  const navigate = useNavigate();
  const { semester, section, token, role, logout } = useUser();
  const [name, setName] = useState('');
  const [usn, setUsn] = useState('');
  const [email, setEmail] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [showCamera, setShowCamera] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [existingStudents, setExistingStudents] = useState<{ usn: string; name: string; email: string }[]>([]);
  const [showBulkEnroll, setShowBulkEnroll] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkMessage, setBulkMessage] = useState<BulkMessage>({ text: '', type: '', details: null });
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bulkFileInputRef = useRef<HTMLInputElement>(null);

  // Fetch existing students for the current semester and section
  useEffect(() => {
    const fetchStudents = async () => {
      if (!token || !semester || !section) return;
      try {
        const response = await axios.get('http://localhost:8000/api/faculty/students/', {
          headers: { 'Authorization': `Bearer ${token}` },
          params: { semester, section },
        });
        if (response.data.success) {
          setExistingStudents(response.data.students);
        }
      } catch (err) {
        console.error('Failed to fetch students:', err);
      }
    };
    fetchStudents();
  }, [token, semester, section]);

  // Clear messages after 4 seconds
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => setMessage({ text: '', type: '' }), 4000);
      return () => clearTimeout(timer);
    }
  }, [message.text]);

  useEffect(() => {
    if (bulkMessage.text) {
      const timer = setTimeout(() => setBulkMessage({ text: '', type: '', details: null }), 10000);
      return () => clearTimeout(timer);
    }
  }, [bulkMessage.text]);

  const capturePhoto = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setCapturedImages([...capturedImages, imageSrc]);
        fetch(imageSrc)
          .then(res => res.blob())
          .then(blob => {
            const file = new File([blob], `webcam-${Date.now()}.jpg`, { type: 'image/jpeg' });
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

  const handleUsnChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedUsn = e.target.value;
    setUsn(selectedUsn);
    const student = existingStudents.find(s => s.usn === selectedUsn);
    if (student) {
      setName(student.name);
      setEmail(student.email);
    } else {
      setName('');
      setEmail('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (photos.length === 0) {
      setMessage({ text: 'Please add at least one photo', type: 'error' });
      return;
    }
    if (!usn) {
      setMessage({ text: 'Please select or enter a USN', type: 'error' });
      return;
    }
    if (!token) {
      setMessage({ text: 'Session expired. Please log in again.', type: 'error' });
      logout();
      navigate('/login');
      return;
    }
    if (role !== 'teacher') {
      setMessage({ text: 'Only teachers can enroll/update students.', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });

    const formData = new FormData();
    if (name) formData.append('name', name);
    formData.append('usn', usn);
    if (email) formData.append('email', email);
    if (semester) formData.append('semester', semester);
    if (section) formData.append('section', section);
    photos.forEach(photo => formData.append('photos', photo));

    try {
      const response = await axios.post('http://localhost:8000/api/faculty/enroll/', formData, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      setMessage({ text: response.data.message, type: 'success' });
      setName('');
      setUsn('');
      setEmail('');
      setPhotos([]);
      setCapturedImages([]);
      setShowCamera(false);
    } catch (err: any) {
      setMessage({ text: err.response?.data?.message || 'Operation failed', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setBulkFile(e.target.files[0]);
    }
  };

  const handleBulkEnrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkFile) {
      setBulkMessage({ text: 'Please select an Excel file', type: 'error', details: null });
      return;
    }
    if (!token) {
      setBulkMessage({ text: 'Session expired. Please log in again.', type: 'error', details: null });
      logout();
      navigate('/login');
      return;
    }
    if (role !== 'teacher') {
      setBulkMessage({ text: 'Only teachers can bulk enroll students.', type: 'error', details: null });
      return;
    }

    setBulkLoading(true);
    setBulkMessage({ text: '', type: '', details: null });

    const formData = new FormData();
    formData.append('excel_file', bulkFile);

    try {
      const response = await axios.post('http://localhost:8000/api/faculty/bulk-enroll/', formData, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      setBulkMessage({
        text: response.data.message,
        type: 'success',
        details: {
          enrolled: response.data.enrolled_students,
          updated: response.data.updated_students,  // Added for updated students
          warnings: response.data.warnings || [],
        },
      });
      setBulkFile(null);
      if (bulkFileInputRef.current) bulkFileInputRef.current.value = '';
    } catch (err: any) {
      setBulkMessage({
        text: err.response?.data?.message || 'Bulk enrollment failed',
        type: 'error',
        details: err.response?.data?.warnings ? { warnings: err.response.data.warnings } : null,
      });
    } finally {
      setBulkLoading(false);
    }
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
          <h2 className="text-4xl font-extrabold text-gray-800 mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
            Enroll/Update Student
          </h2>

          {/* Single Enrollment Section */}
          {message.text && (
            <motion.div
              className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {message.text}
            </motion.div>
          )}
          <form onSubmit={handleSubmit}>
            <motion.div className="grid md:grid-cols-2 gap-4 mb-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
              <div>
                <label htmlFor="usn" className="block text-gray-700 font-medium mb-2">Select Student USN</label>
                <select
                  id="usn"
                  value={usn}
                  onChange={handleUsnChange}
                  className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                >
                  <option value="">-- Select or enter new USN --</option>
                  {existingStudents.map(student => (
                    <option key={student.usn} value={student.usn}>{student.usn} - {student.name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={usn}
                  onChange={(e) => setUsn(e.target.value)}
                  className="w-full mt-2 p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  placeholder="Or enter new USN"
                />
              </div>
              <div>
                <label htmlFor="name" className="block text-gray-700 font-medium mb-2">Full Name</label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  placeholder="Enter or update student's full name"
                />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="email" className="block text-gray-700 font-medium mb-2">Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  placeholder="Enter or update student's email"
                />
              </div>
            </motion.div>
            <motion.div className="mb-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }}>
              <label className="block text-gray-700 font-medium mb-2">Student Photos (for Face Recognition)</label>
              <div className="flex flex-wrap gap-4 mb-4">
                {capturedImages.map((img, index) => (
                  <motion.div
                    key={index}
                    className="relative"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <img src={img} alt={`Student ${index + 1}`} className="w-24 h-24 object-cover rounded border border-gray-300" />
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
                  <Camera size={18} className="mr-2" />
                  {showCamera ? 'Hide Camera' : 'Use Camera'}
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
            <motion.div className="flex justify-between gap-4 mb-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.6 }}>
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
                type="button"
                onClick={() => setShowBulkEnroll(!showBulkEnroll)}
                className="flex items-center bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FileText size={18} className="mr-2" /> {showBulkEnroll ? 'Hide Bulk Enroll' : 'Bulk Enroll Students'}
              </motion.button>
              <motion.button
                type="submit"
                disabled={loading}
                className={`flex items-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded transition-colors ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {loading ? 'Processing...' : <><Check size={18} className="mr-2" /> {usn && existingStudents.some(s => s.usn === usn) ? 'Update Student' : 'Enroll Student'}</>}
              </motion.button>
            </motion.div>
          </form>

          {/* Bulk Enrollment Section */}
          {showBulkEnroll && (
            <motion.div
              className="mt-6 p-6 bg-blue-50 rounded-lg border border-blue-200"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h3 className="text-2xl font-bold text-blue-700 mb-4">Bulk Enroll Students</h3>
              {bulkMessage.text && (
                <motion.div
                  className={`mb-6 p-4 rounded-lg ${bulkMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <p>{bulkMessage.text}</p>
                  {bulkMessage.details && (
                    <div className="mt-2">
                      {bulkMessage.details.enrolled && bulkMessage.details.enrolled.length > 0 && (
                        <div>
                          <strong>Newly Enrolled Students:</strong>
                          <ul className="list-disc ml-6">
                            {bulkMessage.details.enrolled.map((student, index) => (
                              <li key={index}>{student.name} ({student.usn})</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {bulkMessage.details.updated && bulkMessage.details.updated.length > 0 && (
                        <div className="mt-2">
                          <strong>Updated Students:</strong>
                          <ul className="list-disc ml-6">
                            {bulkMessage.details.updated.map((student, index) => (
                              <li key={index}>{student.name} ({student.usn})</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {bulkMessage.details.warnings && bulkMessage.details.warnings.length > 0 && (
                        <div className="mt-2 text-yellow-700">
                          <strong>Warnings:</strong>
                          <ul className="list-disc ml-6">
                            {bulkMessage.details.warnings.map((warning, index) => (
                              <li key={index}>{warning}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
              <div className="mb-4 p-4 bg-blue-100 text-blue-800 rounded-lg">
                <h4 className="font-semibold mb-2">Excel File Requirements:</h4>
                <p>The Excel file must contain the following columns in this order:</p>
                <ul className="list-disc ml-6">
                  <li><strong>NAME</strong>: Full name of the student</li>
                  <li><strong>USN</strong>: Unique student number</li>
                  <li><strong>SEMESTER</strong>: Semester (e.g., 4, 5)</li>
                  <li><strong>SECTION</strong>: Section (e.g., A, B)</li>
                  <li><strong>MAIL ID</strong>: Student email address</li>
                </ul>
                <p className="mt-2">Example Format:</p>
                <pre className="bg-gray-200 p-2 rounded mt-1 text-sm">
                  NAME       | USN        | SEMESTER | SECTION | MAIL ID {"\n"}
                  Priya S    | 1AM22CI080 | 4        | B       | priya@example.com {"\n"}
                  Amit K     | 1AM22CI081 | 5        | A       | amit@example.com {"\n"}
                </pre>
              </div>
              <form onSubmit={handleBulkEnrollSubmit}>
                <div className="flex flex-col gap-4">
                  <input
                    type="file"
                    ref={bulkFileInputRef}
                    onChange={handleBulkFileChange}
                    accept=".xls,.xlsx"
                    className="p-3 border border-gray-300 rounded bg-gray-50"
                  />
                  <motion.button
                    type="submit"
                    disabled={bulkLoading}
                    className={`flex items-center bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded transition-colors ${bulkLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {bulkLoading ? 'Processing...' : <><Upload size={18} className="mr-2" /> Upload and Enroll</>}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default EnrollPage;