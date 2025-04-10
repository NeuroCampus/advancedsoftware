// src/pages/faculty/FacultyDashboard.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import { Calendar, LogOut, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import Header from '../../components/Header';
import axios from 'axios';

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

interface StudentLeaveRequest {
  id: number;
  student: string;
  student_name?: string;
  start_date: string;
  end_date: string;
  reason: string;
  submitted_at: string;
}

const FacultyDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { token, role, logout } = useUser();

  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [studentLeaveRequests, setStudentLeaveRequests] = useState<StudentLeaveRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [showLeaveSection, setShowLeaveSection] = useState<boolean>(false);
  const [showStudentLeaveSection, setShowStudentLeaveSection] = useState<boolean>(false);

  if (!token || role !== 'teacher') {
    navigate('/login');
    return null;
  }

  useEffect(() => {
    const fetchLeaveRequests = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await axios.get('http://localhost:8000/api/faculty/leave-requests/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.success) {
          setLeaveRequests(response.data.leave_requests || []);
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
  }, [token, logout]);

  useEffect(() => {
    const fetchStudentLeaveRequests = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await axios.get('http://localhost:8000/api/faculty/student-leave-requests/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.success) {
          setStudentLeaveRequests(response.data.leave_requests || []);
        } else {
          setError(response.data.message || 'Failed to fetch student leave requests');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error fetching student leave requests');
        if (err.response?.status === 401) logout();
      } finally {
        setLoading(false);
      }
    };

    fetchStudentLeaveRequests();
  }, [token, logout]);

  const handleSubmitLeaveRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('Session expired. Please log in again.');
      logout();
      navigate('/login');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await axios.post(
        'http://localhost:8000/api/faculty/submit-leave-request/',
        { start_date: startDate, end_date: endDate, reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setSuccess('Leave request submitted successfully!');
        setLeaveRequests([
          ...leaveRequests,
          {
            id: response.data.leave_id,
            start_date: startDate,
            end_date: endDate,
            reason,
            status: 'PENDING',
            submitted_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
            reviewed_at: null,
            reviewed_by: null,
          },
        ]);
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

  const handleManageStudentLeave = async (leaveId: number, action: 'APPROVE' | 'REJECT') => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await axios.post(
        'http://localhost:8000/api/faculty/manage-student-leave-request/',
        { leave_id: leaveId, action },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setSuccess(`Student leave request ${action.toLowerCase()}d successfully!`);
        setStudentLeaveRequests(studentLeaveRequests.filter((lr) => lr.id !== leaveId));
        setTimeout(() => setSuccess(''), 4000);
      } else {
        setError(response.data.message || `Failed to ${action.toLowerCase()} student leave request`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || `Error ${action.toLowerCase()}ing student leave request`);
      if (err.response?.status === 401) logout();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 flex flex-col">
      <Header />
      <main className="flex-grow p-6">
        <motion.div
          className="max-w-4xl mx-auto bg-white rounded-xl shadow-2xl p-8"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-4xl font-extrabold text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
              Faculty Dashboard
            </h1>
            <motion.button
              onClick={() => {
                logout();
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
          <p className="text-lg text-gray-600 mb-6">Welcome, Faculty! Manage attendance and leave requests here.</p>

          <motion.button
            onClick={() => navigate('/choose-semester')}
            className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-full transition-colors shadow-md w-full max-w-xs mx-auto mb-4"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Calendar size={24} className="mr-2" />
            Take Attendance Now
          </motion.button>

          <motion.button
            onClick={() => setShowLeaveSection(!showLeaveSection)}
            className="flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-full transition-colors shadow-md w-full max-w-xs mx-auto mb-4"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FileText size={24} className="mr-2" />
            {showLeaveSection ? 'Hide Leave Requests' : 'Manage Leave Requests'}
          </motion.button>

          <div className="relative w-full max-w-xs mx-auto mb-8">
            <motion.button
              onClick={() => setShowStudentLeaveSection(!showStudentLeaveSection)}
              className="flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-6 rounded-full transition-colors shadow-md w-full"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FileText size={24} className="mr-2" />
              {showStudentLeaveSection ? 'Hide Student Leave Requests' : 'Manage Student Leave'}
            </motion.button>
            {studentLeaveRequests.length > 0 && (
              <motion.span
                className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                {studentLeaveRequests.length}
              </motion.span>
            )}
          </div>

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
              Loading...
            </motion.p>
          ) : (
            <>
              {showLeaveSection && (
                <>
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
                            <p>
                              <strong>Status:</strong>{' '}
                              <span
                                className={
                                  lr.status === 'APPROVED'
                                    ? 'text-green-600'
                                    : lr.status === 'REJECTED'
                                    ? 'text-red-600'
                                    : 'text-yellow-600'
                                }
                              >
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

              {showStudentLeaveSection && (
                <motion.div
                  className="mt-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <h2 className="text-2xl font-bold text-gray-800 mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
                    Student Leave Requests (Pending)
                  </h2>
                  {studentLeaveRequests.length > 0 ? (
                    <ul className="space-y-4">
                      {studentLeaveRequests.map((lr) => (
                        <motion.li
                          key={lr.id}
                          className="p-4 bg-gray-50 rounded-lg shadow-sm flex justify-between items-center"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div>
                            <p>
                              <strong>Student:</strong>{' '}
                              {lr.student_name ? `${lr.student_name} (${lr.student})` : lr.student}
                            </p>
                            <p><strong>Dates:</strong> {lr.start_date} to {lr.end_date}</p>
                            <p><strong>Reason:</strong> {lr.reason}</p>
                            <p><strong>Submitted:</strong> {lr.submitted_at}</p>
                          </div>
                          <div className="flex space-x-2">
                            <motion.button
                              onClick={() => handleManageStudentLeave(lr.id, 'APPROVE')}
                              className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded transition-colors"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              disabled={loading}
                            >
                              Approve
                            </motion.button>
                            <motion.button
                              onClick={() => handleManageStudentLeave(lr.id, 'REJECT')}
                              className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded transition-colors"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              disabled={loading}
                            >
                              Reject
                            </motion.button>
                          </div>
                        </motion.li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500">No pending student leave requests.</p>
                  )}
                </motion.div>
              )}
            </>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default FacultyDashboard;