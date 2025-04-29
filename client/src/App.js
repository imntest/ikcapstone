// client/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import PRReviewPage from './pages/PRReviewPage';
import ReviewDetailPage from './pages/ReviewDetailPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Navbar />
        <div className="container">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/review" element={<PRReviewPage />} />
            <Route path="/reviews/:id" element={<ReviewDetailPage />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;