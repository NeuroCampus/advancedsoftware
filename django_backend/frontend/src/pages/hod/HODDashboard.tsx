// src/pages/hod/HODDashboard.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { logout, setSemester, setSection, setSubject } from '../../redux/slices/authSlice';
import { RootState } from '../../redux/types';
import { motion } from 'framer-motion';
import {
  FileText,
  BarChart2,
  Users,
  Briefcase,
  LogOut,
  PlusCircle,
  Calendar,
  Book,
} from 'lucide-react';

interface AttendanceFile {
  id: string;
  name: string;
}

interface Stats {
  above_75: { student: string; percentage: number; present: number; absent: number }[];
  below_75: { student: string; percentage: number; present: number; absent: number }[];
  pdf_url: string;
  total_sessions: number;
}

interface LeaveRequest {
  id: string;
  faculty: string;
  start_date: string;
  end_date: string;
  reason: string;
  submitted_at: string;
}

interface Branch {
  id: string;
  name: string;
  hod: string | null;
}

interface Faculty {
  id: string;
  username: string;
}

interface TimetableEntry {
  id: string;
  subject: string;
  time: string;
  section: string;
  faculty: string;
}

interface MarkEntry {
  id: string;
  student_id: string;
  subject: string;
  score: number;
  total: number;
}

const HODDashboard: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, semester, section, subject } = useSelector((state: RootState) => state.auth);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [semesters, setSemesters] = useState<string[]>([]);
  const [sections, setSections] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState(subject || '');
  const [selectedSemester, setSelectedSemester] = useState(semester || '');
  const [selectedSection, setSelectedSection] = useState(section || '');
  const [attendanceFiles, setAttendanceFiles] = useState<AttendanceFile[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [facultyList, setFacultyList] = useState<Faculty[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [marks, setMarks] = useState<MarkEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAttendanceSection, setShowAttendanceSection] = useState(false);
  const [showLeaveSection, setShowLeaveSection] = useState(false);
  const [showFacultySection, setShowFacultySection] = useState(false);
  const [showStudentSection, setShowStudentSection] = useState(false);
  const [showTimetableSection, setShowTimetableSection] = useState(false);
  const [showMarksSection, setShowMarksSection] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    faculty_id: '',
    branch_id: '',
    semester: '',
    section: '',
    subject: '',
  });

  if (!user?.token || user.role !== 'hod') {
    navigate('/login');
    return null;
  }

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      setError('');
      try {
        const [subjectsResponse, leaveResponse, branchesResponse, facultyResponse] = await Promise.all([
          axios.get('http://localhost:8000/api/hod/subjects/', {
            headers: { Authorization: `Bearer ${user.token}` },
          }),
          axios.get('http://localhost:8000/api/hod/leave-requests/', {
            headers: { Authorization: `Bearer ${user.token}` },
          }),
          axios.get('http://localhost:8000/api/hod/branches/', {
            headers: { Authorization: `Bearer ${user.token}` },
          }),
          axios.get('http://localhost:8000/api/hod/faculty/', {
            headers: { Authorization: `Bearer ${user.token}` },
          }),
        ]);

        if (subjectsResponse.data.success) {
          setSubjects(subjectsResponse.data.subjects || []);
          setSemesters(subjectsResponse.data.semesters || []);
          setSections(subjectsResponse.data.sections || []);
        }
        if (leaveResponse.data.success) setLeaveRequests(leaveResponse.data.leave_requests || []);
        if (branchesResponse.data.success) setBranches(branchesResponse.data.branches || []);
        if (facultyResponse.data.success) setFacultyList(facultyResponse.data.faculty || []);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error fetching initial data');
        if (err.response?.status === 401) dispatch(logout());
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [user.token, dispatch, navigate]);

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
        headers: { Authorization: `Bearer ${user.token}` },
        params: { subject: selectedSubject, semester: selectedSemester, section: selectedSection },
      });
      if (response.data.success) {
        setAttendanceFiles(response.data.files || []);
        dispatch(setSubject(selectedSubject));
        dispatch(setSemester(selectedSemester));
        dispatch(setSection(selectedSection));
      } else {
        setError(response.data.message || 'No attendance files found');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error fetching attendance files');
      if (err.response?.status === 401) dispatch(logout());
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
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      if (response.data.success) {
        setStats(response.data);
      } else {
        setError(response.data.message || 'Failed to generate statistics');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error generating statistics');
      if (err.response?.status === 401) dispatch(logout());
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async (pdfUrl: string) => {
    try {
      const response = await axios.get(`http://localhost:8000${pdfUrl}`, {
        headers: { Authorization: `Bearer ${user.token}` },
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
        'http://localhost:8000/api/hod/manage-leave-request/',
        { leave_id: leaveId, action },
        { headers: { Authorization: `Bearer ${user.token}` } }
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
      if (err.response?.status === 401) dispatch(logout());
    } finally {
      setLoading(false);
    }
  };

  const assignFaculty = async () => {
    if (!Object.values(newAssignment).every(Boolean)) {
      setError('All fields are required for faculty assignment.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await axios.post(
        'http://localhost:8000/api/hod/assign-faculty/',
        newAssignment,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      if (response.data.success) {
        setSuccess(response.data.message);
        setNewAssignment({ faculty_id: '', branch_id: '', semester: '', section: '', subject: '' });
        setTimeout(() => setSuccess(''), 4000);
      } else {
        setError(response.data.message || 'Failed to assign faculty');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error assigning faculty');
      if (err.response?.status === 401) dispatch(logout());
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    setError('');
    setStudents([]);
    try {
      const response = await axios.get('http://localhost:8000/api/hod/students/', {
        headers: { Authorization: `Bearer ${user.token}` },
        params: { semester: selectedSemester, section: selectedSection },
      });
      if (response.data.success) {
        setStudents(response.data.students || []);
      } else {
        setError(response.data.message || 'No students found');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error fetching students');
      if (err.response?.status === 401) dispatch(logout());
    } finally {
      setLoading(false);
    }
  };

  const fetchTimetable = async () => {
    setLoading(true);
    setError('');
    setTimetable([]);
    try {
      const response = await axios.get('http://localhost:8000/api/hod/timetable/', {
        headers: { Authorization: `Bearer ${user.token}` },
        params: { semester: selectedSemester, section: selectedSection },
      });
      if (response.data.success) {
        setTimetable(response.data.entries || []);
      } else {
        setError(response.data.message || 'No timetable data found');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error fetching timetable');
      if (err.response?.status === 401) dispatch(logout());
    } finally {
      setLoading(false);
    }
  };

  const fetchMarks = async () => {
    setLoading(true);
    setError('');
    setMarks([]);
    try {
      const response = await axios.get('http://localhost:8000/api/hod/marks/', {
        headers: { Authorization: `Bearer ${user.token}` },
        params: { semester: selectedSemester, section: selectedSection, subject: selectedSubject },
      });
      if (response.data.success) {
        setMarks(response.data.entries || []);
      } else {
        setError(response.data.message || 'No marks data found');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error fetching marks');
      if (err.response?.status === 401) dispatch(logout());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1A1A1A] p-6 text-white">
      <motion.div
        className="max-w-6xl mx-auto bg-[#2D2D2D] rounded-xl shadow-2xl p-8"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
            HOD Dashboard
          </h1>
          <motion.button
            onClick={() => {
              dispatch(logout());
              navigate('/login');
            }}
            className="flex items-center text-red-400 hover:text-red-600 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <LogOut size={18} className="mr-2" />
            Logout
          </motion.button>
        </div>
        <p className="text-gray-400 mb-6">Manage attendance, leave requests, faculty, students, timetable, and marks.</p>

        <div className="flex flex-wrap gap-4 mb-8">
          <motion.button
            onClick={() => setShowAttendanceSection(!showAttendanceSection)}
            className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 font-medium py-3 px-6 rounded-full transition-colors shadow-md"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <BarChart2 size={24} className="mr-2" />
            {showAttendanceSection ? 'Hide Attendance' : 'Attendance Stats'}
          </motion.button>
          <div className="relative">
            <motion.button
              onClick={() => setShowLeaveSection(!showLeaveSection)}
              className="flex items-center justify-center bg-green-600 hover:bg-green-700 font-medium py-3 px-6 rounded-full transition-colors shadow-md"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FileText size={24} className="mr-2" />
              {showLeaveSection ? 'Hide Leave' : 'Leave Requests'}
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
          <motion.button
            onClick={() => setShowFacultySection(!showFacultySection)}
            className="flex items-center justify-center bg-purple-600 hover:bg-purple-700 font-medium py-3 px-6 rounded-full transition-colors shadow-md"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Briefcase size={24} className="mr-2" />
            {showFacultySection ? 'Hide Faculty' : 'Manage Faculty'}
          </motion.button>
          <motion.button
            onClick={() => setShowStudentSection(!showStudentSection)}
            className="flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 font-medium py-3 px-6 rounded-full transition-colors shadow-md"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Users size={24} className="mr-2" />
            {showStudentSection ? 'Hide Students' : 'Oversee Students'}
          </motion.button>
          <motion.button
            onClick={() => setShowTimetableSection(!showTimetableSection)}
            className="flex items-center justify-center bg-yellow-600 hover:bg-yellow-700 font-medium py-3 px-6 rounded-full transition-colors shadow-md"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Calendar size={24} className="mr-2" />
            {showTimetableSection ? 'Hide Timetable' : 'Timetable'}
          </motion.button>
          <motion.button
            onClick={() => setShowMarksSection(!showMarksSection)}
            className="flex items-center justify-center bg-teal-600 hover:bg-teal-700 font-medium py-3 px-6 rounded-full transition-colors shadow-md"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Book size={24} className="mr-2" />
            {showMarksSection ? 'Hide Marks' : 'Marks'}
          </motion.button>
        </div>

        {success && (
          <motion.div
            className="mb-6 p-4 bg-green-900/50 text-green-200 rounded-lg"
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
            className="mb-6 p-4 bg-red-900/50 text-red-200 rounded-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {error}
          </motion.div>
        )}

        {loading ? (
          <motion.p
            className="text-gray-400 text-lg text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            Loading data...
          </motion.p>
        ) : (
          <>
            {showAttendanceSection && (
              <motion.div
                className="mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600 mb-4">
                  Attendance Statistics
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-gray-300 font-medium mb-2">Subject</label>
                    <select
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      className="w-full p-3 bg-[#3A3A3A] border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 text-white"
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
                    <label className="block text-gray-300 font-medium mb-2">Semester</label>
                    <select
                      value={selectedSemester}
                      onChange={(e) => setSelectedSemester(e.target.value)}
                      className="w-full p-3 bg-[#3A3A3A] border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 text-white"
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
                    <label className="block text-gray-300 font-medium mb-2">Section</label>
                    <select
                      value={selectedSection}
                      onChange={(e) => setSelectedSection(e.target.value)}
                      className="w-full p-3 bg-[#3A3A3A] border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 text-white"
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

                {attendanceFiles.length > 0 && (
                  <motion.div
                    className="mt-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <h3 className="text-lg font-semibold text-gray-300 mb-2">Available Files</h3>
                    <ul className="space-y-2">
                      {attendanceFiles.map((file) => (
                        <motion.li
                          key={file.id}
                          className="flex justify-between items-center p-3 bg-[#3A3A3A] rounded-lg hover:bg-[#444444]"
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
                    className="mt-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                  >
                    <h3 className="text-lg font-semibold text-gray-300 mb-2">Statistics</h3>
                    <p className="text-gray-400 mb-4">Total Sessions: {stats.total_sessions}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-md font-semibold text-green-400 mb-2">Above 75%</h4>
                        <ul className="space-y-1">
                          {stats.above_75.map((entry, idx) => (
                            <motion.li
                              key={idx}
                              className="text-gray-300"
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
                        <h4 className="text-md font-semibold text-red-400 mb-2">Below 75%</h4>
                        <ul className="space-y-1">
                          {stats.below_75.map((entry, idx) => (
                            <motion.li
                              key={idx}
                              className="text-gray-300"
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
              </motion.div>
            )}

            {showLeaveSection && (
              <motion.div
                className="mt-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600 mb-4">
                  Pending Leave Requests
                </h2>
                {leaveRequests.length > 0 ? (
                  <ul className="space-y-4">
                    {leaveRequests.map((lr) => (
                      <motion.li
                        key={lr.id}
                        className="p-4 bg-[#3A3A3A] rounded-lg shadow-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-gray-300"><strong>Faculty:</strong> {lr.faculty}</p>
                            <p className="text-gray-300"><strong>Dates:</strong> {lr.start_date} to {lr.end_date}</p>
                            <p className="text-gray-300"><strong>Reason:</strong> {lr.reason}</p>
                            <p className="text-gray-300"><strong>Submitted:</strong> {lr.submitted_at}</p>
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
                  <p className="text-gray-400">No pending leave requests.</p>
                )}
              </motion.div>
            )}

            {showFacultySection && (
              <motion.div
                className="mt-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
              >
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600 mb-4">
                  Manage Faculty Assignments
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-gray-300 font-medium mb-2">Faculty</label>
                    <select
                      value={newAssignment.faculty_id}
                      onChange={(e) => setNewAssignment({ ...newAssignment, faculty_id: e.target.value })}
                      className="w-full p-3 bg-[#3A3A3A] border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-purple-400 text-white"
                    >
                      <option value="">Select Faculty</option>
                      {facultyList.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.username}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-300 font-medium mb-2">Branch</label>
                    <select
                      value={newAssignment.branch_id}
                      onChange={(e) => setNewAssignment({ ...newAssignment, branch_id: e.target.value })}
                      className="w-full p-3 bg-[#3A3A3A] border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-purple-400 text-white"
                    >
                      <option value="">Select Branch</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-300 font-medium mb-2">Semester</label>
                    <input
                      type="text"
                      value={newAssignment.semester}
                      onChange={(e) => setNewAssignment({ ...newAssignment, semester: e.target.value })}
                      placeholder="e.g., 5"
                      className="w-full p-3 bg-[#3A3A3A] border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-purple-400 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 font-medium mb-2">Section</label>
                    <input
                      type="text"
                      value={newAssignment.section}
                      onChange={(e) => setNewAssignment({ ...newAssignment, section: e.target.value })}
                      placeholder="e.g., A"
                      className="w-full p-3 bg-[#3A3A3A] border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-purple-400 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 font-medium mb-2">Subject</label>
                    <input
                      type="text"
                      value={newAssignment.subject}
                      onChange={(e) => setNewAssignment({ ...newAssignment, subject: e.target.value })}
                      placeholder="e.g., Mathematics"
                      className="w-full p-3 bg-[#3A3A3A] border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-purple-400 text-white"
                    />
                  </div>
                </div>
                <motion.button
                  onClick={assignFaculty}
                  className="mt-4 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <PlusCircle size={18} className="mr-2 inline" />
                  Assign Faculty
                </motion.button>
              </motion.div>
            )}

            {showStudentSection && (
              <motion.div
                className="mt-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1 }}
              >
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600 mb-4">
                  Oversee Students
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 font-medium mb-2">Semester</label>
                    <select
                      value={selectedSemester}
                      onChange={(e) => setSelectedSemester(e.target.value)}
                      className="w-full p-3 bg-[#3A3A3A] border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-indigo-400 text-white"
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
                    <label className="block text-gray-300 font-medium mb-2">Section</label>
                    <select
                      value={selectedSection}
                      onChange={(e) => setSelectedSection(e.target.value)}
                      className="w-full p-3 bg-[#3A3A3A] border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-indigo-400 text-white"
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
                  onClick={fetchStudents}
                  className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Load Students
                </motion.button>

                {students.length > 0 && (
                  <motion.div
                    className="mt-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <h3 className="text-lg font-semibold text-gray-300 mb-2">Student List</h3>
                    <ul className="space-y-2">
                      {students.map((student) => (
                        <motion.li
                          key={student.id}
                          className="p-3 bg-[#3A3A3A] rounded-lg"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          {student.name} (USN: {student.usn}) - Proctor: {student.proctor || 'Unassigned'}
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </motion.div>
            )}

            {showTimetableSection && (
              <motion.div
                className="mt-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.2 }}
              >
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600 mb-4">
                  Timetable Management
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 font-medium mb-2">Semester</label>
                    <select
                      value={selectedSemester}
                      onChange={(e) => setSelectedSemester(e.target.value)}
                      className="w-full p-3 bg-[#3A3A3A] border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-yellow-400 text-white"
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
                    <label className="block text-gray-300 font-medium mb-2">Section</label>
                    <select
                      value={selectedSection}
                      onChange={(e) => setSelectedSection(e.target.value)}
                      className="w-full p-3 bg-[#3A3A3A] border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-yellow-400 text-white"
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
                  onClick={fetchTimetable}
                  className="mt-4 bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-6 rounded transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Load Timetable
                </motion.button>

                {timetable.length > 0 && (
                  <motion.div
                    className="mt-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <h3 className="text-lg font-semibold text-gray-300 mb-2">Timetable</h3>
                    <ul className="space-y-2">
                      {timetable.map((entry) => (
                        <motion.li
                          key={entry.id}
                          className="p-3 bg-[#3A3A3A] rounded-lg"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          {entry.subject} - {entry.time} (Section: {entry.section}, Faculty: {entry.faculty})
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </motion.div>
            )}

            {showMarksSection && (
              <motion.div
                className="mt-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.4 }}
              >
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600 mb-4">
                  Marks Management
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-gray-300 font-medium mb-2">Subject</label>
                    <select
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      className="w-full p-3 bg-[#3A3A3A] border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-teal-400 text-white"
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
                    <label className="block text-gray-300 font-medium mb-2">Semester</label>
                    <select
                      value={selectedSemester}
                      onChange={(e) => setSelectedSemester(e.target.value)}
                      className="w-full p-3 bg-[#3A3A3A] border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-teal-400 text-white"
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
                    <label className="block text-gray-300 font-medium mb-2">Section</label>
                    <select
                      value={selectedSection}
                      onChange={(e) => setSelectedSection(e.target.value)}
                      className="w-full p-3 bg-[#3A3A3A] border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-teal-400 text-white"
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
                  onClick={fetchMarks}
                  className="mt-4 bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-6 rounded transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Load Marks
                </motion.button>

                {marks.length > 0 && (
                  <motion.div
                    className="mt-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <h3 className="text-lg font-semibold text-gray-300 mb-2">Marks List</h3>
                    <ul className="space-y-2">
                      {marks.map((mark) => (
                        <motion.li
                          key={mark.id}
                          className="p-3 bg-[#3A3A3A] rounded-lg"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          {mark.student_id}: {mark.score}/{mark.total} in {mark.subject}
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>
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