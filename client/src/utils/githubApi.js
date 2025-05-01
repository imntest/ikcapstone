import axios from 'axios';

export async function fetchPullRequest(owner, repo, pullNumber) {
  try {
    const response = await axios.get('/api/github/pull-request', {
      params: { owner, repo, pullNumber },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching pull request:', error);
    throw error;
  }
}

export const triggerPRReview = async (owner, repo, pullNumber) => {
  try {
    console.log(`Triggering PR review for ${owner}/${repo}/${pullNumber}`);
    
    // First check if we need to add a timestamp to avoid caching
    const timestamp = new Date().getTime();
    
    const response = await fetch(`/api/reviews?_=${timestamp}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        owner,
        repo,
        pullNumber
      }),
    });
    
    console.log("Raw response status:", response.status);
    
    if (!response.ok) {
      // Try to get error details
      let errorText = await response.text();
      console.error('Server error response:', errorText);
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log("Review API response data:", data);
    return data;
  } catch (error) {
    console.error('Error triggering PR review:', error);
    throw error;
  }
};

export async function fetchPRDiffAndComments(owner, repo, pullNumber) {
  try {
    console.log(`Fetching PR diff and comments for ${owner}/${repo}/${pullNumber}`);
    const response = await axios.get('/api/github/pull-request/diff', {
      params: { owner, repo, pullNumber },
    });
    console.log("API Response:", response.data);
    
    // Check if diff exists and is a string
    if (!response.data.diff) {
      console.error("Missing diff in API response:", response.data);
      response.data.diff = ""; // Ensure empty string instead of undefined
    } else if (typeof response.data.diff !== 'string') {
      // If diff is not a string (e.g., still an array), convert it
      console.warn("Diff is not a string, converting:", response.data.diff);
      response.data.diff = JSON.stringify(response.data.diff, null, 2);
    }
    
    // Ensure comments and reviewFeedback are arrays
    if (!Array.isArray(response.data.comments)) {
      response.data.comments = [];
    }
    
    if (!Array.isArray(response.data.reviewFeedback)) {
      response.data.reviewFeedback = [];
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching PR diff and comments:', error);
    throw error;
  }
}

export const testPRReview = async () => {
  try {
    const response = await fetch('/api/test-review', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ test: true }),
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error in test review:', error);
    throw error;
  }
};

export const postReviewToGitHub = async (owner, repo, pullNumber, reviewId) => {
  try {
    const response = await fetch('/api/post-to-github', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        owner,
        repo,
        pullNumber,
        reviewId
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${response.statusText}\n${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error posting review to GitHub:', error);
    throw error;
  }
};