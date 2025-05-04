import React, { useState } from 'react';
import { 
  fetchPullRequest, 
  triggerPRReview, 
  fetchPRDiffAndComments, 
  postReviewToGitHub,
  triggerFeedbackReview // Add this new import
} from '../utils/githubApi';
import './PRReviewPage.css';

const PRReviewPage = () => {
  const [owner, setOwner] = useState('');
  const [repo, setRepo] = useState('');
  const [pullNumber, setPullNumber] = useState('');
  const [pullRequest, setPullRequest] = useState(null);
  const [reviewResult, setReviewResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [diffText, setDiffText] = useState('');
  const [userFeedback, setUserFeedback] = useState('');
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  
  // Simpler handler for fetching PR details
  const handleFetchPR = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const pr = await fetchPullRequest(owner, repo, pullNumber);
      setPullRequest(pr);
    } catch (err) {
      console.error("Error fetching PR:", err);
      setError('Failed to fetch pull request details');
    } finally {
      setLoading(false);
    }
  };

  // Add these detailed logs to the handleTriggerReview function
  const handleTriggerReview = async () => {
    setLoading(true);
    setError(null);
    setReviewResult('');
    
    try {
      console.log("Triggering review for:", owner, repo, pullNumber);
      const response = await triggerPRReview(owner, repo, pullNumber);
      console.log("Review API response:", response);
      
      if (response.content) {
        if (Array.isArray(response.content) && response.content.length === 0) {
          // Handle empty array case
          setReviewResult("The review analysis returned no feedback. This may happen when:\n\n" +
            "1. The PR is very simple with no issues to report\n" +
            "2. The AI couldn't find anything to comment on\n" +
            "3. There was an issue analyzing the code\n\n" +
            "Try a different PR with more complex changes to get meaningful feedback.");
        } else if (typeof response.content === 'object') {
          setReviewResult(JSON.stringify(response.content, null, 2));
        } else {
          setReviewResult(response.content);
        }
      } else if (response.reviewContent) {
        if (Array.isArray(response.reviewContent) && response.reviewContent.length === 0) {
          // Handle empty array case for reviewContent
          setReviewResult("No issues were found in this pull request.");
        } else if (typeof response.reviewContent === 'object') {
          setReviewResult(JSON.stringify(response.reviewContent, null, 2));
        } else {
          setReviewResult(response.reviewContent);
        }
      } else {
        // Try to extract any useful information from the response
        if (Array.isArray(response) && response.length === 0) {
          setReviewResult("No issues were found in this pull request.");
        } else if (Object.keys(response).length === 0) {
          setReviewResult("The review returned an empty response.");
        } else {
          // Look for any string properties that might have content
          const stringProps = Object.entries(response)
            .filter(([_, value]) => typeof value === 'string' && value.length > 20);
          
          if (stringProps.length > 0) {
            setReviewResult(stringProps[0][1]);
          } else {
            setReviewResult("No review content found in API response");
          }
        }
      }
    } catch (err) {
      console.error("Error generating review:", err);
      setError(`Failed to generate PR review: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Simpler handler for showing diff
  const handleShowDiff = async () => {
    setLoading(true);
    setError(null);
    setDiffText('');
    
    try {
      const response = await fetchPRDiffAndComments(owner, repo, pullNumber);
      console.log("Diff response:", response);
      
      if (response.diff) {
        // Just display the diff as text
        setDiffText(typeof response.diff === 'string' 
          ? response.diff 
          : JSON.stringify(response.diff, null, 2));
      } else {
        setError("No diff returned from API");
      }
    } catch (err) {
      console.error("Error fetching diff:", err);
      setError(`Failed to fetch PR diff: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Add this handler for feedback-guided review
  const handleFeedbackReview = async (e) => {
    if (e) {
      e.preventDefault();
    }
    
    if (!userFeedback.trim()) {
      setError("Please provide feedback or specific areas to focus on.");
      return;
    }
    
    setLoading(true);
    setError(null);
    setReviewResult('');
    
    try {
      console.log("Triggering feedback-guided review for:", owner, repo, pullNumber);
      console.log("User feedback:", userFeedback);
      
      const response = await triggerFeedbackReview(owner, repo, pullNumber, userFeedback);
      console.log("Feedback-guided review response:", response);
      
      // Add proper error handling and null checking
      if (!response) {
        throw new Error("No response received from server");
      }
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      // Check for content in different possible properties
      const reviewContent = response.content || response.reviewContent || response.result || response.text || "";
      
      if (reviewContent) {
        setReviewResult(reviewContent);
        // Hide the feedback form after successful review
        setShowFeedbackForm(false);
      } else {
        setReviewResult("Review generated but no content was returned. Check server logs.");
      }
    } catch (err) {
      console.error("Error generating feedback-guided review:", err);
      setError(`Failed to generate feedback-guided review: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="review-page">
      <h2>Pull Request Review</h2>
      
      {/* Input form */}
      <div className="review-form-container">
        <div className="form-group">
          <label htmlFor="owner">Repository Owner</label>
          <input 
            type="text" 
            id="owner"
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
      
      {/* PR details */}
      {pullRequest && (
        <div className="pull-request-details">
          <h3>Pull Request Details</h3>
          <p><strong>Title:</strong> {pullRequest.title}</p>
          <p><strong>Author:</strong> {pullRequest.user.login}</p>
          <p><strong>Status:</strong> {pullRequest.state}</p>

          {/* Action buttons */}
          <div className="button-group">
            <button onClick={handleTriggerReview} className="review-button" disabled={loading}>
              {loading ? 'Generating Review...' : 'Generate Review'}
            </button>
            <button onClick={handleShowDiff} className="diff-button" disabled={loading}>
              {loading ? 'Loading Diff...' : 'Show Diff'}
            </button>
            {/* Add this new test button */}
            <button 
              onClick={async () => {
                setLoading(true);
                try {
                  const response = await fetch('/api/test-review', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ owner, repo, pullNumber })
                  });
                  const data = await response.json();
                  setReviewResult(data.content);
                } catch (err) {
                  setError("Test error: " + err.message);
                } finally {
                  setLoading(false);
                }
              }} 
              className="test-button"
              disabled={loading}
            >
              Test Review
            </button>
            {/* Add this button to your UI */}
            <button 
              onClick={async () => {
                setLoading(true);
                try {
                  const result = await postReviewToGitHub(owner, repo, pullNumber);
                  alert("Review posted to GitHub successfully!");
                } catch (err) {
                  setError(`Failed to post review to GitHub: ${err.message}`);
                } finally {
                  setLoading(false);
                }
              }} 
              className="github-button"
              disabled={loading || !reviewResult}
            >
              Post to GitHub
            </button>
          </div>
        </div>
      )}
      
      {/* Add this button to show/hide the feedback form */}
      {pullRequest && (
        <div className="feedback-review-section">
          <button 
            className="feedback-toggle-button"
            onClick={() => setShowFeedbackForm(!showFeedbackForm)}
          >
            {showFeedbackForm ? 'Hide Feedback Form' : 'Guided Review with Feedback'}
          </button>
          
          {showFeedbackForm && (
            <div className="feedback-form">
              <form onSubmit={handleFeedbackReview}>
                <div className="form-group">
                  <label htmlFor="userFeedback">
                    What should the review focus on? (e.g., "Check for security vulnerabilities" or "Ensure proper error handling")
                  </label>
                  <textarea
                    id="userFeedback"
                    className="feedback-input"
                    value={userFeedback}
                    onChange={(e) => setUserFeedback(e.target.value)}
                    placeholder="Enter specific areas to focus on or questions you have about the code..."
                    rows={4}
                  />
                </div>
                <button 
                  type="submit" 
                  className="feedback-review-button"
                  disabled={loading}
                >
                  {loading ? 'Generating...' : 'Generate Guided Review'}
                </button>
              </form>
            </div>
          )}
        </div>
      )}
      
      {/* Review result (simplified) */}
      {reviewResult && (
        <div className="review-result">
          <h3>Review Feedback</h3>
          <pre className="feedback-text">{reviewResult}</pre>
        </div>
      )}
      
      {/* Diff display (simplified) */}
      {diffText && (
        <div className="diff-container">
          <h3>Pull Request Diff</h3>
          <pre className="diff-text">{diffText}</pre>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
    </div>
  );
};

export default PRReviewPage;