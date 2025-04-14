// src/context/AttendanceContext.tsx
import React, { createContext, useReducer, useContext, useEffect } from 'react';
import axios from 'axios';
import { AttendanceState, AttendanceFile, Stats } from './types';

const API_BASE_URL = 'http://localhost:8000/api';

const initialState: AttendanceState = {
  attendanceFiles: [],
  stats: null,
  loading: false,
  error: null,
};

type AttendanceAction =
  | { type: 'FETCH_ATTENDANCE_FILES'; payload: AttendanceFile[] }
  | { type: 'GENERATE_STATISTICS'; payload: Stats }
  | { type: 'TAKE_ATTENDANCE'; payload: AttendanceFile[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

const attendanceReducer = (state: AttendanceState, action: AttendanceAction): AttendanceState => {
  switch (action.type) {
    case 'FETCH_ATTENDANCE_FILES':
      return { ...state, attendanceFiles: action.payload, loading: false };
    case 'GENERATE_STATISTICS':
      return { ...state, stats: action.payload, loading: false };
    case 'TAKE_ATTENDANCE':
      return { ...state, attendanceFiles: [...state.attendanceFiles, ...action.payload], loading: false };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
};

const AttendanceContext = createContext<{ state: AttendanceState; dispatch: React.Dispatch<AttendanceAction> } | undefined>(undefined);

export const AttendanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(attendanceReducer, initialState);

  useEffect(() => {
    const fetchAttendanceFiles = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE_URL}/attendance/files`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        dispatch({ type: 'FETCH_ATTENDANCE_FILES', payload: response.data });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch attendance files' });
      }
    };
    if (state.user?.token) fetchAttendanceFiles();
  }, [state.user?.token]);

  return <AttendanceContext.Provider value={{ state, dispatch }}>{children}</AttendanceContext.Provider>;
};

export const useAttendance = () => {
  const context = useContext(AttendanceContext);
  if (context === undefined) throw new Error('useAttendance must be used within an AttendanceProvider');
  return context;
};