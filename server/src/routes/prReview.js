// server/src/routes/prReview.js
const express = require('express');
const router = express.Router();
const PRAnalyzerService = require('../services/prAnalyzerService');
const GitHubService = require('../services/githubService');
const PRReview = require('../models/PRReview');

// Initialize services with environment variables
const prAnalyzer = new PRAnalyzerService(process.env.OPENAI_API_KEY);
const githubService = new GitHubService(process.env.GITHUB_TOKEN);

console.log('Loading prReview.js routes...');

// Route to trigger a PR review
router.post('/reviews', async (req, res, next) => {
  try {
    console.log("Received review request:", req.body);
    const { owner, repo, pullNumber } = req.body;
    
    // Validate required fields
    if (!owner || !repo || !pullNumber) {
      console.error("Missing required fields");
      return res.status(400).json({ error: "Missing required parameters" });
    }
    
    // Fetch PR data
    console.log("Fetching PR data from GitHub...");
    const prData = await githubService.fetchPullRequest(owner, repo, pullNumber);
    console.log("PR data fetched, title:", prData.title);
    
    console.log("Fetching PR diff...");
    const diffFiles = await githubService.getPRDiff(owner, repo, pullNumber);
    console.log("Diff files retrieved:", diffFiles.length);
    
    // Prepare diff for analysis
    let codeDiff = "";
    if (Array.isArray(diffFiles)) {
      codeDiff = diffFiles
        .map(file => `File: ${file.filename}\n${file.patch || ''}`)
        .join('\n\n');
    } else if (typeof diffFiles === 'string') {
      codeDiff = diffFiles;
    } else {
      codeDiff = JSON.stringify(diffFiles, null, 2);
    }
    
    console.log("Diff prepared, length:", codeDiff.length);
    
    // Analyze PR with LLM
    console.log("Sending to LLM for analysis...");
    let analysisResult = await prAnalyzer.analyzeCodeDiffWithDebug(codeDiff);
    console.log("Analysis result type:", typeof analysisResult);
    console.log("Analysis result:", analysisResult);
    
    // Handle empty results
    if (Array.isArray(analysisResult) && analysisResult.length === 0) {
      analysisResult = "No issues were found in this pull request code. The code appears to follow good practices.";
    }
    
    // Make sure reviewContent is properly formatted
    let reviewContent = analysisResult;
    if (typeof analysisResult === 'object') {
      reviewContent = JSON.stringify(analysisResult);
    }
    
    // Save the review
    console.log("Creating PR review record...");
    const review = new PRReview({
      repositoryOwner: owner,
      repositoryName: repo,
      pullRequestNumber: pullNumber,
      pullRequestTitle: prData.title,
      reviewContent: reviewContent,
      reviewDate: new Date()
    });
    
    const savedReview = await review.save();
    console.log("Review saved with ID:", savedReview._id);
    
    // Send back a meaningful response
    res.json({ 
      success: true, 
      content: reviewContent, 
      id: savedReview._id 
    });
  } catch (error) {
    console.error("Error processing PR review:", error);
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

router.post('/', async (req, res) => {
  try {
    const { owner, repo, pullNumber, reviewContent } = req.body;
    
    // Validate required fields
    if (!owner || !repo || !pullNumber) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Ensure reviewContent is a string
    const processedContent = Array.isArray(reviewContent) 
      ? JSON.stringify(reviewContent) 
      : typeof reviewContent === 'object' && reviewContent !== null
        ? JSON.stringify(reviewContent) 
        : reviewContent || "Pending review"; 
    
    // Use the SAME FIELD NAMES as in your schema
    const newReview = new PRReview({
      repositoryOwner: owner,
      repositoryName: repo,
      pullRequestNumber: pullNumber,
      reviewContent: processedContent,
      reviewDate: new Date()
    });
    
    const savedReview = await newReview.save();
    res.status(201).json(savedReview);
  } catch (error) {
    console.error('Error creating PR review:', error);
    res.status(500).json({ message: 'Failed to create PR review', error: error.message });
  }
});

// Add this TEST route to your server
router.post('/test-review', async (req, res) => {
  // This is a fixed response for testing
  const mockResponse = {
    success: true,
    content: `# PR Review Analysis

## Code Quality Issues
- The code in \`merge_sort_strings.py\` is missing docstrings for parameters
- Variable naming could be improved for clarity
- No error handling for edge cases

## Suggestions
- Consider adding type hints to clarify input types
- Add unit tests to verify functionality
- Implement error handling for empty strings

Overall, this is a simple implementation that works correctly but could benefit from better documentation and error handling.`,
    id: "test12345"
  };
  
  // Send the mock response after a brief delay to simulate processing
  setTimeout(() => {
    res.json(mockResponse);
  }, 1000);
});

// Add this route to post a review to GitHub
router.post('/post-to-github', async (req, res, next) => {
  try {
    const { owner, repo, pullNumber, reviewId } = req.body;
    
    // Validate required fields
    if (!owner || !repo || !pullNumber) {
      return res.status(400).json({ error: "Missing required parameters" });
    }
    
    // Find the review in the database
    let review;
    if (reviewId) {
      review = await PRReview.findById(reviewId);
    } else {
      // Get the latest review
      review = await PRReview.findOne({ 
        repositoryOwner: owner, 
        repositoryName: repo, 
        pullRequestNumber: pullNumber 
      }).sort({ reviewDate: -1 });
    }
    
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }
    
    // Post the review to GitHub
    console.log("Posting review to GitHub:", review.repositoryOwner, review.repositoryName, review.pullRequestNumber);
    const result = await githubService.createPRReview(
      review.repositoryOwner,
      review.repositoryName,
      review.pullRequestNumber,
      review.reviewContent
    );
    
    res.json({ 
      success: true, 
      message: "Review posted to GitHub",
      reviewId: review._id,
      githubReviewId: result.id
    });
  } catch (error) {
    console.error("Error posting review to GitHub:", error);
    next(error);
  }
});



// Add this route for feedback-guided reviews
router.post('/feedback-review', async (req, res, next) => {
  try {
    const { owner, repo, pullNumber, userFeedback } = req.body;
    
    // Log incoming request
    console.log(`[FEEDBACK-REVIEW] Request: ${owner}/${repo}/${pullNumber}`);
    console.log(`[FEEDBACK-REVIEW] Feedback: ${userFeedback}`);
    
    // Validate required fields
    if (!owner || !repo || !pullNumber) {
      return res.status(400).json({ 
        success: false,
        error: "Missing required parameters",
        content: null
      });
    }
    
    console.log(`Processing feedback-guided review for ${owner}/${repo}/${pullNumber}`);
    console.log("User feedback:", userFeedback);

    // Fetch PR data and diff
    let prData, diffFiles;
    try {
      prData = await githubService.fetchPullRequest(owner, repo, pullNumber);
      diffFiles = await githubService.getPRDiff(owner, repo, pullNumber);
    } catch (fetchError) {
      // For test requests, use mock data
      if (owner === "testowner" && repo === "testrepo") {
        prData = { title: "Test PR" };
        diffFiles = ["Test diff content"];
      } else {
        throw fetchError;
      }
    }

    // For test mode or real PR analysis
    let analysisResult;
    
    if (owner === "testowner" && repo === "testrepo") {
      // Generate mock review for testing
      analysisResult = `# Feedback-Guided Review

## Addressing Your Feedback: "${userFeedback}"

${userFeedback.includes("security") 
  ? "### Security Analysis\n- No critical security vulnerabilities found\n- Consider adding input validation" 
  : ""}

${userFeedback.includes("performance") 
  ? "### Performance Review\n- Loop optimization recommended on line 24\n- Consider caching results" 
  : ""}

${userFeedback.includes("error") 
  ? "### Error Handling\n- Error handling is properly implemented\n- Consider adding more specific error messages" 
  : ""}

## General Comments
- Code is well-structured and follows best practices
- Good use of comments and documentation
- Consider adding more unit tests

This is a test review generated based on your feedback: "${userFeedback}"`;
    } else {
      // Get real analysis
      // Prepare diff
      let codeDiff = "";
      if (Array.isArray(diffFiles)) {
        codeDiff = diffFiles
          .map(file => `File: ${file.filename}\n${file.patch || ''}`)
          .join('\n\n');
      } else if (typeof diffFiles === 'string') {
        codeDiff = diffFiles;
      } else {
        codeDiff = JSON.stringify(diffFiles, null, 2);
      }

      // Use your analyzer to process the feedback-guided review
      // This assumes you have the analyzeWithFeedback method in your service
      try {
        analysisResult = await prAnalyzer.analyzeWithFeedback(codeDiff, userFeedback);
      } catch (analyzeError) {
        // If the method doesn't exist yet, use the regular method
        analysisResult = await prAnalyzer.analyzeCodeDiff(codeDiff);
        analysisResult = `# Feedback-Guided Review\n\n## Based on Your Feedback: "${userFeedback}"\n\n` + analysisResult;
      }
    }
    
    // Save the review
    const review = new PRReview({
      repositoryOwner: owner,
      repositoryName: repo,
      pullRequestNumber: pullNumber,
      pullRequestTitle: prData.title || "Unknown PR",
      reviewContent: analysisResult,
      userFeedback: userFeedback, // Store the feedback too
      reviewDate: new Date()
    });
    
    const savedReview = await review.save();
    
    // Set a fallback content if something went wrong
    if (!analysisResult) {
      analysisResult = "Review completed but no content was generated.";
    }

    res.json({ 
      success: true, 
      content: analysisResult,
      id: savedReview ? savedReview._id : "no-save",
      engine: 'langchain-feedback'
    });
  } catch (error) {
    console.error("[FEEDBACK-REVIEW] Error:", error);
    // Send consistent error response
    res.status(500).json({ 
      success: false,
      error: "Failed to generate feedback-guided review",
      message: error.message,
      content: null
    });
  }
});

// Add this simple test route
router.get('/route-test', (req, res) => {
  res.json({ message: 'Route test successful' });
});

router.post('/simple-test', (req, res) => {
  res.json({ message: 'POST test successful', body: req.body });
});

console.log('Registered routes:');
router.stack.forEach((r) => {
  if (r.route && r.route.path) {
    console.log(`${Object.keys(r.route.methods).join(',')} ${r.route.path}`);
  }
});

module.exports = router;