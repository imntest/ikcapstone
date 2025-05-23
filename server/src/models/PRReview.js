// server/src/models/PRReview.js
const mongoose = require('mongoose');

const PRReviewSchema = new mongoose.Schema({
  repositoryOwner: {
    type: String,
    required: true
  },
  repositoryName: {
    type: String,
    required: true
  },
  pullRequestNumber: {
    type: String,
    required: true
  },
  pullRequestTitle: {
    type: String,
    required: true
  },
  reviewContent: {
    type: mongoose.Schema.Types.Mixed, // Use Mixed instead of String
    required: true
  },
  reviewDate: {
    type: Date,
    default: Date.now
  },
  reviewQuality: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  userFeedback: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PRReview', PRReviewSchema);