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

export async function triggerPRReview(owner, repo, pullNumber) {
  try {
    const response = await axios.post('/api/reviews', {
      owner,
      repo,
      pullNumber,
    });
    return response.data;
  } catch (error) {
    console.error('Error triggering PR review:', error.message);
    throw error;
  }
}

export async function fetchPRDiffAndComments(owner, repo, pullNumber) {
  try {
    const response = await axios.get('/api/github/pull-request/diff', {
      params: { owner, repo, pullNumber },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching PR diff and comments:', error.message);
    throw error;
  }
}