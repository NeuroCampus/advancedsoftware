// src/context/LeaveContext.tsx
import React, { createContext, useReducer, useContext } from 'react';
import { LeaveState } from './types';

const initialState: LeaveState = {
  requests: [],
  studentRequests: [],
  loading: false,
  error: null,
};

const leaveReducer = (state: LeaveState, action: any): LeaveState => {
  return state; // Placeholder
};

const LeaveContext = createContext<{ state: LeaveState; dispatch: React.Dispatch<any> } | undefined>(undefined);

export const LeaveProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(leaveReducer, initialState);

  return <LeaveContext.Provider value={{ state, dispatch }}>{children}</LeaveContext.Provider>;
};

export const useLeave = () => {
  const context = useContext(LeaveContext);
  if (context === undefined) throw new Error('useLeave must be used within a LeaveProvider');
  return context;
};