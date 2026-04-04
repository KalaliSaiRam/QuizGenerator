import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  const location = useLocation();

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">🧠</span>
          <span className="logo-text">QuizForge AI</span>
          <span className="logo-badge">BETA</span>
        </Link>

        <div className="navbar-links">
          {location.pathname === '/quiz' ? (
            <button className="btn-exit">
              <span>←</span> Exit Quiz
            </button>
          ) : (
            <div className="nav-links">
              <a href="#features" className="nav-link">Features</a>
              <a href="#how-it-works" className="nav-link">How it Works</a>
              <button className="btn-primary">Get Started</button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;