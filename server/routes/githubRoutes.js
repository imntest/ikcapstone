const express = require('express');
const { fetchPullRequest } = require('../services/githubService');
const router = express.Router();

// Endpoint to fetch pull request details
router.get('/pull-request', async (req, res) => {
  const { owner, repo, pullNumber } = req.query;

  try {
    const pr = await fetchPullRequest(owner, repo, pullNumber);
    res.json(pr);
  } catch (error) {
    console.error('Error fetching pull request:', error.message);
    res.status(500).json({ error: 'Failed to fetch pull request details' });
  }
});

router.get('/pull-request/diff', async (req, res) => {
  const { owner, repo, pullNumber } = req.query;

  try {
    console.log('Fetching pull request diff and comments:', { owner, repo, pullNumber });

    // Fetch the diff
    const diff = await githubService.getPRDiff(owner, repo, pullNumber);
    console.log('Diff:', diff);

    // Fetch comments (optional, may be empty)
    const { data: comments } = await githubService.octokit.rest.pulls.listReviewComments({
      owner,
      repo,
      pull_number: pullNumber,
    });
    console.log('Comments:', comments);

    // Analyze the diff using PRAnalyzerService
    const reviewFeedback = await prAnalyzerService.analyzeCodeDiff(diff);
    console.log('Review Feedback:', reviewFeedback);

    res.json({ diff, comments, reviewFeedback });
  } catch (error) {
    console.error('Error fetching pull request diff and comments:', error.message);
    res.status(500).json({
      error: 'Failed to fetch pull request diff and comments',
      details: error.message,
    });
  }
});

module.exports = router;

async function getPRDiff(owner, repo, pullNumber) {
  const { data: files } = await this.octokit.rest.pulls.listFiles({
    owner,
    repo,
    pull_number: pullNumber,
  });

  // Combine all file patches into a single string
  const diff = files
    .filter((file) => file.patch) // Only include files with changes
    .map((file) => `File: ${file.filename}\n${file.patch}`)
    .join('\n\n');

  return diff; // Ensure this is a string
}