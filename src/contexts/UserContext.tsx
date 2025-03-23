import React, { createContext, useState, useContext, ReactNode } from 'react';

interface UserContextType {
  user_id: string | null;
  role: string | null;
  token: string | null;
  semester: string | null;
  section: string | null;
  subject: string | null;
  login: (token: string, userId: string, role: string) => void;
  setSemester: (semester: string | null) => void;
  setSection: (section: string | null) => void;
  setSubject: (subject: string | null) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user_id, setUserId] = useState<string | null>(localStorage.getItem('user_id') || null);
  const [role, setRole] = useState<string | null>(localStorage.getItem('role') || null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token') || null);
  const [semester, setSemester] = useState<string | null>(localStorage.getItem('semester') || null);
  const [section, setSection] = useState<string | null>(localStorage.getItem('section') || null);
  const [subject, setSubject] = useState<string | null>(localStorage.getItem('subject') || null);

  const login = (newToken: string, newUserId: string, newRole: string) => {
    setToken(newToken);
    setUserId(newUserId);
    setRole(newRole);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user_id', newUserId);
    localStorage.setItem('role', newRole);
  };

  const setSemesterHandler = (newSemester: string | null) => {
    setSemester(newSemester);
    if (newSemester) {
      localStorage.setItem('semester', newSemester);
    } else {
      localStorage.removeItem('semester');
    }
  };

  const setSectionHandler = (newSection: string | null) => {
    setSection(newSection);
    if (newSection) {
      localStorage.setItem('section', newSection);
    } else {
      localStorage.removeItem('section');
    }
  };

  const setSubjectHandler = (newSubject: string | null) => {
    setSubject(newSubject);
    if (newSubject) {
      localStorage.setItem('subject', newSubject);
    } else {
      localStorage.removeItem('subject');
    }
  };

  const logout = () => {
    setUserId(null);
    setRole(null);
    setToken(null);
    setSemester(null);
    setSection(null);
    setSubject(null);
    localStorage.clear();
  };

  return (
    <UserContext.Provider
      value={{
        user_id,
        role,
        token,
        semester,
        section,
        subject,
        login,
        setSemester: setSemesterHandler,
        setSection: setSectionHandler,
        setSubject: setSubjectHandler,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};