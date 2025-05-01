const express = require('express');
const GitHubService = require('../services/githubService'); // Import the class
const PRAnalyzerService = require('../services/prAnalyzerService');
const router = express.Router();

// Initialize GitHubService with the token
require('dotenv').config();
console.log('GITHUB_TOKEN:', process.env.GITHUB_TOKEN); // Debug log
const githubService = new GitHubService(process.env.GITHUB_TOKEN);
const prAnalyzerService = new PRAnalyzerService(process.env.OPENAI_API_KEY);

// Endpoint to fetch pull request details
router.get('/pull-request', async (req, res) => {
  const { owner, repo, pullNumber } = req.query;

  try {
    console.log('Fetching pull request:', { owner, repo, pullNumber }); // Debug log
    const pr = await githubService.fetchPullRequest(owner, repo, pullNumber); // Use the instance
    console.log('Pull request fetched successfully:', pr); // Log success
    res.json(pr);
  } catch (error) {
    console.error('Error in /pull-request route:', error.message); // Log the error message
    res.status(500).json({
      error: 'Failed to fetch pull request details',
      details: error.message,
    });
  }
});

// Endpoint to fetch pull request diff and comments
router.get('/pull-request/diff', async (req, res) => {
  try {
    const { owner, repo, pullNumber } = req.query;
    console.log(`Server: Getting diff for ${owner}/${repo}/${pullNumber}`);
    
    // Get diff from GitHub
    const diffFiles = await githubService.getPRDiff(owner, repo, pullNumber);
    console.log("Generated Diff:", diffFiles);
    
    // Extract the diff as a string from the array of file objects
    const diffString = diffFiles
      .map(file => 
        `File: ${file.filename} (${file.status})\n${file.patch || ''}`)
      .join('\n\n');
    
    // Get comments from GitHub
    const comments = await githubService.getPRComments(owner, repo, pullNumber);
    console.log("Fetched Comments:", comments);
    
    // Get review feedback (if any)
    let reviewFeedback = [];
    // ... existing reviewFeedback logic ...
    
    // Send as string, array, and array respectively
    res.json({
      diff: diffString,  // Convert to string format
      comments: comments || [],
      reviewFeedback: reviewFeedback || []
    });
  } catch (error) {
    console.error("Server error getting PR diff:", error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to fetch repository details
router.get('/repo', async (req, res) => {
  const { owner, repo } = req.query;

  try {
    const repoDetails = await githubService.fetchRepoDetails(owner, repo); // Use the instance
    res.json(repoDetails);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch repository details' });
  }
});

module.exports = router;