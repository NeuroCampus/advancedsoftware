// src/context/FacultyContext.tsx
import React, { createContext, useReducer, useContext, useEffect } from 'react';
import axios from 'axios';
import { FacultyState, AttendanceFile } from './types';

const API_BASE_URL = 'http://localhost:8000/api';

const initialState: FacultyState = {
  pendingAttendance: [],
  assignmentSubmissions: [],
  studentQueries: [],
  loading: false,
  error: null,
};

type FacultyAction =
  | { type: 'FETCH_PENDING_ATTENDANCE'; payload: AttendanceFile[] }
  | { type: 'FETCH_ASSIGNMENT_SUBMISSIONS'; payload: { subject: string; submitted: number; pending: number }[] }
  | { type: 'FETCH_STUDENT_QUERIES'; payload: { id: string; message: string; unread: boolean }[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

const facultyReducer = (state: FacultyState, action: FacultyAction): FacultyState => {
  switch (action.type) {
    case 'FETCH_PENDING_ATTENDANCE':
      return { ...state, pendingAttendance: action.payload, loading: false };
    case 'FETCH_ASSIGNMENT_SUBMISSIONS':
      return { ...state, assignmentSubmissions: action.payload, loading: false };
    case 'FETCH_STUDENT_QUERIES':
      return { ...state, studentQueries: action.payload, loading: false };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
};

const FacultyContext = createContext<{ state: FacultyState; dispatch: React.Dispatch<FacultyAction> } | undefined>(undefined);

export const FacultyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(facultyReducer, initialState);

  useEffect(() => {
    const fetchData = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const token = localStorage.getItem('token');
        const [attendanceRes, assignmentsRes, queriesRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/faculty/pending-attendance`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_BASE_URL}/faculty/assignment-submissions`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_BASE_URL}/faculty/student-queries`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        dispatch({ type: 'FETCH_PENDING_ATTENDANCE', payload: attendanceRes.data });
        dispatch({ type: 'FETCH_ASSIGNMENT_SUBMISSIONS', payload: assignmentsRes.data });
        dispatch({ type: 'FETCH_STUDENT_QUERIES', payload: queriesRes.data });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch faculty data' });
      }
    };
    if (state.user?.token) fetchData();
  }, [state.user?.token]);

  return <FacultyContext.Provider value={{ state, dispatch }}>{children}</FacultyContext.Provider>;
};

export const useFaculty = () => {
  const context = useContext(FacultyContext);
  if (context === undefined) throw new Error('useFaculty must be used within a FacultyProvider');
  return context;
};