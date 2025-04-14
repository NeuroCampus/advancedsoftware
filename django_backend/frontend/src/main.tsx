// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { TimetableProvider } from './context/TimetableContext';
import { AttendanceProvider } from './context/AttendanceContext';
import { MarksProvider } from './context/MarksContext';
import { StudentProvider } from './context/StudentContext';
import { HODProvider } from './context/HODContext';
import { FacultyProvider } from './context/FacultyContext';
import { LeaveProvider } from './context/LeaveContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <TimetableProvider>
          <AttendanceProvider>
            <MarksProvider>
              <StudentProvider>
                <HODProvider>
                  <FacultyProvider>
                    <LeaveProvider>
                      <App />
                    </LeaveProvider>
                  </FacultyProvider>
                </HODProvider>
              </StudentProvider>
            </MarksProvider>
          </AttendanceProvider>
        </TimetableProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);