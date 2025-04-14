import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';
import { RootState } from '../../redux/types';
import {
  Calendar,
  LogOut,
  FileText,
  BarChart2,
  Book,
  Bell,
} from 'lucide-react';
import { motion } from 'framer-motion';
import Header from '../../components/Header';
import {
  takeAttendance,
  generateStatistics,
  downloadPDF,
} from '../../redux/slices/attendanceSlice';
import {
  fetchStudents,
} from '../../redux/slices/studentSlice';
import {
  fetchMarks,
  enterMarks,
} from '../../redux/slices/marksSlice';
import {
  fetchAnnouncements,
} from '../../redux/slices/announcementSlice';
import {
  fetchLeaveRequests,
  submitLeaveRequest,
  fetchStudentLeaveRequests,
  manageStudentLeaveRequest,
} from '../../redux/slices/leaveSlice';

interface AttendanceFormData {
  branch: string;
  subject: string;
  section: string;
  semester: number;
  files: File[];
}

interface MarkEntry {
  student_id: string;
  mark: number;
}

const FacultyDashboard: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, loading: authLoading, error: authError } = useSelector((state: RootState) => state.auth);
  const { records, stats, loading: attendanceLoading, error: attendanceError } = useSelector((state: RootState) => state.attendance);
  const { students, loading: studentLoading, error: studentError } = useSelector((state: RootState) => state.student);
  const { entries: marks, loading: marksLoading, error: marksError } = useSelector((state: RootState) => state.marks);
  const { announcements, loading: announcementLoading, error: announcementError } = useSelector((state: RootState) => state.announcement);
  const { requests: leaveRequests, studentRequests, loading: leaveLoading, error: leaveError } = useSelector((state: RootState) => state.leave);

  const [attendanceForm, setAttendanceForm] = useState<AttendanceFormData>({
    branch: '',
    subject: '',
    section: '',
    semester: 0,
    files: [],
  });
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [testNumber, setTestNumber] = useState<number>(1);
  const [marksData, setMarksData] = useState<MarkEntry[]>([]);
  const [success, setSuccess] = useState<string>('');
  const [showAttendanceSection, setShowAttendanceSection] = useState<boolean>(false);
  const [showStatsSection, setShowStatsSection] = useState<boolean>(false);
  const [showStudentsSection, setShowStudentsSection] = useState<boolean>(false);
  const [showMarksSection, setShowMarksSection] = useState<boolean>(false);
  const [showLeaveSection, setShowLeaveSection] = useState<boolean>(false);
  const [showStudentLeaveSection, setShowStudentLeaveSection] = useState<boolean>(false);
  const [showAnnouncementsSection, setShowAnnouncementsSection] = useState<boolean>(false);

  useEffect(() => {
    if (!user?.token || user.role !== 'teacher') {
      navigate('/login');
      return;
    }
    dispatch(fetchLeaveRequests());
    dispatch(fetchStudentLeaveRequests());
    dispatch(fetchAnnouncements());
  }, [user?.token, user?.role, navigate, dispatch]);

  const handleAttendanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!attendanceForm.files.length) {
      setError('Please upload at least one image');
      return;
    }
    dispatch(takeAttendance(attendanceForm));
  };

  const handleStatsGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    const fileId = records[0]?.id; // Assuming latest record
    if (fileId) dispatch(generateStatistics({ file_id: fileId }));
  };

  const handleStudentsFetch = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(fetchStudents({ branch: attendanceForm.branch, semester: attendanceForm.semester, section: attendanceForm.section }));
  };

  const handleMarksSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(enterMarks({ branch: attendanceForm.branch, semester: attendanceForm.semester, section: attendanceForm.section, subject: attendanceForm.subject, test_number: testNumber, marks: marksData }));
  };

  const handleSubmitLeaveRequest = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(submitLeaveRequest({ start_date: startDate, end_date: endDate, reason }));
  };

  const handleManageStudentLeave = (leaveId: number, action: 'APPROVE' | 'REJECT') => {
    dispatch(manageStudentLeaveRequest({ leave_id: leaveId, action }));
  };

  const anyLoading = authLoading || attendanceLoading || studentLoading || marksLoading || leaveLoading || announcementLoading;
  const anyError = authError || attendanceError || studentError || marksError || leaveError || announcementError;

  return (
    <div className="min-h-screen bg-[#1A1A1A] p-6 text-white">
      <Header />
      <motion.div
        className="max-w-6xl mx-auto bg-[#2D2D2D] rounded-xl shadow-2xl p-8"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
            Faculty Dashboard
          </h1>
          <motion.button
            onClick={() => {
              dispatch(logout());
              navigate('/login');
            }}
            className="flex items-center bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <LogOut size={18} className="mr-2" />
            Logout
          </motion.button>
        </div>
        <p className="text-gray-400 mb-6">Welcome, Faculty! Manage your tasks efficiently.</p>

        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-8">
          <motion.button
            onClick={() => setShowAttendanceSection(!showAttendanceSection)}
            className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 font-medium py-3 px-6 rounded-full transition-colors shadow-md w-full sm:w-auto"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Calendar size={24} className="mr-2" />
            {showAttendanceSection ? 'Hide Attendance' : 'Take Attendance'}
          </motion.button>
          <motion.button
            onClick={() => setShowStatsSection(!showStatsSection)}
            className="flex items-center justify-center bg-yellow-600 hover:bg-yellow-700 font-medium py-3 px-6 rounded-full transition-colors shadow-md w-full sm:w-auto"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <BarChart2 size={24} className="mr-2" />
            {showStatsSection ? 'Hide Statistics' : 'Generate Statistics'}
          </motion.button>
          <motion.button
            onClick={() => setShowStudentsSection(!showStudentsSection)}
            className="flex items-center justify-center bg-teal-600 hover:bg-teal-700 font-medium py-3 px-6 rounded-full transition-colors shadow-md w-full sm:w-auto"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FileText size={24} className="mr-2" />
            {showStudentsSection ? 'Hide Students' : 'View Students'}
          </motion.button>
          <motion.button
            onClick={() => setShowMarksSection(!showMarksSection)}
            className="flex items-center justify-center bg-purple-600 hover:bg-purple-700 font-medium py-3 px-6 rounded-full transition-colors shadow-md w-full sm:w-auto"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Book size={24} className="mr-2" />
            {showMarksSection ? 'Hide Marks' : 'Manage Marks'}
          </motion.button>
          <motion.button
            onClick={() => setShowLeaveSection(!showLeaveSection)}
            className="flex items-center justify-center bg-green-600 hover:bg-green-700 font-medium py-3 px-6 rounded-full transition-colors shadow-md w-full sm:w-auto"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FileText size={24} className="mr-2" />
            {showLeaveSection ? 'Hide Leave Requests' : 'Manage Leave Requests'}
          </motion.button>
          <motion.button
            onClick={() => setShowStudentLeaveSection(!showStudentLeaveSection)}
            className="flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 font-medium py-3 px-6 rounded-full transition-colors shadow-md w-full sm:w-auto"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FileText size={24} className="mr-2" />
            {showStudentLeaveSection ? 'Hide Student Leaves' : 'Manage Student Leaves'}
            {studentRequests.length > 0 && (
              <span className="ml-2 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {studentRequests.length}
              </span>
            )}
          </motion.button>
          <motion.button
            onClick={() => setShowAnnouncementsSection(!showAnnouncementsSection)}
            className="flex items-center justify-center bg-orange-600 hover:bg-orange-700 font-medium py-3 px-6 rounded-full transition-colors shadow-md w-full sm:w-auto"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Bell size={24} className="mr-2" />
            {showAnnouncementsSection ? 'Hide Announcements' : 'View Announcements'}
          </motion.button>
        </div>

        {anyError && (
          <motion.div className="mb-6 p-4 bg-red-900/50 text-red-200 rounded-lg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            {anyError}
          </motion.div>
        )}

        {anyLoading && (
          <motion.p className="text-gray-400 text-lg flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <svg className="animate-spin h-5 w-5 mr-2 text-gray-400" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading...
          </motion.p>
        )}

        {success && (
          <motion.div className="mb-6 p-4 bg-green-900/50 text-green-200 rounded-lg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
            {success}
          </motion.div>
        )}

        {!anyLoading && (
          <>
            {showAttendanceSection && (
              <motion.div className="mb-10 bg-[#3A3A3A] p-6 rounded-lg shadow-inner" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8, delay: 0.2 }}>
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600 mb-4">Take Attendance</h2>
                <form onSubmit={handleAttendanceSubmit} className="space-y-4">
                  <input type="text" value={attendanceForm.branch} onChange={(e) => setAttendanceForm({ ...attendanceForm, branch: e.target.value })} placeholder="Branch" className="w-full p-3 bg-[#444444] border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 text-white" required />
                  <input type="text" value={attendanceForm.subject} onChange={(e) => setAttendanceForm({ ...attendanceForm, subject: e.target.value })} placeholder="Subject" className="w-full p-3 bg-[#444444] border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 text-white" required />
                  <input type="text" value={attendanceForm.section} onChange={(e) => setAttendanceForm({ ...attendanceForm, section: e.target.value })} placeholder="Section" className="w-full p-3 bg-[#444444] border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 text-white" required />
                  <input type="number" value={attendanceForm.semester} onChange={(e) => setAttendanceForm({ ...attendanceForm, semester: parseInt(e.target.value) })} placeholder="Semester" className="w-full p-3 bg-[#444444] border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 text-white" required />
                  <input type="file" multiple onChange={(e) => setAttendanceForm({ ...attendanceForm, files: Array.from(e.target.files || []) })} className="w-full p-3 bg-[#444444] border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 text-white" required />
                  <motion.button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded transition-colors w-full" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} disabled={attendanceLoading}>
                    Submit Attendance
                  </motion.button>
                </form>
              </motion.div>
            )}

            {showStatsSection && records.length > 0 && (
              <motion.div className="mb-10 bg-[#3A3A3A] p-6 rounded-lg shadow-inner" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8, delay: 0.2 }}>
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-purple-600 mb-4">Generate Statistics</h2>
                <form onSubmit={handleStatsGenerate} className="space-y-4">
                  <motion.button type="submit" className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-6 rounded transition-colors w-full" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} disabled={attendanceLoading}>
                    Generate Stats
                  </motion.button>
                  {stats && (
                    <div>
                      <p>Total Sessions: {stats.total_sessions}</p>
                      <h3>Above 75%:</h3>
                      <ul>{stats.above_75.map((s, i) => <li key={i}>{s.student}: {s.percentage}%</li>)}</ul>
                      <h3>Below 75%:</h3>
                      <ul>{stats.below_75.map((s, i) => <li key={i}>{s.student}: {s.percentage}%</li>)}</ul>
                      <a href={stats.pdf_url} target="_blank" rel="noopener noreferrer" className="text-blue-400">Download PDF</a>
                    </div>
                  )}
                </form>
              </motion.div>
            )}

            {showStudentsSection && (
              <motion.div className="mb-10 bg-[#3A3A3A] p-6 rounded-lg shadow-inner" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8, delay: 0.2 }}>
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-purple-600 mb-4">View Students</h2>
                <form onSubmit={handleStudentsFetch} className="space-y-4">
                  <input type="text" value={attendanceForm.branch} onChange={(e) => setAttendanceForm({ ...attendanceForm, branch: e.target.value })} placeholder="Branch" className="w-full p-3 bg-[#444444] border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-teal-400 text-white" required />
                  <input type="number" value={attendanceForm.semester} onChange={(e) => setAttendanceForm({ ...attendanceForm, semester: parseInt(e.target.value) })} placeholder="Semester" className="w-full p-3 bg-[#444444] border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-teal-400 text-white" required />
                  <input type="text" value={attendanceForm.section} onChange={(e) => setAttendanceForm({ ...attendanceForm, section: e.target.value })} placeholder="Section" className="w-full p-3 bg-[#444444] border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-teal-400 text-white" required />
                  <motion.button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-6 rounded transition-colors w-full" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} disabled={studentLoading}>
                    Fetch Students
                  </motion.button>
                  {students.length > 0 && (
                    <ul className="mt-4 space-y-2">
                      {students.map((s, i) => <li key={i}>{s.name} ({s.usn}) - Email: {s.email}</li>)}
                    </ul>
                  )}
                </form>
              </motion.div>
            )}

            {showMarksSection && (
              <motion.div className="mb-10 bg-[#3A3A3A] p-6 rounded-lg shadow-inner" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8, delay: 0.2 }}>
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-purple-600 mb-4">Manage Marks</h2>
                <form onSubmit={handleMarksSubmit} className="space-y-4">
                  <input type="text" value={attendanceForm.branch} onChange={(e) => setAttendanceForm({ ...attendanceForm, branch: e.target.value })} placeholder="Branch" className="w-full p-3 bg-[#444444] border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-purple-400 text-white" required />
                  <input type="number" value={attendanceForm.semester} onChange={(e) => setAttendanceForm({ ...attendanceForm, semester: parseInt(e.target.value) })} placeholder="Semester" className="w-full p-3 bg-[#444444] border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-purple-400 text-white" required />
                  <input type="text" value={attendanceForm.section} onChange={(e) => setAttendanceForm({ ...attendanceForm, section: e.target.value })} placeholder="Section" className="w-full p-3 bg-[#444444] border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-purple-400 text-white" required />
                  <input type="text" value={attendanceForm.subject} onChange={(e) => setAttendanceForm({ ...attendanceForm, subject: e.target.value })} placeholder="Subject" className="w-full p-3 bg-[#444444] border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-purple-400 text-white" required />
                  <input type="number" value={testNumber} onChange={(e) => setTestNumber(parseInt(e.target.value))} placeholder="Test Number" className="w-full p-3 bg-[#444444] border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-purple-400 text-white" required />
                  <textarea value={JSON.stringify(marksData)} onChange={(e) => setMarksData(JSON.parse(e.target.value))} placeholder='[{"student_id": "id", "mark": 50}]' className="w-full p-3 bg-[#444444] border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-purple-400 text-white" rows={4} />
                  <motion.button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded transition-colors w-full" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} disabled={marksLoading}>
                    Submit Marks
                  </motion.button>
                  <button onClick={() => dispatch(fetchMarks({ branch: attendanceForm.branch, semester: attendanceForm.semester, section: attendanceForm.section, subject: attendanceForm.subject, test_number: testNumber }))} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded transition-colors w-full mt-2" disabled={marksLoading}>
                    Fetch Marks
                  </button>
                  {marks.length > 0 && (
                    <ul className="mt-4 space-y-2">
                      {marks.map((m, i) => <li key={i}>{m.student} ({m.usn}): {m.mark}/{m.max_mark}</li>)}
                    </ul>
                  )}
                </form>
              </motion.div>
            )}

            {showLeaveSection && (
              <motion.div className="mb-10 bg-[#3A3A3A] p-6 rounded-lg shadow-inner" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8, delay: 0.2 }}>
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-purple-600 mb-4">Manage Leave Requests</h2>
                <form onSubmit={handleSubmitLeaveRequest} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-300 font-medium mb-2">Start Date</label>
                      <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full p-3 bg-[#444444] border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-green-400 text-white" required />
                    </div>
                    <div>
                      <label className="block text-gray-300 font-medium mb-2">End Date</label>
                      <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full p-3 bg-[#444444] border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-green-400 text-white" required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-300 font-medium mb-2">Reason</label>
                    <textarea value={reason} onChange={(e) => setReason(e.target.value)} className="w-full p-3 bg-[#444444] border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-green-400 text-white" rows={3} placeholder="Enter reason for leave" required />
                  </div>
                  <motion.button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded transition-colors w-full" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} disabled={leaveLoading}>
                    Submit Leave Request
                  </motion.button>
                </form>
                {leaveRequests.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-xl font-semibold text-gray-300">Your Leave Requests</h3>
                    <ul className="space-y-4 mt-2">
                      {leaveRequests.map((lr) => (
                        <motion.li key={lr.id} className="p-4 bg-[#444444] rounded-lg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                          <p className="text-gray-300"><strong>Dates:</strong> {lr.start_date} to {lr.end_date}</p>
                          <p className="text-gray-300"><strong>Reason:</strong> {lr.reason}</p>
                          <p className="text-gray-300"><strong>Status:</strong> {lr.status}</p>
                          <p className="text-gray-300"><strong>Submitted:</strong> {lr.submitted_at}</p>
                          {lr.reviewed_at && <p className="text-gray-300"><strong>Reviewed:</strong> {lr.reviewed_at} by {lr.reviewed_by}</p>}
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            )}

            {showStudentLeaveSection && (
              <motion.div className="mb-10 bg-[#3A3A3A] p-6 rounded-lg shadow-inner" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8, delay: 0.2 }}>
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-600 mb-4">Manage Student Leave Requests</h2>
                {studentRequests.length > 0 ? (
                  <ul className="space-y-4">
                    {studentRequests.map((lr) => (
                      <motion.li key={lr.id} className="p-4 bg-[#444444] rounded-lg flex justify-between items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                        <div>
                          <p className="text-gray-300"><strong>Student:</strong> {lr.student_name || lr.student}</p>
                          <p className="text-gray-300"><strong>Dates:</strong> {lr.start_date} to {lr.end_date}</p>
                          <p className="text-gray-300"><strong>Reason:</strong> {lr.reason}</p>
                          <p className="text-gray-300"><strong>Submitted:</strong> {lr.submitted_at}</p>
                        </div>
                        <div className="flex space-x-2">
                          <motion.button onClick={() => handleManageStudentLeave(lr.id, 'APPROVE')} className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded transition-colors" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} disabled={leaveLoading}>
                            Approve
                          </motion.button>
                          <motion.button onClick={() => handleManageStudentLeave(lr.id, 'REJECT')} className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded transition-colors" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} disabled={leaveLoading}>
                            Reject
                          </motion.button>
                        </div>
                      </motion.li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-400">No pending student leave requests.</p>
                )}
              </motion.div>
            )}

            {showAnnouncementsSection && (
              <motion.div className="mb-10 bg-[#3A3A3A] p-6 rounded-lg shadow-inner" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8, delay: 0.2 }}>
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-purple-600 mb-4">Announcements</h2>
                {announcements.length > 0 ? (
                  <ul className="space-y-4">
                    {announcements.map((a, i) => (
                      <motion.li key={i} className="p-4 bg-[#444444] rounded-lg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                        <h3 className="text-lg font-semibold text-gray-300">{a.title}</h3>
                        <p className="text-gray-400 mt-2">{a.content}</p>
                        <p className="text-gray-500 text-sm mt-1">Branch: {a.branch} | Posted on {a.created_at} by {a.created_by}</p>
                      </motion.li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-400">No announcements available.</p>
                )}
              </motion.div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
};

export default FacultyDashboard;