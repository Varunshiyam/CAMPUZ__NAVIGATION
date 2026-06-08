import React from "react";
import { useNavigate } from "react-router-dom";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { FaMapMarkedAlt, FaBuilding, FaFlask, FaCompass } from "react-icons/fa";
import "./WelcomePage.css";

export default function WelcomePage() {
  const navigate = useNavigate();

  const handleEnter = () => {
    navigate("/home");
  };

  // Variants for Framer Motion animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 100, damping: 15 },
    },
  };

  const glowVariants = {
    animate: {
      opacity: [0.3, 0.6, 0.3],
      scale: [1, 1.05, 1],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  return (
    <div className="welcome-container">
      {/* Background Glowing Gradients */}
      <div className="bg-glow bg-glow-gold-top"></div>
      <motion.div 
        className="bg-glow bg-glow-center"
        variants={glowVariants}
        animate="animate"
      ></motion.div>

      <motion.div
        className="welcome-content"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* College Tagline Header */}
        <motion.div className="welcome-header-tag" variants={itemVariants}>
          <span className="badge-line"></span>
          <span className="badge-text">AUTONOMOUS INSTITUTION • ACCREDITED BY NAAC WITH 'A+'</span>
          <span className="badge-line"></span>
        </motion.div>

        {/* College Name in Golden */}
        <motion.div className="college-title-container" variants={itemVariants}>
          <h1 className="college-title">
            <span className="gold-text-glow">KARPAGAM</span>
            <span className="gold-sub-text">COLLEGE OF ENGINEERING</span>
          </h1>
          <p className="college-slogan">Rediscover Campus. Navigate with Precision.</p>
        </motion.div>

        {/* Interactive Centerpiece Ring */}
        <motion.div className="centerpiece" variants={itemVariants}>
          <div className="outer-ring">
            <div className="inner-ring">
              <FaMapMarkedAlt className="center-icon" />
            </div>
          </div>
        </motion.div>

        {/* CTA Enter Button */}
        <motion.div className="cta-container" variants={itemVariants}>
          <button className="gold-btn-enter" onClick={handleEnter}>
            <span className="btn-glow"></span>
            <span className="btn-text">EXPLORE SMART CAMPUS</span>
            <span className="btn-arrow">➤</span>
          </button>
        </motion.div>

        {/* Features Preview Cards */}
        <motion.div className="features-grid" variants={itemVariants}>
          <div className="feature-card" onClick={() => navigate("/home")}>
            <div className="feature-icon-wrapper">
              <FaCompass />
            </div>
            <h3>Smart Compass</h3>
            <p>Real-time location and live pathway rendering to your target</p>
          </div>

          <div className="feature-card" onClick={() => navigate("/buildings")}>
            <div className="feature-icon-wrapper">
              <FaBuilding />
            </div>
            <h3>Blocks & Offices</h3>
            <p>Explore all academic buildings, classrooms, and administrative offices</p>
          </div>

          <div className="feature-card" onClick={() => navigate("/categories")}>
            <div className="feature-icon-wrapper">
              <FaFlask />
            </div>
            <h3>Labs & Amenities</h3>
            <p>Find specialized computer centers, engineering labs, and food courts</p>
          </div>
        </motion.div>

        {/* Welcome Footer / Admin portal quick link */}
        <motion.div className="welcome-footer" variants={itemVariants}>
          <p>© 2026 Karpagam College of Engineering. All rights reserved.</p>
        </motion.div>
      </motion.div>
    </div>
  );
}
