import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';
import { RootState } from '../../redux/types';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { motion } from 'framer-motion';
import {
  LogOut,
  BarChart2,
  FileText,
  CheckCircle,
  XCircle,
  Calendar,
  Book,
  Bell,
  User,
} from 'lucide-react';
import { toast } from 'react-toastify';
import {
  fetchAttendanceFiles as fetchStudentAttendance,
  generateStatistics as fetchAttendanceStats,
} from '../../redux/slices/attendanceSlice';
import { fetchTimetable, fetchWeeklySchedule } from '../../redux/slices/timetableSlice';
import { fetchMarks } from '../../redux/slices/marksSlice';
import { fetchLeaveRequests, submitStudentLeaveRequest } from '../../redux/slices/leaveSlice';
import { fetchProfile, fetchAnnouncements } from '../../redux/slices/studentSlice';
import { verifyOtp } from '../../redux/slices/authSlice';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface AttendanceEntry {
  date: string;
  status: 'Present' | 'Absent';
  faculty: string;
  branch: string;
}

interface AttendanceData {
  [subject: string]: AttendanceEntry[];
}

interface LeaveRequest {
  id: number;
  start_date: string;
  end_date: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

interface TimetableEntry {
  subject: string;
  faculty: string;
  day: string;
  start_time: string;
  end_time: string;
}

interface MarkEntry {
  test_number: number;
  mark: number;
  max_mark: number;
  recorded_at: string;
  faculty: string;
}

interface Announcement {
  title: string;
  content: string;
  created_at: string;
  created_by: string;
}

interface Profile {
  username: string;
  email: string;
  name: string;
  usn: string;
  branch: string;
  semester: string;
  section: string;
  proctor: string | null;
}

const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, loading: authLoading, error: authError } = useSelector((state: RootState) => state.auth);
  const { attendanceFiles: attendanceData, stats, loading: attendanceLoading, error: attendanceError } = useSelector(
    (state: RootState) => state.attendance
  );
  const { entries: timetable, weeklySchedule, loading: timetableLoading, error: timetableError } = useSelector(
    (state: RootState) => state.timetable
  );
  const { entries: marksData, loading: marksLoading, error: marksError } = useSelector(
    (state: RootState) => state.marks
  );
  const { requests: leaveRequests, loading: leaveLoading, error: leaveError } = useSelector(
    (state: RootState) => state.leave
  );
  const { profile, announcements, loading: studentLoading, error: studentError } = useSelector(
    (state: RootState) => state.student
  );
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  [reason, setReason] = useState<string>('');
  const [otp, setOtp] = useState<string>(''); // For OTP input
  const [showOtpModal, setShowOtpModal] = useState<boolean>(false);
  const [showAttendanceSection, setShowAttendanceSection] = useState<boolean>(false);
  const [showTimetableSection, setShowTimetableSection] = useState<boolean>(false);
  const [showMarksSection, setShowMarksSection] = useState<boolean>(false);
  const [showLeaveSection, setShowLeaveSection] = useState<boolean>(false);
  const [showProfileSection, setShowProfileSection] = useState<boolean>(false);
  const [showAnnouncementsSection, setShowAnnouncementsSection] = useState<boolean>(false);
  const [showWeeklyScheduleSection, setShowWeeklyScheduleSection] = useState<boolean>(false);

  useEffect(() => {
    if (!user?.token && user?.user_id && user?.role === 'student') {
      setShowOtpModal(true); // Show OTP modal for students
    } else if (user?.token && user?.user_id) {
      dispatch(fetchStudentAttendance({ subject: '', semester: user.semester || '', section: user.section || '' }));
      dispatch(fetchTimetable({ semester: user.semester || '', section: user.section || '' }));
      dispatch(fetchWeeklySchedule({ semester: user.semester || '', section: user.section || '' }));
      dispatch(fetchMarks({ semester: user.semester || '', section: user.section || '', subject: '' }));
      dispatch(fetchLeaveRequests());
      dispatch(fetchProfile());
      dispatch(fetchAnnouncements());
    } else {
      navigate('/login');
    }
  }, [user?.token, user?.user_id, user?.role, user?.semester, user?.section, dispatch, navigate]);

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (user?.user_id && otp) {
      dispatch(verifyOtp({ user_id: user.user_id, otp })).then((action) => {
        if (verifyOtp.fulfilled.match(action)) {
          setShowOtpModal(false);
          toast.success('Login successful!');
        } else {
          toast.error(action.payload as string || 'Invalid OTP');
        }
      });
    }
  };

  const handleSubmitLeaveRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.token) {
      toast.error('Session expired. Please log in again.');
      dispatch(logout());
      navigate('/login');
      return;
    }
    dispatch(
      submitStudentLeaveRequest({
        start_date: startDate,
        end_date: endDate,
        reason,
        user_id: user.user_id || '',
      })
    ).then((action) => {
      if (submitStudentLeaveRequest.fulfilled.match(action)) {
        toast.success('Leave request submitted successfully!');
        setStartDate('');
        setEndDate('');
        setReason('');
      } else if (submitStudentLeaveRequest.rejected.match(action)) {
        toast.error(action.payload as string || 'Failed to submit leave request');
      }
    });
  };

  const prepareChartData = () => {
    if (!attendanceData || !attendanceData.attendance) return null;

    const labels = Array.from(
      new Set(
        Object.values(attendanceData.attendance)
          .flat()
          .map((entry: AttendanceEntry) => entry.date)
      )
    ).sort();

    const datasets = Object.keys(attendanceData.attendance).map((subject, index) => {
      const colors = ['#4BFFB3', '#FF6B6B', '#4D96FF', '#FFD93D', '#9B59B6'];
      const color = colors[index % colors.length];
      return {
        label: subject,
        data: labels.map((date) => {
          const entry = attendanceData.attendance[subject].find((e: AttendanceEntry) => e.date === date);
          return entry ? (entry.status === 'Present' ? 1 : 0) : null;
        }),
        borderColor: color,
        backgroundColor: color + '33',
        fill: false,
        tension: 0.4,
        pointRadius: 5,
        pointHoverRadius: 8,
      };
    });

    return { labels, datasets };
  };

  const chartData = prepareChartData();
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const, labels: { font: { size: 14, family: 'Poppins' }, color: '#D1D5DB' } },
      title: { display: true, text: 'Your Attendance Journey', font: { size: 24, family: 'Poppins', weight: 'bold' }, color: '#D1D5DB' },
      tooltip: {
        backgroundColor: 'rgba(55, 65, 81, 0.9)',
        titleFont: { size: 16, family: 'Poppins' },
        bodyFont: { size: 14, family: 'Poppins' },
        callbacks: { label: (context: any) => (context.raw === 1 ? 'Present' : context.raw === 0 ? 'Absent' : 'No Data') },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 1,
        ticks: { stepSize: 1, callback: (value: any) => (value === 1 ? 'Present' : 'Absent'), font: { size: 12, family: 'Poppins' }, color: '#9CA3AF' },
        title: { display: true, text: 'Attendance Status', font: { size: 16, family: 'Poppins' }, color: '#9CA3AF' },
        grid: { color: 'rgba(209, 213, 219, 0.1)' },
      },
      x: {
        title: { display: true, text: 'Date', font: { size: 16, family: 'Poppins' }, color: '#9CA3AF' },
        ticks: { font: { size: 12, family: 'Poppins' }, color: '#9CA3AF' },
        grid: { display: false },
      },
    },
  };

  const anyLoading = authLoading || attendanceLoading || timetableLoading || marksLoading || leaveLoading || studentLoading;
  const anyError = authError || attendanceError || timetableError || marksError || leaveError || studentError;

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
            Student Dashboard
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
        <p className="text-gray-400 mb-6">Hey there! How’s your day going?</p>

        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-8">
          <motion.button
            onClick={() => setShowAttendanceSection(!showAttendanceSection)}
            className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 font-medium py-3 px-6 rounded-full transition-colors shadow-md w-full sm:w-auto"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <BarChart2 size={24} className="mr-2" />
            {showAttendanceSection ? 'Hide Attendance Statistics' : 'View Your Attendance Statistics'}
          </motion.button>
          <motion.button
            onClick={() => setShowTimetableSection(!showTimetableSection)}
            className="flex items-center justify-center bg-yellow-600 hover:bg-yellow-700 font-medium py-3 px-6 rounded-full transition-colors shadow-md w-full sm:w-auto"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Calendar size={24} className="mr-2" />
            {showTimetableSection ? 'Hide Timetable' : 'View Your Timetable'}
          </motion.button>
          <motion.button
            onClick={() => setShowWeeklyScheduleSection(!showWeeklyScheduleSection)}
            className="flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 font-medium py-3 px-6 rounded-full transition-colors shadow-md w-full sm:w-auto"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Calendar size={24} className="mr-2" />
            {showWeeklyScheduleSection ? 'Hide Weekly Schedule' : 'View Weekly Schedule'}
          </motion.button>
          <motion.button
            onClick={() => setShowMarksSection(!showMarksSection)}
            className="flex items-center justify-center bg-teal-600 hover:bg-teal-700 font-medium py-3 px-6 rounded-full transition-colors shadow-md w-full sm:w-auto"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Book size={24} className="mr-2" />
            {showMarksSection ? 'Hide Marks' : 'View Your Marks'}
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
            onClick={() => setShowProfileSection(!showProfileSection)}
            className="flex items-center justify-center bg-purple-600 hover:bg-purple-700 font-medium py-3 px-6 rounded-full transition-colors shadow-md w-full sm:w-auto"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <User size={24} className="mr-2" />
            {showProfileSection ? 'Hide Profile' : 'View Your Profile'}
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
          <motion.div
            className="mb-6 p-4 bg-red-900/50 text-red-200 rounded-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {anyError}
          </motion.div>
        )}

        {anyLoading && (
          <motion.p
            className="text-gray-400 text-lg flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <svg className="animate-spin h-5 w-5 mr-2 text-gray-400" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading your data...
          </motion.p>
        )}

        {showOtpModal && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-[#2D2D2D] p-6 rounded-lg shadow-xl w-full max-w-md"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-2xl font-bold text-white mb-4">Enter OTP</h2>
              <p className="text-gray-400 mb-4">An OTP has been sent to your email. Please enter it below.</p>
              <form onSubmit={handleOtpSubmit} className="space-y-4">
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full p-3 bg-[#3A3A3A] border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 text-white"
                  placeholder="Enter OTP"
                  required
                />
                <motion.button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Verify OTP
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}

        {!anyLoading && !showOtpModal && (
          <>
            {showAttendanceSection && attendanceData && Object.keys(attendanceData.attendance).length > 0 && (
              <motion.div
                className="mb-10 bg-[#3A3A3A] p-6 rounded-lg shadow-inner"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                {chartData && <Line data={chartData} options={chartOptions} />}
                <div className="mt-4">
                  <h3 className="text-xl font-semibold text-gray-300">Attendance Summary</h3>
                  <ul className="mt-2 space-y-2">
                    {Object.entries(attendanceData.summary || {}).map(([subject, summary]) => (
                      <li key={subject} className="text-gray-400">
                        {subject}: {summary.present}/{summary.total} ({summary.percentage}%)
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}

            {showTimetableSection && timetable.length > 0 && (
              <motion.div
                className="mb-10 bg-[#3A3A3A] p-6 rounded-lg shadow-inner"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600 mb-4">
                  Your Timetable
                </h2>
                <ul className="space-y-4">
                  {timetable.map((entry, index) => (
                    <motion.li
                      key={index}
                      className="p-4 bg-[#444444] rounded-lg"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <p className="text-gray-300"><strong>Subject:</strong> {entry.subject}</p>
                      <p className="text-gray-300"><strong>Faculty:</strong> {entry.faculty}</p>
                      <p className="text-gray-300"><strong>Day:</strong> {entry.day}</p>
                      <p className="text-gray-300"><strong>Time:</strong> {entry.start_time} - {entry.end_time}</p>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            )}

            {showWeeklyScheduleSection && weeklySchedule && (
              <motion.div
                className="mb-10 bg-[#3A3A3A] p-6 rounded-lg shadow-inner"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600 mb-4">
                  Weekly Schedule
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gradient-to-r from-indigo-400 to-purple-600 text-white">
                        <th className="p-4 font-semibold">Day</th>
                        <th className="p-4 font-semibold">Subject</th>
                        <th className="p-4 font-semibold">Faculty</th>
                        <th className="p-4 font-semibold">Start Time</th>
                        <th className="p-4 font-semibold">End Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(weeklySchedule).flatMap(([day, sessions]) =>
                        sessions.map((session, index) => (
                          <motion.tr
                            key={`${day}-${index}`}
                            className="border-b hover:bg-[#444444] transition-colors"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                          >
                            <td className="p-4 text-gray-300">{day}</td>
                            <td className="p-4 text-gray-300">{session.subject}</td>
                            <td className="p-4 text-gray-300">{session.faculty}</td>
                            <td className="p-4 text-gray-300">{session.start_time}</td>
                            <td className="p-4 text-gray-300">{session.end_time}</td>
                          </motion.tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {showMarksSection && Object.keys(marksData).length > 0 && (
              <motion.div
                className="mb-10 bg-[#3A3A3A] p-6 rounded-lg shadow-inner"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600 mb-4">
                  Your Marks
                </h2>
                <ul className="space-y-4">
                  {Object.entries(marksData).map(([subject, marks]) =>
                    marks.map((mark, idx) => (
                      <motion.li
                        key={`${subject}-${idx}`}
                        className="p-4 bg-[#444444] rounded-lg"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <p className="text-gray-300"><strong>Subject:</strong> {subject}</p>
                        <p className="text-gray-300"><strong>Test {mark.test_number}:</strong> {mark.mark}/{mark.max_mark}</p>
                        <p className="text-gray-300"><strong>Recorded:</strong> {mark.recorded_at}</p>
                        <p className="text-gray-300"><strong>Faculty:</strong> {mark.faculty}</p>
                      </motion.li>
                    ))
                  )}
                </ul>
              </motion.div>
            )}

            {showLeaveSection && (
              <>
                <motion.div
                  className="mb-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600 mb-4">
                    Submit Leave Request
                  </h2>
                  <form onSubmit={handleSubmitLeaveRequest} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-300 font-medium mb-2">Start Date</label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full p-3 bg-[#3A3A3A] border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 text-white"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-gray-300 font-medium mb-2">End Date</label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full p-3 bg-[#3A3A3A] border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 text-white"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-gray-300 font-medium mb-2">Reason</label>
                      <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="w-full p-3 bg-[#3A3A3A] border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 text-white"
                        rows={3}
                        placeholder="Enter reason for leave"
                        required
                      />
                    </div>
                    <motion.button
                      type="submit"
                      className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      disabled={loading}
                    >
                      Submit Leave Request
                    </motion.button>
                  </form>
                </motion.div>

                {leaveRequests.length > 0 && (
                  <motion.div
                    className="mt-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600 mb-4">
                      Your Leave Requests
                    </h2>
                    <ul className="space-y-4">
                      {leaveRequests.map((lr) => (
                        <motion.li
                          key={lr.id}
                          className="p-4 bg-[#3A3A3A] rounded-lg shadow-sm"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          <p className="text-gray-300"><strong>Dates:</strong> {lr.start_date} to {lr.end_date}</p>
                          <p className="text-gray-300"><strong>Reason:</strong> {lr.reason}</p>
                          <p>
                            <strong className="text-gray-300">Status:</strong>{' '}
                            <span
                              className={
                                lr.status === 'APPROVED'
                                  ? 'text-green-400'
                                  : lr.status === 'REJECTED'
                                  ? 'text-red-400'
                                  : 'text-yellow-400'
                              }
                            >
                              {lr.status}
                            </span>
                          </p>
                          <p className="text-gray-300"><strong>Submitted:</strong> {lr.submitted_at}</p>
                          {lr.reviewed_at && (
                            <>
                              <p className="text-gray-300"><strong>Reviewed:</strong> {lr.reviewed_at}</p>
                              <p className="text-gray-300"><strong>Reviewed By:</strong> {lr.reviewed_by || 'N/A'}</p>
                            </>
                          )}
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </>
            )}

            {showProfileSection && profile && (
              <motion.div
                className="mb-10 bg-[#3A3A3A] p-6 rounded-lg shadow-inner"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600 mb-4">
                  Your Profile
                </h2>
                <ul className="space-y-4">
                  <li className="text-gray-300"><strong>Username:</strong> {profile.username}</li>
                  <li className="text-gray-300"><strong>Email:</strong> {profile.email}</li>
                  <li className="text-gray-300"><strong>Name:</strong> {profile.name}</li>
                  <li className="text-gray-300"><strong>USN:</strong> {profile.usn}</li>
                  <li className="text-gray-300"><strong>Branch:</strong> {profile.branch}</li>
                  <li className="text-gray-300"><strong>Semester:</strong> {profile.semester}</li>
                  <li className="text-gray-300"><strong>Section:</strong> {profile.section}</li>
                  <li className="text-gray-300"><strong>Proctor:</strong> {profile.proctor || 'N/A'}</li>
                </ul>
              </motion.div>
            )}

            {showAnnouncementsSection && announcements.length > 0 && (
              <motion.div
                className="mb-10 bg-[#3A3A3A] p-6 rounded-lg shadow-inner"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600 mb-4">
                  Announcements
                </h2>
                <ul className="space-y-4">
                  {announcements.map((ann, index) => (
                    <motion.li
                      key={index}
                      className="p-4 bg-[#444444] rounded-lg"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <h3 className="text-lg font-semibold text-gray-300">{ann.title}</h3>
                      <p className="text-gray-400 mt-2">{ann.content}</p>
                      <p className="text-gray-500 text-sm mt-1">Posted on {ann.created_at} by {ann.created_by}</p>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
};

export default StudentDashboard;