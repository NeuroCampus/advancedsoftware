
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Calendar,
  ClipboardCheck,
  MessageSquare,
  Bell,
  FileText,
  Award,
  User,
  Settings,
  Building,
  BarChart2,
} from 'lucide-react';
import React from 'react';

export const adminNavItems = [
  {
    to: '/admin',
    icon: <LayoutDashboard size={20} />,
    label: 'Dashboard Overview',
    end: true,
  },
  {
    to: '/admin/faculty-management',
    icon: <Users size={20} />,
    label: 'Faculty Management',
  },
  {
    to: '/admin/student-management',
    icon: <Users size={20} />,
    label: 'Student Management',
  },
  {
    to: '/admin/branches',
    icon: <Building size={20} />,
    label: 'Branch Management',
  },
  {
    to: '/admin/timetable',
    icon: <Calendar size={20} />,
    label: 'Timetable Management',
  },
  {
    to: '/admin/leave-approvals',
    icon: <ClipboardCheck size={20} />,
    label: 'Leave Approvals',
  },
  {
    to: '/admin/reports',
    icon: <FileText size={20} />,
    label: 'Reports',
  },
  {
    to: '/admin/notifications',
    icon: <Bell size={20} />,
    label: 'Notifications',
  },
  {
    to: '/admin/analytics',
    icon: <BarChart2 size={20} />,
    label: 'Analytics',
  },
  {
    to: '/admin/settings',
    icon: <Settings size={20} />,
    label: 'Settings',
  },
];

export const hodNavItems = [
  {
    to: '/hod',
    icon: <LayoutDashboard size={20} />,
    label: 'Dashboard Overview',
    end: true,
  },
  {
    to: '/hod/semester-management',
    icon: <BookOpen size={20} />,
    label: 'Semester Management',
  },
  {
    to: '/hod/student-management',
    icon: <Users size={20} />,
    label: 'Student Management',
  },
  {
    to: '/hod/faculty-assignments',
    icon: <Users size={20} />,
    label: 'Faculty Assignments',
  },
  {
    to: '/hod/timetable',
    icon: <Calendar size={20} />,
    label: 'Timetable',
  },
  {
    to: '/hod/leave-management',
    icon: <ClipboardCheck size={20} />,
    label: 'Leave Management',
  },
  {
    to: '/hod/attendance',
    icon: <BarChart2 size={20} />,
    label: 'Attendance Reports',
  },
  {
    to: '/hod/marks',
    icon: <FileText size={20} />,
    label: 'Internal Marks',
  },
  {
    to: '/hod/announcements',
    icon: <Bell size={20} />,
    label: 'Announcements',
  },
  {
    to: '/hod/proctors',
    icon: <Users size={20} />,
    label: 'Proctor Assignment',
  },
  {
    to: '/hod/chat',
    icon: <MessageSquare size={20} />,
    label: 'Chat System',
  },
  {
    to: '/hod/profile',
    icon: <User size={20} />,
    label: 'Profile',
  },
];

export const facultyNavItems = [
  {
    to: '/faculty',
    icon: <LayoutDashboard size={20} />,
    label: 'Dashboard Overview',
    end: true,
  },
  {
    to: '/faculty/timetable',
    icon: <Calendar size={20} />,
    label: 'Timetable',
  },
  {
    to: '/faculty/attendance',
    icon: <ClipboardCheck size={20} />,
    label: 'Take Attendance',
  },
  {
    to: '/faculty/marks',
    icon: <FileText size={20} />,
    label: 'Upload Marks',
  },
  {
    to: '/faculty/leave',
    icon: <Calendar size={20} />,
    label: 'Leave Management',
  },
  {
    to: '/faculty/proctor-students',
    icon: <Users size={20} />,
    label: 'Proctor Students',
  },
  {
    to: '/faculty/announcements',
    icon: <Bell size={20} />,
    label: 'Announcements',
  },
  {
    to: '/faculty/chat',
    icon: <MessageSquare size={20} />,
    label: 'Chat System',
  },
  {
    to: '/faculty/statistics',
    icon: <BarChart2 size={20} />,
    label: 'Statistics',
  },
  {
    to: '/faculty/profile',
    icon: <User size={20} />,
    label: 'Profile',
  },
];

export const studentNavItems = [
  {
    to: '/student',
    icon: <LayoutDashboard size={20} />,
    label: 'Dashboard',
    end: true,
  },
  {
    to: '/student/timetable',
    icon: <Calendar size={20} />,
    label: 'Timetable',
  },
  {
    to: '/student/attendance',
    icon: <ClipboardCheck size={20} />,
    label: 'Attendance',
  },
  {
    to: '/student/internal-marks',
    icon: <FileText size={20} />,
    label: 'Internal Marks',
  },
  {
    to: '/student/leave-requests',
    icon: <Calendar size={20} />,
    label: 'Leave Requests',
  },
  {
    to: '/student/certificates',
    icon: <Award size={20} />,
    label: 'Certificates',
  },
  {
    to: '/student/study-materials',
    icon: <BookOpen size={20} />,
    label: 'Study Materials',
  },
  {
    to: '/student/chat',
    icon: <MessageSquare size={20} />,
    label: 'Chat',
  },
  {
    to: '/student/announcements',
    icon: <Bell size={20} />,
    label: 'Announcements',
  },
  {
    to: '/student/profile',
    icon: <User size={20} />,
    label: 'Profile',
  },
];
