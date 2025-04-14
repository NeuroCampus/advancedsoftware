export interface User {
  user_id: string | null;
  email: string | null;
  role: "admin" | "hod" | "teacher" | "student" | null;
  token: string | null;
  semester: string | null;
  section: string | null;
  subject: string | null;
  branch: string | null;
}

export interface AuthState {
  user: User;
  students: { id: string; usn: string; name: string; email: string }[];
  branches: { id: string; name: string; hod: string }[];
  faculty: { id: string; username: string; email: string }[];
  loading: boolean;
  error: string | null;
}

export interface TimetableEntry {
  id: number;
  subject: string;
  day: string;
  start_time: string;
  end_time: string;
  section: string;
  faculty: string;
  room_number: string | null;
}

export interface TimetableState {
  entries: TimetableEntry[];
  weeklySchedule: { [day: string]: TimetableEntry[] } | null;
  loading: boolean;
  error: string | null;
}

export interface AttendanceFile {
  id: string;
  name: string;
  branch: string;
  semester: number;
  section: string;
  subject: string;
  file_path: string;
}

export interface Stats {
  above_75: { student: string; percentage: number; present: number; absent: number }[];
  below_75: { student: string; percentage: number; present: number; absent: number }[];
  pdf_url: string;
  total_sessions: number;
}

export interface AttendanceState {
  attendanceFiles: AttendanceFile[];
  stats: Stats | null;
  loading: boolean;
  error: string | null;
}

export interface MarkEntry {
  id: number;
  usn: string;
  subject: string;
  score: number;
  total: number;
  test_number: number;
}

export interface MarksState {
  entries: MarkEntry[];
  loading: boolean;
  error: string | null;
}

export interface LeaveRequest {
  id: number;
  user_id: string;
  reason: string;
  start_date: string;
  end_date: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

export interface LeaveState {
  requests: LeaveRequest[];
  studentRequests: LeaveRequest[];
  loading: boolean;
  error: string | null;
}

export interface Profile {
  username: string;
  email: string;
  name: string;
  usn: string;
  branch: string;
  semester: string;
  section: string;
  proctor: string | null;
}

export interface Announcement {
  title: string;
  content: string;
  created_at: string;
  created_by: string;
  branch: string;
}

export interface StudentState {
  profile: Profile | null;
  announcements: Announcement[];
  loading: boolean;
  error: string | null;
}

export interface HODState {
  internalMarks: MarkEntry[];
  attendanceReports: AttendanceFile[];
  leaveRequests: LeaveRequest[];
  loading: boolean;
  error: string | null;
}

export interface FacultyState {
  pendingAttendance: AttendanceFile[];
  assignmentSubmissions: { subject: string; submitted: number; pending: number }[];
  studentQueries: { id: string; message: string; unread: boolean }[];
  loading: boolean;
  error: string | null;
}