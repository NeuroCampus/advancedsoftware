
import axios from 'axios';

// Base API configuration
const api = axios.create({
  baseURL: 'https://api.college-management.example',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle response
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth Services
export const authService = {
  login: (credentials: { username: string; password: string }) => 
    api.post('/login/', credentials),
  forgotPassword: (email: string) => 
    api.post('/forgot-password/', { email }),
  verifyOtp: (data: { user_id: string; otp: string }) => 
    api.post('/verify-otp/', data),
  resendOtp: (user_id: string) => 
    api.post('/resend-otp/', { user_id }),
  resetPassword: (data: { user_id: string; otp: string; new_password: string }) => 
    api.post('/reset-password/', data),
};

// Student Services
export const studentService = {
  getDashboard: () => api.get('/student/dashboard/'),
  getTimetable: () => api.get('/student/timetable/'),
  getWeeklySchedule: () => api.get('/student/weekly-schedule/'),
  getAttendance: () => api.get('/student/attendance/'),
  getInternalMarks: () => api.get('/student/internal-marks/'),
  submitLeaveRequest: (data: { start_date: string; end_date: string; reason: string }) => 
    api.post('/student/submit-leave-request/', data),
  getLeaveRequests: () => api.get('/student/leave-requests/'),
  uploadCertificate: (data: FormData) => 
    api.post('/student/upload-certificate/', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  getCertificates: () => api.get('/student/certificates/'),
  deleteCertificate: (certificate_id: string) => 
    api.post('/student/delete-certificate/', { certificate_id }),
  updateProfile: (data: FormData) => 
    api.post('/student/update-profile/', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  getAnnouncements: () => api.get('/student/announcements/'),
  getStudyMaterials: (subject_id: string) => 
    api.get('/student/study-materials/', { params: { subject_id } }),
  getChats: () => api.get('/student/chat/'),
  sendMessage: (data: { channel_id: string; message: string }) => 
    api.post('/student/chat/', data),
  getNotifications: () => api.get('/student/notifications/'),
};

// Faculty Services
export const facultyService = {
  getDashboard: () => api.get('/faculty/dashboard/'),
  takeAttendance: (data: { 
    subject_id: string; 
    date: string; 
    students: { student_id: string; present: boolean }[] 
  }) => api.post('/faculty/take-attendance/', data),
  uploadMarks: (data: FormData) => 
    api.post('/faculty/upload-marks/', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  applyLeave: (data: { start_date: string; end_date: string; reason: string; type: string }) => 
    api.post('/faculty/apply-leave/', data),
  getAttendanceRecords: (subject_id: string) => 
    api.get('/faculty/attendance-records/', { params: { subject_id } }),
  createAnnouncement: (data: { title: string; message: string; target: string[] }) => 
    api.post('/faculty/announcements/', data),
  getProctorStudents: () => api.get('/faculty/proctor-students/'),
  manageStudentLeave: (data: { leave_id: string; action: 'approve' | 'reject'; comment?: string }) => 
    api.post('/faculty/manage-student-leave/', data),
  getTimetable: () => api.get('/faculty/timetable/'),
  getChats: () => api.get('/faculty/chat/'),
  sendMessage: (data: { channel_id: string; message: string }) => 
    api.post('/faculty/chat/', data),
  updateProfile: (data: { name?: string; email?: string }) => 
    api.post('/faculty/profile/', data),
  scheduleMentoring: (data: { student_id: string; date: string; time: string; topic: string }) => 
    api.post('/faculty/schedule-mentoring/', data),
  generateStatistics: (data: { subject_id: string; type: 'attendance' | 'marks' }) => 
    api.post('/faculty/generate-statistics/', data),
  downloadPdf: (filename: string) => 
    api.get(`/faculty/download-pdf/${filename}/`, { responseType: 'blob' }),
};

// HOD Services
export const hodService = {
  getDashboardStats: () => api.get('/hod/dashboard-stats/'),
  getLowAttendanceStudents: () => api.get('/hod/low-attendance/'),
  manageSemesters: (data: { action: 'create' | 'update'; semester_id?: string; number: number }) => 
    api.post('/hod/semesters/', data),
  manageSections: (data: { 
    action: 'create' | 'update'; 
    section_id?: string; 
    semester_id: string; 
    name: string 
  }) => api.post('/hod/sections/', data),
  manageStudents: (data: FormData) => 
    api.post('/hod/students/', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  manageSubjects: (data: { 
    action: 'create' | 'update'; 
    subject_id?: string; 
    name: string; 
    code: string; 
    semester_id: string 
  }) => api.post('/hod/subjects/', data),
  manageFacultyAssignments: (data: { 
    action: 'create' | 'update' | 'delete'; 
    assignment_id?: string; 
    faculty_id: string; 
    subject_id: string; 
    section_id: string 
  }) => api.post('/hod/faculty-assignments/', data),
  manageTimetable: (data: { 
    action: 'create' | 'update' | 'delete'; 
    timetable_id?: string; 
    day: string; 
    start_time: string; 
    end_time: string; 
    subject_id: string; 
    section_id: string; 
    room: string 
  }) => api.post('/hod/timetable/', data),
  manageLeaves: (data: { 
    action: 'apply' | 'approve' | 'reject'; 
    leave_id?: string; 
    start_date?: string; 
    end_date?: string; 
    reason?: string; 
    comment?: string 
  }) => api.post('/hod/leaves/', data),
  getAttendance: (data: { semester_id?: string; section_id?: string }) => 
    api.get('/hod/attendance/', { params: data }),
  getMarks: (data: { semester_id?: string; section_id?: string; subject_id?: string }) => 
    api.get('/hod/marks/', { params: data }),
  createAnnouncement: (data: { 
    title: string; 
    message: string; 
    target_type: 'students' | 'faculty' | 'all'; 
    semester_id?: string; 
    section_id?: string 
  }) => api.post('/hod/announcements/', data),
  sendNotification: (data: { 
    title: string; 
    message: string; 
    recipients: string[]; 
  }) => api.post('/hod/notifications/', data),
  assignProctor: (data: { faculty_id: string; student_ids: string[] }) => 
    api.post('/hod/proctors/', data),
  getChats: () => api.get('/hod/chat/'),
  sendMessage: (data: { channel_id: string; message: string }) => 
    api.post('/hod/chat/', data),
  updateProfile: (data: FormData) => 
    api.post('/hod/profile/', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
};

// Admin Services
export const adminService = {
  getStatsOverview: () => api.get('/admin/stats-overview/'),
  enrollUser: (data: { 
    name: string; 
    email: string; 
    role: 'faculty' | 'hod'; 
    department?: string 
  }) => api.post('/admin/enroll-user/', data),
  bulkUploadFaculty: (data: FormData) => 
    api.post('/admin/bulk-upload-faculty/', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  manageBranches: (data: { 
    action: 'create' | 'update' | 'delete'; 
    branch_id?: string; 
    name: string; 
    hod_id?: string 
  }) => api.post('/admin/branches/', data),
  manageBranch: (branch_id: string, data: { 
    action: 'update' | 'delete'; 
    name?: string; 
    hod_id?: string 
  }) => api.post(`/admin/branches/${branch_id}/`, data),
  manageNotifications: (data: { 
    title: string; 
    message: string; 
    target: 'all' | 'faculty' | 'hod' | 'students'; 
    schedule_time?: string 
  }) => api.post('/admin/notifications/', data),
  manageHodLeaves: (data: { 
    leave_id: string; 
    action: 'approve' | 'reject'; 
    comment?: string 
  }) => api.post('/admin/hod-leaves/', data),
  getUserDirectory: (filters?: { 
    role?: 'admin' | 'hod' | 'faculty' | 'student'; 
    status?: 'active' | 'inactive' 
  }) => api.get('/admin/users/', { params: filters }),
};

export default api;
