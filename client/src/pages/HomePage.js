/* eslint-disable */
import React from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';

const HomePage = () => {
  return (
    <div className="home-container">
      <div className="hero-section">
        <h1>Automated Pull Request Reviewer Bot</h1>
        <p className="hero-text">
          Leverage AI to automatically review your pull requests, identify issues, and suggest improvements.
        </p>
        <Link to="/review" className="cta-button">
          Start a New Review
        </Link>
      </div>
      
      <div className="features-section">
        <h2>Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <h3>Code Analysis</h3>
            <p>Deep analysis of code changes to identify potential issues</p>
          </div>
          <div className="feature-card">
            <h3>Detailed Feedback</h3>
            <p>Comprehensive comments and suggestions for improvement</p>
          </div>
          <div className="feature-card">
            <h3>GitHub Integration</h3>
            <p>Seamless integration with popular version control platforms</p>
          </div>
          <div className="feature-card">
            <h3>AI-Powered</h3>
            <p>Utilizes state-of-the-art LLMs for intelligent code review</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;