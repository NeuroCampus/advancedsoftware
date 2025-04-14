import React, { createContext, useReducer, useContext } from 'react';
import { TimetableState, TimetableEntry } from './types';

const API_BASE_URL = 'http://localhost:8000/api';

const initialState: TimetableState = {
  entries: [],
  weeklySchedule: null,
  loading: false,
  error: null,
};

type TimetableAction =
  | { type: 'FETCH_TIMETABLE'; payload: TimetableEntry[] }
  | { type: 'FETCH_WEEKLY_SCHEDULE'; payload: { [day: string]: TimetableEntry[] } | null }
  | { type: 'MANAGE_TIMETABLE'; payload: { action: 'create' | 'update' | 'delete'; entry: Partial<TimetableEntry> } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

const timetableReducer = (state: TimetableState, action: TimetableAction): TimetableState => {
  switch (action.type) {
    case 'FETCH_TIMETABLE':
      return { ...state, entries: action.payload, loading: false };
    case 'FETCH_WEEKLY_SCHEDULE':
      return { ...state, weeklySchedule: action.payload, loading: false };
    case 'MANAGE_TIMETABLE':
      const { action: actionType, entry } = action.payload;
      if (actionType === 'delete') {
        return { ...state, entries: state.entries.filter((e) => e.id !== entry.id), loading: false };
      } else if (actionType === 'create' || actionType === 'update') {
        const index = state.entries.findIndex((e) => e.id === entry.id);
        const newEntries = [...state.entries];
        if (index !== -1) newEntries[index] = entry as TimetableEntry;
        else newEntries.push(entry as TimetableEntry);
        return { ...state, entries: newEntries, loading: false };
      }
      return state;
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
};

const TimetableContext = createContext<{ state: TimetableState; dispatch: React.Dispatch<TimetableAction> } | undefined>(undefined);

export const TimetableProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(timetableReducer, initialState);

  return <TimetableContext.Provider value={{ state, dispatch }}>{children}</TimetableContext.Provider>;
};

export const useTimetable = () => {
  const context = useContext(TimetableContext);
  if (context === undefined) {
    throw new Error('useTimetable must be used within a TimetableProvider');
  }
  return context;
};