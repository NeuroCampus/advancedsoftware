import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from '../contexts/UserContext';
import { motion } from 'framer-motion';

const HODDashboard: React.FC = () => {
  const [subjects, setSubjects] = useState<string[]>([]);
  const [semesters, setSemesters] = useState<string[]>([]);
  const [sections, setSections] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [attendanceFiles, setAttendanceFiles] = useState<any[]>([]);
  const [stats, setStats] = useState<{ above_75: any[]; below_75: any[]; pdf_url: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { token, role, logout, setSemester: setContextSemester, setSection: setContextSection, setSubject: setContextSubject } = useUser();

  // Fetch subjects, semesters, and sections on mount
  useEffect(() => {
    const fetchSubjects = async () => {
      if (!token || role !== 'hod') {
        setError('Please log in as HOD to view this dashboard.');
        return;
      }

      setLoading(true);
      setError('');
      try {
        const response = await axios.get('http://localhost:8000/api/subjects/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.success) {
          setSubjects(response.data.subjects);
          setSemesters(response.data.semesters);
          setSections(response.data.sections);
        } else {
          setError(response.data.message || 'Failed to fetch data');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error fetching data');
        if (err.response?.status === 401) logout();
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, [token, role, logout]);

  // Fetch attendance files when subject, semester, and section are selected
  const fetchAttendanceFiles = async () => {
    if (!selectedSubject || !selectedSemester || !selectedSection) {
      setError('Please select subject, semester, and section.');
      return;
    }

    setLoading(true);
    setError('');
    setAttendanceFiles([]);
    setStats(null);
    try {
      const response = await axios.get('http://localhost:8000/api/attendance-files/', {
        headers: { Authorization: `Bearer ${token}` },
        params: { subject: selectedSubject, semester: selectedSemester, section: selectedSection },
      });
      if (response.data.success) {
        setAttendanceFiles(response.data.files);
        // Update context for consistency
        setContextSubject(selectedSubject);
        setContextSemester(selectedSemester);
        setContextSection(selectedSection);
      } else {
        setError(response.data.message || 'No attendance files found');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error fetching attendance files');
      if (err.response?.status === 401) logout();
    } finally {
      setLoading(false);
    }
  };

  // Generate statistics for a selected file
  const generateStatistics = async (fileId: string) => {
    setLoading(true);
    setError('');
    setStats(null);
    try {
      const response = await axios.post(
        'http://localhost:8000/api/generate-statistics/',
        { file_id: fileId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setStats(response.data);
      } else {
        setError(response.data.message || 'Failed to generate statistics');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error generating statistics');
      if (err.response?.status === 401) logout();
    } finally {
      setLoading(false);
    }
  };

  // Download PDF
  const downloadPDF = async (pdfUrl: string) => {
    try {
      const response = await axios.get(`http://localhost:8000${pdfUrl}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', pdfUrl.split('/').pop() || 'attendance_report.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      setError('Error downloading PDF');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 p-6">
      <motion.div
        className="max-w-6xl mx-auto bg-white rounded-xl shadow-2xl p-8"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-extrabold text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
            HOD Dashboard
          </h1>
          <motion.button
            onClick={logout}
            className="flex items-center text-red-600 hover:text-red-800 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="mr-2">Logout</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </motion.button>
        </div>
        <p className="text-lg text-gray-600 mb-6">Welcome, HOD! Manage courses and monitor performance here.</p>

        {error && (
          <motion.div
            className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {error}
          </motion.div>
        )}

        {loading ? (
          <motion.p
            className="text-gray-500 text-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            Loading data...
          </motion.p>
        ) : (
          <>
            {/* Selection Form */}
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Subject</label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Subject</option>
                    {subjects.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Semester</label>
                  <select
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Semester</option>
                    {semesters.map((sem) => (
                      <option key={sem} value={sem}>
                        {sem}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Section</label>
                  <select
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Section</option>
                    {sections.map((sec) => (
                      <option key={sec} value={sec}>
                        {sec}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <motion.button
                onClick={fetchAttendanceFiles}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Load Attendance Files
              </motion.button>
            </motion.div>

            {/* Attendance Files */}
            {attendanceFiles.length > 0 && (
              <motion.div
                className="mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Attendance Files</h2>
                <ul className="space-y-2">
                  {attendanceFiles.map((file) => (
                    <motion.li
                      key={file.id}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <span>{file.name}</span>
                      <motion.button
                        onClick={() => generateStatistics(file.id)}
                        className="bg-green-600 hover:bg-green-700 text-white py-1 px-3 rounded transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Generate Stats
                      </motion.button>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Statistics */}
            {stats && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Attendance Statistics</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-green-600 mb-2">Above 75%</h3>
                    <ul className="space-y-1">
                      {stats.above_75.map((entry, idx) => (
                        <motion.li
                          key={idx}
                          className="text-gray-700"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: idx * 0.05 }}
                        >
                          {entry.student}: {entry.percentage.toFixed(2)}%
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-red-600 mb-2">Below 75%</h3>
                    <ul className="space-y-1">
                      {stats.below_75.map((entry, idx) => (
                        <motion.li
                          key={idx}
                          className="text-gray-700"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: idx * 0.05 }}
                        >
                          {entry.student}: {entry.percentage.toFixed(2)}%
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                </div>
                <motion.button
                  onClick={() => downloadPDF(stats.pdf_url)}
                  className="mt-4 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Download PDF Report
                </motion.button>
              </motion.div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
};

export default HODDashboard;