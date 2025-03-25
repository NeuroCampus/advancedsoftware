import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from '../contexts/UserContext';
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
import { LogOut, BarChart2, FileText, CheckCircle, XCircle, Calendar } from 'lucide-react';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const StudentDashboard: React.FC = () => {
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAttendanceSection, setShowAttendanceSection] = useState<boolean>(false); // New state for attendance
  const [showLeaveSection, setShowLeaveSection] = useState<boolean>(false); // Existing state for leave
  const { token, user_id, logout } = useUser();

  // Fetch attendance data on mount
  useEffect(() => {
    const fetchAttendance = async () => {
      if (!token || !user_id) {
        setError('Please log in to view your attendance.');
        return;
      }

      setLoading(true);
      setError('');
      try {
        const response = await axios.get('http://localhost:8000/api/student-attendance/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.success) {
          const data = response.data.attendance;
          if (Object.keys(data).length === 0) {
            setError('No attendance records found for you yet.');
          } else {
            setAttendanceData(data);
          }
        } else {
          setError(response.data.message || 'Failed to fetch attendance');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error fetching attendance data');
        if (err.response?.status === 401) logout();
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [token, user_id, logout]);

  // Fetch leave requests on mount
  useEffect(() => {
    const fetchLeaveRequests = async () => {
      if (!token || !user_id) return;

      setLoading(true);
      setError('');
      try {
        const response = await axios.get('http://localhost:8000/api/student-leave-requests/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.success) {
          setLeaveRequests(response.data.leave_requests);
        } else {
          setError(response.data.message || 'Failed to fetch leave requests');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error fetching leave requests');
        if (err.response?.status === 401) logout();
      } finally {
        setLoading(false);
      }
    };

    fetchLeaveRequests();
  }, [token, user_id, logout]);

  // Handle leave request submission
  const handleSubmitLeaveRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await axios.post(
        'http://localhost:8000/api/submit-student-leave-request/',
        { start_date: startDate, end_date: endDate, reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setSuccess('Leave request submitted successfully!');
        setLeaveRequests([...leaveRequests, {
          id: response.data.leave_id,
          start_date: startDate,
          end_date: endDate,
          reason,
          status: 'PENDING',
          submitted_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
          reviewed_at: null,
          reviewed_by: null,
        }]);
        setStartDate('');
        setEndDate('');
        setReason('');
        setTimeout(() => setSuccess(''), 4000);
      } else {
        setError(response.data.message || 'Failed to submit leave request');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error submitting leave request');
      if (err.response?.status === 401) logout();
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data
  const prepareChartData = () => {
    if (!attendanceData) return null;

    const labels = Array.from(
      new Set(
        Object.values(attendanceData)
          .flat()
          .map((entry: any) => entry.date)
      )
    ).sort();

    const datasets = Object.keys(attendanceData).map((subject, index) => {
      const colors = ['#4BFFB3', '#FF6B6B', '#4D96FF', '#FFD93D', '#9B59B6'];
      const color = colors[index % colors.length];
      return {
        label: subject,
        data: labels.map((date) => {
          const entry = attendanceData[subject].find((e: any) => e.date === date);
          return entry ? entry.status : null;
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
    animation: {
      duration: 2000,
      easing: 'easeInOutQuart',
      onProgress: (animation: any) => {
        const chart = animation.chart;
        chart.data.datasets.forEach((dataset: any) => {
          dataset.data = dataset.data.map((value: number | null) =>
            value !== null ? value * (animation.currentStep / animation.numSteps) : null
          );
        });
        chart.update();
      },
    },
    plugins: {
      legend: { position: 'top' as const, labels: { font: { size: 14, family: 'Poppins' }, color: '#1F2937' } },
      title: { display: true, text: 'Your Attendance Journey', font: { size: 24, family: 'Poppins', weight: 'bold' }, color: '#1F2937' },
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
        ticks: { stepSize: 1, callback: (value: any) => (value === 1 ? 'Present' : 'Absent'), font: { size: 12, family: 'Poppins' }, color: '#4B5563' },
        title: { display: true, text: 'Attendance Status', font: { size: 16, family: 'Poppins' }, color: '#4B5563' },
        grid: { color: 'rgba(209, 213, 219, 0.3)' },
      },
      x: {
        title: { display: true, text: 'Date', font: { size: 16, family: 'Poppins' }, color: '#4B5563' },
        ticks: { font: { size: 12, family: 'Poppins' }, color: '#4B5563' },
        grid: { display: false },
      },
    },
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
            Student Dashboard
          </h1>
          <motion.button
            onClick={logout}
            className="flex items-center bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <LogOut size={18} className="mr-2" />
            Logout
          </motion.button>
        </div>
        <p className="text-lg text-gray-600 mb-6">Hey there! How’s your day going?</p>

        {/* Buttons to toggle sections */}
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-8">
          <motion.button
            onClick={() => setShowAttendanceSection(!showAttendanceSection)}
            className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-full transition-colors shadow-md w-full sm:w-auto"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <BarChart2 size={24} className="mr-2" />
            {showAttendanceSection ? 'Hide Attendance Statistics' : 'View Your Attendance Statistics'}
          </motion.button>
          <motion.button
            onClick={() => setShowLeaveSection(!showLeaveSection)}
            className="flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-full transition-colors shadow-md w-full sm:w-auto"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FileText size={24} className="mr-2" />
            {showLeaveSection ? 'Hide Leave Requests' : 'Manage Leave Requests'}
          </motion.button>
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
            className="text-gray-500 text-lg flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <svg className="animate-spin h-5 w-5 mr-2 text-gray-500" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading your awesome data...
          </motion.p>
        ) : (
          <>
            {/* Attendance Section */}
            {showAttendanceSection && attendanceData && (
              <>
                <motion.div
                  className="mb-10 bg-gray-50 p-6 rounded-lg shadow-inner"
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  {chartData && <Line data={chartData} options={chartOptions} />}
                </motion.div>

                <motion.div
                  className="overflow-x-auto mb-10"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                >
                  <h2 className="text-2xl font-bold text-gray-800 mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
                    Attendance Details
                  </h2>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                        <th className="p-4 font-semibold">Subject</th>
                        <th className="p-4 font-semibold">Date</th>
                        <th className="p-4 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(attendanceData).flatMap(([subject, entries]: [string, any[]]) =>
                        entries.map((entry, idx) => (
                          <motion.tr
                            key={`${subject}-${entry.date}-${idx}`}
                            className="border-b hover:bg-gray-100 transition-colors"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3, delay: idx * 0.05 }}
                          >
                            <td className="p-4 text-gray-700 flex items-center">
                              <Calendar size={18} className="mr-2 text-blue-600" />
                              {subject}
                            </td>
                            <td className="p-4 text-gray-700">{entry.date}</td>
                            <td
                              className={`p-4 font-medium flex items-center ${
                                entry.status === 1 ? 'text-green-600' : 'text-red-600'
                              }`}
                            >
                              {entry.status === 1 ? (
                                <>
                                  <CheckCircle size={18} className="mr-2" />
                                  Present
                                </>
                              ) : (
                                <>
                                  <XCircle size={18} className="mr-2" />
                                  Absent
                                </>
                              )}
                            </td>
                          </motion.tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </motion.div>
              </>
            )}

            {/* Leave Request Section */}
            {showLeaveSection && (
              <>
                {/* Leave Request Form */}
                <motion.div
                  className="mb-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <h2 className="text-2xl font-bold text-gray-800 mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
                    Submit Leave Request
                  </h2>
                  <form onSubmit={handleSubmitLeaveRequest} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-700 font-medium mb-2">Start Date</label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 font-medium mb-2">End Date</label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">Reason</label>
                      <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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

                {/* Leave Requests List */}
                {leaveRequests.length > 0 && (
                  <motion.div
                    className="mt-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <h2 className="text-2xl font-bold text-gray-800 mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
                      Your Leave Requests
                    </h2>
                    <ul className="space-y-4">
                      {leaveRequests.map((lr) => (
                        <motion.li
                          key={lr.id}
                          className="p-4 bg-gray-50 rounded-lg shadow-sm"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          <p><strong>Dates:</strong> {lr.start_date} to {lr.end_date}</p>
                          <p><strong>Reason:</strong> {lr.reason}</p>
                          <p><strong>Status:</strong> 
                            <span className={
                              lr.status === 'APPROVED' ? 'text-green-600' :
                              lr.status === 'REJECTED' ? 'text-red-600' : 'text-yellow-600'
                            }>
                              {lr.status}
                            </span>
                          </p>
                          <p><strong>Submitted:</strong> {lr.submitted_at}</p>
                          {lr.reviewed_at && (
                            <>
                              <p><strong>Reviewed:</strong> {lr.reviewed_at}</p>
                              <p><strong>Reviewed By:</strong> {lr.reviewed_by || 'N/A'}</p>
                            </>
                          )}
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
};

export default StudentDashboard;