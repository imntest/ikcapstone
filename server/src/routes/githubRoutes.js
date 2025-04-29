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
  const { owner, repo, pullNumber } = req.query;

  try {
    const diff = await githubService.getPRDiff(owner, repo, pullNumber);
    console.log('Generated Diff:', diff); // Log the diff

    const { data: comments } = await githubService.octokit.rest.pulls.listReviewComments({
      owner,
      repo,
      pull_number: pullNumber,
    });
    console.log('Fetched Comments:', comments); // Log the comments

    res.json({ diff, comments });
  } catch (error) {
    console.error('Error fetching pull request diff and comments:', error.message);
    res.status(500).json({
      error: 'Failed to fetch pull request diff and comments',
      details: error.message,
    });
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