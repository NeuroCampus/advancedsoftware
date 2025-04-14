import React, { createContext, useReducer, useContext } from 'react';
import { MarksState, MarkEntry } from './types';

const API_BASE_URL = 'http://localhost:8000/api';

const initialState: MarksState = {
  entries: [],
  loading: false,
  error: null,
};

type MarksAction =
  | { type: 'FETCH_MARKS'; payload: MarkEntry[] }
  | { type: 'ENTER_MARKS'; payload: MarkEntry[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

const marksReducer = (state: MarksState, action: MarksAction): MarksState => {
  switch (action.type) {
    case 'FETCH_MARKS':
      return { ...state, entries: action.payload, loading: false };
    case 'ENTER_MARKS':
      return { ...state, entries: [...state.entries, ...action.payload], loading: false };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
};

const MarksContext = createContext<{ state: MarksState; dispatch: React.Dispatch<MarksAction> } | undefined>(undefined);

export const MarksProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(marksReducer, initialState);

  return <MarksContext.Provider value={{ state, dispatch }}>{children}</MarksContext.Provider>;
};

export const useMarks = () => {
  const context = useContext(MarksContext);
  if (context === undefined) {
    throw new Error('useMarks must be used within a MarksProvider');
  }
  return context;
};