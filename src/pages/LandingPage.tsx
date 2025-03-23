import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { 
  Brain, 
  Shield, 
  Clock, 
  Users, 
  BarChart, 
  CheckCircle,
  ChevronRight
} from 'lucide-react';

const FeatureCard = ({ icon: Icon, title, description, delay }: { 
  icon: React.ElementType; 
  title: string; 
  description: string;
  delay: number;
}) => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.6, delay }}
      className="bg-white rounded-xl p-6 shadow-xl hover:shadow-2xl transition-shadow duration-300"
    >
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-4">
        <Icon className="w-6 h-6 text-blue-600" />
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </motion.div>
  );
};

const StatCard = ({ number, label, delay }: { 
  number: string; 
  label: string;
  delay: number;
}) => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  return (
    <motion.div
      ref={ref}
      initial={{ scale: 0 }}
      animate={inView ? { scale: 1 } : { scale: 0 }}
      transition={{ duration: 0.5, delay }}
      className="bg-white rounded-lg p-6 text-center shadow-lg"
    >
      <h3 className="text-3xl font-bold text-blue-600 mb-2">{number}</h3>
      <p className="text-gray-600">{label}</p>
    </motion.div>
  );
};

const LandingPage: React.FC = () => {
  const [heroRef, heroInView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50">
      {/* Hero Section */}
      <motion.div
        ref={heroRef}
        initial={{ opacity: 0 }}
        animate={heroInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 1 }}
        className="relative overflow-hidden bg-blue-600 text-white"
      >
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-800 opacity-90" />
          <img
            src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80"
            alt="Background"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <img
                src="https://images.unsplash.com/photo-1633409361618-c73427e4e206?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=80&q=80"
                alt="Starlight Technologies"
                className="h-20 mx-auto rounded-full shadow-lg"
              />
            </motion.div>
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-4xl sm:text-6xl font-bold mb-4"
            >
              VisionX
            </motion.h1>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-xl sm:text-2xl text-blue-100 mb-8"
            >
              Next-Generation Attendance Management System
            </motion.p>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <Link
                to="/login"
                className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 md:text-lg"
              >
                Get Started
                <ChevronRight className="ml-2 h-5 w-5" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Features Section */}
      <div className="py-24 bg-gradient-to-b from-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Powered by Advanced Technology
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Experience the future of attendance management
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={Brain}
              title="AI-Powered Recognition"
              description="Advanced facial recognition technology for accurate identification"
              delay={0.2}
            />
            <FeatureCard
              icon={Shield}
              title="Secure & Reliable"
              description="Enterprise-grade security for your attendance data"
              delay={0.4}
            />
            <FeatureCard
              icon={Clock}
              title="Real-time Tracking"
              description="Instant attendance updates and notifications"
              delay={0.6}
            />
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-24 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="text-3xl font-bold text-white sm:text-4xl"
            >
              Trusted by Educational Institutions
            </motion.h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatCard number="99.9%" label="Accuracy Rate" delay={0.2} />
            <StatCard number="50+" label="Institutions" delay={0.4} />
            <StatCard number="10k+" label="Students" delay={0.6} />
            <StatCard number="1M+" label="Attendance Records" delay={0.8} />
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Why Choose VisionX?
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={Users}
              title="Easy Enrollment"
              description="Simple and quick student registration process"
              delay={0.2}
            />
            <FeatureCard
              icon={BarChart}
              title="Detailed Analytics"
              description="Comprehensive attendance reports and insights"
              delay={0.4}
            />
            <FeatureCard
              icon={CheckCircle}
              title="Automated Tracking"
              description="Effortless attendance management system"
              delay={0.6}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">Stalight Technologies</h3>
              <p className="text-gray-400">
                Innovating the future of educational technology
              </p>
            </div>
            <div className="text-right">
              <p className="text-gray-400">© {new Date().getFullYear()} Stalight Technologies</p>
              <p className="text-gray-400">All rights reserved</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;