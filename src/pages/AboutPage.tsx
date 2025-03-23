import { motion } from 'framer-motion';
import { Parallax } from 'react-scroll-parallax';
import { Award, Users, Target, Zap } from 'lucide-react';

const AboutPage = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  return (
    <div className="min-h-screen pt-16">
      {/* Hero Section */}
      <div className="relative h-[60vh] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80"
            alt="Office"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-blue-900/70" />
        </div>
        
        <Parallax translateY={[-20, 20]} className="relative h-full">
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-white">
              <motion.h1
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8 }}
                className="text-5xl md:text-6xl font-bold mb-4"
              >
                About Stalight Technologies
              </motion.h1>
              <motion.p
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-xl text-blue-100"
              >
                Innovating the Future of Educational Technology
              </motion.p>
            </div>
          </div>
        </Parallax>
      </div>

      {/* Mission Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid md:grid-cols-2 gap-12 items-center"
          >
            <motion.div variants={itemVariants}>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
              <p className="text-lg text-gray-600 mb-6">
                At Stalight Technologies, we're committed to revolutionizing educational institutions through cutting-edge technology solutions. Our flagship product, VisionX, represents our dedication to making attendance management effortless and accurate.
              </p>
              <p className="text-lg text-gray-600">
                We believe in creating technology that enhances the educational experience while maintaining the highest standards of security and reliability.
              </p>
            </motion.div>
            
            <motion.div variants={itemVariants} className="grid grid-cols-2 gap-6">
              <div className="bg-blue-50 p-6 rounded-xl">
                <Award className="w-12 h-12 text-blue-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Excellence</h3>
                <p className="text-gray-600">Committed to delivering the highest quality solutions</p>
              </div>
              
              <div className="bg-blue-50 p-6 rounded-xl">
                <Users className="w-12 h-12 text-blue-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Community</h3>
                <p className="text-gray-600">Building stronger educational communities</p>
              </div>
              
              <div className="bg-blue-50 p-6 rounded-xl">
                <Target className="w-12 h-12 text-blue-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Innovation</h3>
                <p className="text-gray-600">Pushing the boundaries of what's possible</p>
              </div>
              
              <div className="bg-blue-50 p-6 rounded-xl">
                <Zap className="w-12 h-12 text-blue-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Efficiency</h3>
                <p className="text-gray-600">Streamlining educational processes</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Team Section */}
      <div className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-center mb-16"
          >
            <motion.h2 variants={itemVariants} className="text-3xl font-bold text-gray-900 mb-4">
              Our Leadership Team
            </motion.h2>
            <motion.p variants={itemVariants} className="text-xl text-gray-600">
              Meet the innovators behind Stalight Technologies
            </motion.p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid md:grid-cols-3 gap-8"
          >
            {[
              {
                name: "Ritesh N",
                role: "CEO & Founder",
                image: "src/assets/ceo.jpg"
              },
              {
                name: "Pannaga JA",
                role: "CTO",
                image: "src/assets/cto.jpg"
              }
            ].map((member, index) => (
              <motion.div
                key={member.name}
                variants={itemVariants}
                className="bg-white rounded-xl shadow-lg overflow-hidden"
              >
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-64 object-cover"
                />
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900">{member.name}</h3>
                  <p className="text-blue-600">{member.role}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;