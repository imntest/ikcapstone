const express = require('express');
const router = express.Router();
const PRReview = require('../models/PRReview'); // Adjust path as needed
const githubService = require('../services/githubService'); // Adjust as needed
const prAnalyzer = require('../services/prAnalyzerService'); // Adjust as needed

console.log('Registering feedback routes...');

router.post('/feedback', async (req, res) => {
  try {
    const { owner, repo, pullNumber, userFeedback } = req.body;
    
    console.log('Received feedback review request:', { owner, repo, pullNumber });
    
    if (!owner || !repo || !pullNumber) {
      return res.status(400).json({ error: "Missing required parameters" });
    }
    
    // Simple test response for now
    res.json({
      success: true,
      content: `Test feedback review for ${owner}/${repo}/${pullNumber} with feedback: "${userFeedback}"`,
      id: "test-id-123",
      engine: 'test'
    });
  } catch (error) {
    console.error("Error processing test feedback:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;