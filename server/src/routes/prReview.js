// server/src/routes/prReview.js
const express = require('express');
const router = express.Router();
const PRAnalyzerService = require('../services/prAnalyzerService');
const GitHubService = require('../services/githubService');
const PRReview = require('../models/PRReview');

// Initialize services with environment variables
const prAnalyzer = new PRAnalyzerService(process.env.OPENAI_API_KEY);
const githubService = new GitHubService(process.env.GITHUB_TOKEN);

// Route to trigger a PR review
router.post('/reviews', async (req, res, next) => {
  try {
    const { owner, repo, pullNumber } = req.body;
    
    // Fetch PR data
    const prData = await githubService.fetchPullRequest(owner, repo, pullNumber);
    const diffFiles = await githubService.getPRDiff(owner, repo, pullNumber);
    
    // Prepare diff for analysis
    const codeDiff = diffFiles
      .map(file => `File: ${file.filename}\n${file.patch || ''}`)
      .join('\n\n');
    
    // Analyze PR with LLM
    const analysisResult = await prAnalyzer.analyzeCodeDiff(codeDiff);
    
    // Save review to database
    const review = new PRReview({
      repositoryOwner: owner,
      repositoryName: repo,
      pullRequestNumber: pullNumber,
      pullRequestTitle: prData.title,
      reviewContent: analysisResult,
      reviewDate: new Date()
    });
    await review.save();
    
    // Post review comment to GitHub
    await githubService.addReviewComment(owner, repo, pullNumber, analysisResult);
    
    res.status(200).json({
      success: true,
      reviewId: review._id,
      content: analysisResult
    });
  } catch (error) {
    next(error);
  }
});

// Get review by ID
router.get('/reviews/:id', async (req, res, next) => {
  try {
    const review = await PRReview.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    res.status(200).json(review);
  } catch (error) {
    next(error);
  }
});

// Get all reviews for a repository
router.get('/reviews', async (req, res, next) => {
  try {
    const { owner, repo } = req.query;
    const query = {};
    
    if (owner) query.repositoryOwner = owner;
    if (repo) query.repositoryName = repo;
    
    const reviews = await PRReview.find(query).sort({ createdAt: -1 });
    res.status(200).json(reviews);
  } catch (error) {
    next(error);
  }
});

module.exports = router;