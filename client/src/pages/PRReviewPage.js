import React, { useState } from 'react';
import { fetchPullRequest, triggerPRReview, fetchPRDiffAndComments } from '../utils/githubApi';
import { useNavigate } from 'react-router-dom';
import './PRReviewPage.css';

const PRReviewPage = () => {
  const navigate = useNavigate();
  const [owner, setOwner] = useState('');
  const [repo, setRepo] = useState('');
  const [pullNumber, setPullNumber] = useState('');
  const [pullRequest, setPullRequest] = useState(null);
  const [reviewResult, setReviewResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [diff, setDiff] = useState('');
  const [comments, setComments] = useState([]);
  const [reviewFeedback, setReviewFeedback] = useState([]); // Array of feedback objects

  const handleFetchPR = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const pr = await fetchPullRequest(owner, repo, pullNumber);
      setPullRequest(pr);
      setError(null);
    } catch (err) {
      setError('Failed to fetch pull request details');
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerReview = async () => {
    setLoading(true);
    setError(null);
    try {
      const reviewResponse = await triggerPRReview(owner, repo, pullNumber);
      setReviewResult(reviewResponse.content); // Display the review content
    } catch (err) {
      setError('Failed to generate PR review');
    } finally {
      setLoading(false);
    }
  };

  const handleFetchDiffAndComments = async () => {
    setLoading(true);
    setError(null);
    try {
      const { diff, comments, reviewFeedback } = await fetchPRDiffAndComments(owner, repo, pullNumber);
      setDiff(diff);
      setComments(comments);
      setReviewFeedback(reviewFeedback); // Set the line-level feedback
    } catch (err) {
      setError('Failed to fetch PR diff and comments');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="review-page">
      <h2>Pull Request Review</h2>
      
      <div className="review-form-container">
        <div className="form-group">
          <label htmlFor="owner">Repository Owner</label>
          <input 
            type="text" 
            id="owner"
            name="owner" 
            value={owner} 
            onChange={(e) => setOwner(e.target.value)}
            placeholder="e.g., facebook"
            required 
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="repo">Repository Name</label>
          <input 
            type="text" 
            id="repo"
            name="repo" 
            value={repo} 
            onChange={(e) => setRepo(e.target.value)}
            placeholder="e.g., react"
            required 
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="pullNumber">Pull Request Number</label>
          <input 
            type="number" 
            id="pullNumber"
            name="pullNumber" 
            value={pullNumber} 
            onChange={(e) => setPullNumber(e.target.value)}
            placeholder="e.g., 123"
            required 
          />
        </div>
        
        <button onClick={handleFetchPR} className="submit-button" disabled={loading}>
          {loading ? 'Fetching...' : 'Fetch Pull Request'}
        </button>
      </div>
      
      {pullRequest && (
        <div className="pull-request-details">
          <h3>Pull Request Details</h3>
          <p><strong>Title:</strong> {pullRequest.title}</p>
          <p><strong>Author:</strong> {pullRequest.user.login}</p>
          <p><strong>Status:</strong> {pullRequest.state}</p>

          {/* Button to trigger the diff and comments fetch */}
          <button onClick={handleFetchDiffAndComments} className="diff-button" disabled={loading}>
            {loading ? 'Loading Diff...' : 'Show Diff and Comments'}
          </button>
        </div>
      )}

      {reviewResult && (
        <div className="review-result">
          <h3>Review Feedback</h3>
          <pre>{reviewResult}</pre>
        </div>
      )}

      {diff && (
        <div className="diff-container">
          <h3>Pull Request Diff</h3>
          <pre className="diff">
            {diff.split('\n').map((line, index) => (
              <div key={index} className="diff-line">
                <span>{line}</span>
                {reviewFeedback
                  .filter((feedback) => feedback.line === index + 1) // Match feedback to the line
                  .map((feedback, idx) => (
                    <div key={idx} className="inline-comment">
                      <strong>Bot:</strong> {feedback.comment}
                    </div>
                  ))}
                {comments
                  .filter((comment) => comment.position === index + 1) // Match GitHub comments to the line
                  .map((comment, idx) => (
                    <div key={idx} className="inline-comment">
                      <strong>{comment.user.login}:</strong> {comment.body}
                    </div>
                  ))}
              </div>
            ))}
          </pre>
        </div>
      )}

      {reviewFeedback && (
        <div className="review-feedback">
          <h3>Bot Review Feedback</h3>
          <pre>{reviewFeedback}</pre>
        </div>
      )}

      {!diff && <p>No diff available for this pull request.</p>}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
    </div>
  );
};

export default PRReviewPage;