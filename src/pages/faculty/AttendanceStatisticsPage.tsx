import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import { FileText, Download, BarChart, Users } from 'lucide-react';
import axios from 'axios';
import Header from '../../components/Header';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import Confetti from 'react-confetti';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface AttendanceFile { id: string; name: string; }
interface AttendanceStatistics { above75: Array<{ student: string; percentage: number }>; below75: Array<{ student: string; percentage: number }>; }

const AttendanceStatisticsPage: React.FC = () => {
  const navigate = useNavigate();
  const { semester, section, subject, token } = useUser();
  const [files, setFiles] = useState<AttendanceFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [statistics, setStatistics] = useState<AttendanceStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const fetchFiles = async () => {
      if (!token) {
        setError('You must be logged in to view attendance files.');
        return;
      }
      try {
        const response = await axios.get('http://localhost:8000/api/attendance-files/', {
          params: { semester, section, subject },
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.data.success) setFiles(response.data.files);
        else setError('Failed to load attendance files');
      } catch (err) {
        setError('An error occurred while fetching attendance files');
      }
    };
    fetchFiles();
  }, [semester, section, subject, token]);

  const generateStatistics = async () => {
    if (!selectedFile) {
      setError('Please select an attendance file');
      return;
    }
    if (!token) {
      setError('You must be logged in to generate statistics.');
      return;
    }

    setLoading(true);
    setError('');
    setStatistics(null);
    setPdfUrl('');
    setShowConfetti(false);

    try {
      const response = await axios.post('http://localhost:8000/api/generate-statistics/', { file_id: selectedFile }, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.data.success) {
        setStatistics({ above75: response.data.above_75, below75: response.data.below_75 });
        setPdfUrl(response.data.pdf_url);
        if (response.data.above_75.length > response.data.below_75.length) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 5000); // Confetti for 5 seconds
        }
      } else {
        setError(response.data.message || 'Failed to generate statistics');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred while generating statistics');
    } finally {
      setLoading(false);
    }
  };

  // Chart Data for Graphical Analysis
  const chartData = statistics
    ? {
        labels: ['Above 75%', 'Below 75%'],
        datasets: [
          {
            label: 'Student Count',
            data: [statistics.above75.length, statistics.below75.length],
            backgroundColor: ['#4BFFB3', '#FF6B6B'],
            borderColor: ['#34D399', '#F87171'],
            borderWidth: 2,
            borderRadius: 5,
          },
        ],
      }
    : null;

  const chartOptions = {
    responsive: true,
    animation: {
      duration: 2000,
      easing: 'easeInOutQuart',
      onProgress: (animation: any) => {
        const chart = animation.chart;
        chart.data.datasets[0].data = chart.data.datasets[0].data.map((value: number) =>
          value * (animation.currentStep / animation.numSteps)
        );
        chart.update();
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Attendance Distribution',
        font: { size: 24, family: 'Poppins', weight: 'bold' },
        color: '#1F2937',
      },
      tooltip: {
        backgroundColor: 'rgba(55, 65, 81, 0.9)',
        titleFont: { size: 16, family: 'Poppins' },
        bodyFont: { size: 14, family: 'Poppins' },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          font: { size: 12, family: 'Poppins' },
          color: '#4B5563',
        },
        title: {
          display: true,
          text: 'Number of Students',
          font: { size: 16, family: 'Poppins' },
          color: '#4B5563',
        },
        grid: { color: 'rgba(209, 213, 219, 0.3)' },
      },
      x: {
        ticks: { font: { size: 14, family: 'Poppins' }, color: '#4B5563' },
        grid: { display: false },
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 flex flex-col relative">
      <Header />
      {showConfetti && <Confetti width={window.innerWidth} height={window.innerHeight} />}
      <main className="flex-grow p-6">
        <motion.div
          className="max-w-4xl mx-auto bg-white rounded-xl shadow-2xl p-8"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <h1 className="text-4xl font-extrabold text-gray-800 mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
            Attendance Statistics
          </h1>
          <div className="flex justify-between items-center mb-6">
            <p className="text-lg text-gray-600">
              Semester {semester} | Section {section} | Subject: {subject}
            </p>
            <motion.button
              onClick={() => navigate(-1)}
              className="flex items-center bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft size={18} className="mr-1" /> Back
            </motion.button>
          </div>

          {error && (
            <motion.div
              className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              {error}
            </motion.div>
          )}

          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <label htmlFor="file" className="block text-gray-700 font-medium mb-2 flex items-center">
              <FileText size={18} className="mr-2 text-blue-600" /> Select Attendance File
            </label>
            {files.length > 0 ? (
              <div className="flex items-center gap-4">
                <select
                  id="file"
                  value={selectedFile}
                  onChange={(e) => setSelectedFile(e.target.value)}
                  className="flex-grow p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <option value="">-- Select a file --</option>
                  {files.map(file => (
                    <option key={file.id} value={file.id}>{file.name}</option>
                  ))}
                </select>
                <motion.button
                  onClick={generateStatistics}
                  disabled={!selectedFile || loading}
                  className={`flex items-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded transition-colors ${!selectedFile || loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <BarChart size={18} className="mr-2" />
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Generating...
                    </span>
                  ) : (
                    'Generate Statistics'
                  )}
                </motion.button>
              </div>
            ) : (
              <p className="text-gray-500">No attendance files available</p>
            )}
          </motion.div>

          {statistics && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <h3 className="text-2xl font-bold text-gray-800 mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
                Attendance Results
              </h3>

              {/* Bar Chart */}
              <motion.div
                className="bg-gray-50 p-6 rounded-lg shadow-inner mb-6"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                {chartData && <Bar data={chartData} options={chartOptions} />}
              </motion.div>

              {/* Detailed Tables */}
              <div className="grid md:grid-cols-2 gap-6">
                <motion.div
                  className="bg-green-50 p-4 rounded-lg border border-green-200"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                >
                  <h4 className="font-medium text-green-800 mb-3 flex items-center">
                    <Users size={18} className="mr-2" /> Students with ≥75% Attendance
                  </h4>
                  {statistics.above75.length > 0 ? (
                    <div className="max-h-80 overflow-y-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gradient-to-r from-green-200 to-green-100">
                            <th className="text-left p-2 font-semibold">Student</th>
                            <th className="text-right p-2 font-semibold">Percentage</th>
                          </tr>
                        </thead>
                        <tbody>
                          {statistics.above75.map((item, index) => (
                            <motion.tr
                              key={`${item.student}-${index}`}
                              className="border-b border-green-100 hover:bg-green-100 transition-colors"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.3, delay: index * 0.05 }}
                            >
                              <td className="p-2 text-gray-700">{item.student}</td>
                              <td className="text-right p-2 font-medium text-green-700">{item.percentage.toFixed(2)}%</td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-600">No students with attendance ≥75%</p>
                  )}
                </motion.div>
                <motion.div
                  className="bg-red-50 p-4 rounded-lg border border-red-200"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                >
                  <h4 className="font-medium text-red-800 mb-3 flex items-center">
                    <Users size={18} className="mr-2" /> Students with &lt;75% Attendance
                  </h4>
                  {statistics.below75.length > 0 ? (
                    <div className="max-h-80 overflow-y-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gradient-to-r from-red-200 to-red-100">
                            <th className="text-left p-2 font-semibold">Student</th>
                            <th className="text-right p-2 font-semibold">Percentage</th>
                          </tr>
                        </thead>
                        <tbody>
                          {statistics.below75.map((item, index) => (
                            <motion.tr
                              key={`${item.student}-${index}`}
                              className="border-b border-red-100 hover:bg-red-100 transition-colors"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.3, delay: index * 0.05 }}
                            >
                              <td className="p-2 text-gray-700">{item.student}</td>
                              <td className="text-right p-2 font-medium text-red-700">{item.percentage.toFixed(2)}%</td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-600">No students with attendance &lt;75%</p>
                  )}
                </motion.div>
              </div>

              {pdfUrl && (
                <motion.div
                  className="mt-6 flex justify-center"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 1 }}
                >
                  <a
                    href={pdfUrl}
                    download
                    className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-full transition-colors shadow-md"
                  >
                    <Download size={18} className="mr-2" /> Download PDF Report
                  </a>
                </motion.div>
              )}
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default AttendanceStatisticsPage;