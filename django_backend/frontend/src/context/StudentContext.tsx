import React, { createContext, useReducer, useContext } from 'react';
import { StudentState, Profile, Announcement } from './types';

const API_BASE_URL = 'http://localhost:8000/api';

const initialState: StudentState = {
  profile: null,
  announcements: [],
  loading: false,
  error: null,
};

type StudentAction =
  | { type: 'FETCH_PROFILE'; payload: Profile | null }
  | { type: 'FETCH_ANNOUNCEMENTS'; payload: Announcement[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

const studentReducer = (state: StudentState, action: StudentAction): StudentState => {
  switch (action.type) {
    case 'FETCH_PROFILE':
      return { ...state, profile: action.payload, loading: false };
    case 'FETCH_ANNOUNCEMENTS':
      return { ...state, announcements: action.payload, loading: false };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
};

const StudentContext = createContext<{ state: StudentState; dispatch: React.Dispatch<StudentAction> } | undefined>(undefined);

export const StudentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(studentReducer, initialState);

  return <StudentContext.Provider value={{ state, dispatch }}>{children}</StudentContext.Provider>;
};

export const useStudent = () => {
  const context = useContext(StudentContext);
  if (context === undefined) {
    throw new Error('useStudent must be used within a StudentProvider');
  }
  return context;
};