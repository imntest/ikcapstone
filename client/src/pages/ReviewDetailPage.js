// client/src/pages/ReviewDetailPage.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import './ReviewDetailPage.css';

const ReviewDetailPage = () => {
  const { id } = useParams();
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReview = async () => {
      try {
        const res = await axios.get(`/api/reviews/${id}`);
        setReview(res.data);
      } catch (err) {
        setError('Failed to load review');
        console.error('Error fetching review:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReview();
  }, [id]);

  if (loading) return <div className="loading">Loading review...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!review) return <div className="error">Review not found</div>;

  return (
    <div className="review-detail">
      <div className="review-header">
        <h2>PR Review: {review.pullRequestTitle}</h2>
        <div className="review-meta">
          <div>Repository: {review.repositoryOwner}/{review.repositoryName}</div>
          <div>PR #{review.pullRequestNumber}</div>
          <div>Date: {new Date(review.reviewDate).toLocaleString()}</div>
        </div>
      </div>
      
      <div className="review-content">
        <h3>Review Analysis</h3>
        <div className="markdown-content">
          <ReactMarkdown>{review.reviewContent}</ReactMarkdown>
        </div>
      </div>
      
      <div className="feedback-section">
        <h3>Provide Feedback</h3>
        <div className="quality-rating">
          <span>How helpful was this review?</span>
          {[1, 2, 3, 4, 5].map(star => (
            <button key={star} className="star-btn">
              {star}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReviewDetailPage;