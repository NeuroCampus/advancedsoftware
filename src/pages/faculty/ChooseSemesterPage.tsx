// src/pages/faculty/ChooseSemesterPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import { BookOpen, Users, BookMarked } from 'lucide-react';
import Header from '../../components/Header';
import { motion } from 'framer-motion';

const ChooseSemesterPage: React.FC = () => {
  const { setSemester, setSection, setSubject, token } = useUser();
  const [selectedSemester, setSelectedSemester] = useState('1');
  const [selectedSection, setSelectedSection] = useState('A');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const semesters = Array.from({ length: 8 }, (_, i) => (i + 1).toString());
  const sections = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('You must be logged in to proceed.');
      return;
    }
    if (!selectedSubject.trim()) {
      setError('Please enter a subject name');
      return;
    }
    setSemester(selectedSemester);
    setSection(selectedSection);
    setSubject(selectedSubject);
    navigate('/options');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 flex flex-col">
      <Header />
      <main className="flex-grow flex items-center justify-center p-6">
        <motion.div
          className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <h2 className="text-3xl font-extrabold text-gray-800 mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600 text-center">
            Choose Class Details
          </h2>
          {error && (
            <motion.div
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {error}
            </motion.div>
          )}
          <form onSubmit={handleSubmit}>
            <motion.div className="mb-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
              <label htmlFor="semester" className="block text-gray-700 font-medium mb-2 flex items-center">
                <BookOpen size={18} className="mr-2 text-blue-600" /> Semester
              </label>
              <select
                id="semester"
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                required
              >
                {semesters.map((sem) => (
                  <option key={sem} value={sem}>
                    Semester {sem}
                  </option>
                ))}
              </select>
            </motion.div>
            <motion.div className="mb-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
              <label htmlFor="section" className="block text-gray-700 font-medium mb-2 flex items-center">
                <Users size={18} className="mr-2 text-blue-600" /> Section
              </label>
              <select
                id="section"
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                required
              >
                {sections.map((sec) => (
                  <option key={sec} value={sec}>
                    Section {sec}
                  </option>
                ))}
              </select>
            </motion.div>
            <motion.div className="mb-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
              <label htmlFor="subject" className="block text-gray-700 font-medium mb-2 flex items-center">
                <BookMarked size={18} className="mr-2 text-blue-600" /> Subject
              </label>
              <input
                type="text"
                id="subject"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                placeholder="Enter subject name"
                required
              />
            </motion.div>
            <motion.button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              Continue
            </motion.button>
          </form>
        </motion.div>
      </main>
    </div>
  );
};

export default ChooseSemesterPage;