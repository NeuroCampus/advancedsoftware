// src/context/HODContext.tsx
import React, { createContext, useReducer, useContext, useEffect } from 'react';
import axios from 'axios';
import { HODState, MarkEntry, LeaveRequest, AttendanceFile } from './types';

const API_BASE_URL = 'http://localhost:8000/api';

const initialState: HODState = {
  internalMarks: [],
  attendanceReports: [],
  leaveRequests: [],
  loading: false,
  error: null,
};

type HODAction =
  | { type: 'FETCH_INTERNAL_MARKS'; payload: MarkEntry[] }
  | { type: 'FETCH_ATTENDANCE_REPORTS'; payload: AttendanceFile[] }
  | { type: 'FETCH_LEAVE_REQUESTS'; payload: LeaveRequest[] }
  | { type: 'MANAGE_LEAVE_REQUEST'; payload: { leave_id: number; status: 'approved' | 'rejected' } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

const hodReducer = (state: HODState, action: HODAction): HODState => {
  switch (action.type) {
    case 'FETCH_INTERNAL_MARKS':
      return { ...state, internalMarks: action.payload, loading: false };
    case 'FETCH_ATTENDANCE_REPORTS':
      return { ...state, attendanceReports: action.payload, loading: false };
    case 'FETCH_LEAVE_REQUESTS':
      return { ...state, leaveRequests: action.payload, loading: false };
    case 'MANAGE_LEAVE_REQUEST':
      return {
        ...state,
        leaveRequests: state.leaveRequests.map((lr) =>
          lr.id === action.payload.leave_id ? { ...lr, status: action.payload.status } : lr
        ),
        loading: false,
      };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
};

const HODContext = createContext<{ state: HODState; dispatch: React.Dispatch<HODAction> } | undefined>(undefined);

export const HODProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(hodReducer, initialState);

  useEffect(() => {
    const fetchData = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const token = localStorage.getItem('token');
        const [marksRes, reportsRes, leaveRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/hod/internal-marks`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_BASE_URL}/hod/attendance-reports`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_BASE_URL}/hod/leave-requests`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        dispatch({ type: 'FETCH_INTERNAL_MARKS', payload: marksRes.data });
        dispatch({ type: 'FETCH_ATTENDANCE_REPORTS', payload: reportsRes.data });
        dispatch({ type: 'FETCH_LEAVE_REQUESTS', payload: leaveRes.data });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch HOD data' });
      }
    };
    if (state.user?.token) fetchData();
  }, [state.user?.token]);

  return <HODContext.Provider value={{ state, dispatch }}>{children}</HODContext.Provider>;
};

export const useHOD = () => {
  const context = useContext(HODContext);
  if (context === undefined) throw new Error('useHOD must be used within a HODProvider');
  return context;
};