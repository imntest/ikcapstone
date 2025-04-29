// client/src/components/PRReviewForm.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './PRReviewForm.css';

const PRReviewForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    owner: '',
    repo: '',
    pullNumber: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('/api/reviews', formData);
      navigate(`/reviews/${response.data.reviewId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pr-review-form">
      <h2>Pull Request Review</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Repository Owner</label>
          <input 
            type="text" 
            name="owner" 
            value={formData.owner} 
            onChange={handleChange}
            placeholder="e.g., facebook"
            required 
          />
        </div>
        
        <div className="form-group">
          <label>Repository Name</label>
          <input 
            type="text" 
            name="repo" 
            value={formData.repo} 
            onChange={handleChange}
            placeholder="e.g., react"
            required 
          />
        </div>
        
        <div className="form-group">
          <label>Pull Request Number</label>
          <input 
            type="number" 
            name="pullNumber" 
            value={formData.pullNumber} 
            onChange={handleChange}
            placeholder="e.g., 123"
            required 
          />
        </div>
        
        <button type="submit" disabled={loading}>
          {loading ? 'Analyzing...' : 'Review Pull Request'}
        </button>
      </form>
      
      {error && (
        <div className="error-message">
          Error: {error}
        </div>
      )}
    </div>
  );
};

export default PRReviewForm;