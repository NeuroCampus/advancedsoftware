import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Added for navigation
import axios from 'axios';
import { useUser } from '../contexts/UserContext';
import { motion } from 'framer-motion';
import { FileText, BarChart2 } from 'lucide-react';

const HODDashboard: React.FC = () => {
  const navigate = useNavigate(); // Added for navigation
  const [subjects, setSubjects] = useState<string[]>([]);
  const [semesters, setSemesters] = useState<string[]>([]);
  const [sections, setSections] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [attendanceFiles, setAttendanceFiles] = useState<any[]>([]);
  const [stats, setStats] = useState<{ above_75: any[]; below_75: any[]; pdf_url: string; total_sessions: number } | null>(null);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(''); // Added for success messages
  const [showLeaveSection, setShowLeaveSection] = useState(false);
  const [showAttendanceSection, setShowAttendanceSection] = useState(false);
  const { token, role, logout, setSemester: setContextSemester, setSection: setContextSection, setSubject: setContextSubject } = useUser();

  // Redirect if not HOD
  if (!token || role !== 'hod') {
    navigate('/login');
    return null;
  }

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      setError('');
      try {
        // Fetch subjects, semesters, and sections
        const subjectsResponse = await axios.get('http://localhost:8000/api/hod/subjects/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (subjectsResponse.data.success) {
          setSubjects(subjectsResponse.data.subjects);
          setSemesters(subjectsResponse.data.semesters);
          setSections(subjectsResponse.data.sections);
        } else {
          setError(subjectsResponse.data.message || 'Failed to fetch subjects data');
        }

        // Fetch pending leave requests
        const leaveResponse = await axios.get('http://localhost:8000/api/hod/leave-requests/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (leaveResponse.data.success) {
          setLeaveRequests(leaveResponse.data.leave_requests);
        } else {
          setError(leaveResponse.data.message || 'No pending leave requests');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error fetching initial data');
        if (err.response?.status === 401) logout();
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [token, logout, navigate]);

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
      const response = await axios.get('http://localhost:8000/api/hod/attendance-files/', {
        headers: { Authorization: `Bearer ${token}` },
        params: { subject: selectedSubject, semester: selectedSemester, section: selectedSection },
      });
      if (response.data.success) {
        setAttendanceFiles(response.data.files);
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

  const generateStatistics = async (fileId: string) => {
    setLoading(true);
    setError('');
    setStats(null);
    try {
      const response = await axios.post(
        'http://localhost:8000/api/hod/generate-statistics/',
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

  const manageLeaveRequest = async (leaveId: string, action: 'APPROVE' | 'REJECT') => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await axios.post(
        'http://localhost:8000/api/hod/manage-leave-request/', // Updated endpoint
        { leave_id: leaveId, action },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setLeaveRequests(leaveRequests.filter((lr) => lr.id !== leaveId));
        setSuccess(`Leave request ${action.toLowerCase()}d successfully`);
        setTimeout(() => setSuccess(''), 4000);
      } else {
        setError(response.data.message || `Failed to ${action.toLowerCase()} leave request`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || `Error ${action.toLowerCase()}ing leave request`);
      if (err.response?.status === 401) logout();
    } finally {
      setLoading(false);
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
        <p className="text-lg text-gray-600 mb-6">Welcome, HOD! Manage courses, monitor performance, and review leave requests here.</p>

        {/* Buttons to toggle sections */}
        <div className="flex space-x-4 mb-8">
          <motion.button
            onClick={() => setShowAttendanceSection(!showAttendanceSection)}
            className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-full transition-colors shadow-md"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <BarChart2 size={24} className="mr-2" />
            {showAttendanceSection ? 'Hide Attendance Stats' : 'Check Attendance Statistics'}
          </motion.button>
          <div className="relative">
            <motion.button
              onClick={() => setShowLeaveSection(!showLeaveSection)}
              className="flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-full transition-colors shadow-md"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FileText size={24} className="mr-2" />
              {showLeaveSection ? 'Hide Leave Requests' : 'Manage Leave Requests'}
            </motion.button>
            {leaveRequests.length > 0 && (
              <motion.span
                className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                {leaveRequests.length}
              </motion.span>
            )}
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <motion.div
            className="mb-6 p-4 bg-green-100 text-green-700 rounded-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {success}
          </motion.div>
        )}
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
            className="text-gray-500 text-lg text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            Loading data...
          </motion.p>
        ) : (
          <>
            {/* Attendance Section */}
            {showAttendanceSection && (
              <>
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

                {stats && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                  >
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Attendance Statistics</h2>
                    <p className="text-gray-600 mb-4">Total Sessions: {stats.total_sessions}</p>
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
                              {entry.student}: {entry.percentage.toFixed(2)}% (Present: {entry.present}, Absent: {entry.absent})
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
                              {entry.student}: {entry.percentage.toFixed(2)}% (Present: {entry.present}, Absent: {entry.absent})
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

            {/* Leave Requests Section */}
            {showLeaveSection && (
              <motion.div
                className="mt-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Pending Leave Requests</h2>
                {leaveRequests.length > 0 ? (
                  <ul className="space-y-4">
                    {leaveRequests.map((lr) => (
                      <motion.li
                        key={lr.id}
                        className="p-4 bg-gray-50 rounded-lg shadow-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p><strong>Faculty:</strong> {lr.faculty}</p>
                            <p><strong>Dates:</strong> {lr.start_date} to {lr.end_date}</p>
                            <p><strong>Reason:</strong> {lr.reason}</p>
                            <p><strong>Submitted:</strong> {lr.submitted_at}</p>
                          </div>
                          <div className="flex space-x-4 items-center">
                            <motion.button
                              onClick={() => manageLeaveRequest(lr.id, 'APPROVE')}
                              className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded transition-colors"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              disabled={loading}
                            >
                              Approve
                            </motion.button>
                            <motion.button
                              onClick={() => manageLeaveRequest(lr.id, 'REJECT')}
                              className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded transition-colors"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              disabled={loading}
                            >
                              Reject
                            </motion.button>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">No pending leave requests.</p>
                )}
              </motion.div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
};

export default HODDashboard;