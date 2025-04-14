// src/context/AuthContext.tsx
import React, { createContext, useReducer, useContext } from 'react';
import { AuthState, User } from './types';

const API_BASE_URL = 'http://localhost:8000/api';

const initialState: AuthState = {
  user: {
    user_id: localStorage.getItem('user_id') || null,
    email: localStorage.getItem('email') || null,
    role: localStorage.getItem('role') as User['role'] || null,
    token: localStorage.getItem('token') || null,
    semester: localStorage.getItem('semester') || null,
    section: localStorage.getItem('section') || null,
    subject: localStorage.getItem('subject') || null,
    branch: localStorage.getItem('branch') || null,
  },
  students: localStorage.getItem('students') ? JSON.parse(localStorage.getItem('students')!) : [],
  branches: localStorage.getItem('branches') ? JSON.parse(localStorage.getItem('branches')!) : [],
  faculty: localStorage.getItem('faculty') ? JSON.parse(localStorage.getItem('faculty')!) : [],
  loading: false,
  error: null,
};

type AuthAction =
  | { type: 'LOGIN'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'SET_SEMESTER'; payload: string }
  | { type: 'SET_SECTION'; payload: string }
  | { type: 'SET_SUBJECT'; payload: string }
  | { type: 'SET_BRANCH'; payload: string }
  | { type: 'FETCH_STUDENTS'; payload: { students: { id: string; usn: string; name: string; email: string }[] } }
  | { type: 'FETCH_BRANCHES'; payload: { branches: { id: string; name: string; hod: string }[] } }
  | { type: 'FETCH_FACULTY'; payload: { faculty: { id: string; username: string; email: string }[] } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, user: action.payload, loading: false };
    case 'LOGOUT':
      localStorage.clear();
      return { ...state, user: { user_id: null, email: null, role: null, token: null, semester: null, section: null, subject: null, branch: null }, students: [], branches: [], faculty: [], error: null };
    case 'SET_SEMESTER':
      return { ...state, user: { ...state.user, semester: action.payload } };
    case 'SET_SECTION':
      return { ...state, user: { ...state.user, section: action.payload } };
    case 'SET_SUBJECT':
      return { ...state, user: { ...state.user, subject: action.payload } };
    case 'SET_BRANCH':
      return { ...state, user: { ...state.user, branch: action.payload } };
    case 'FETCH_STUDENTS':
      localStorage.setItem('students', JSON.stringify(action.payload.students));
      return { ...state, students: action.payload.students };
    case 'FETCH_BRANCHES':
      localStorage.setItem('branches', JSON.stringify(action.payload.branches));
      return { ...state, branches: action.payload.branches };
    case 'FETCH_FACULTY':
      localStorage.setItem('faculty', JSON.stringify(action.payload.faculty));
      return { ...state, faculty: action.payload.faculty };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
};

const AuthContext = createContext<{ state: AuthState; dispatch: React.Dispatch<AuthAction> } | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  return <AuthContext.Provider value={{ state, dispatch }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};