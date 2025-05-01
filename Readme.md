GitHub PR Review Assistant
A tool that automatically reviews Pull Requests using AI, providing code feedback and allowing for posting reviews directly to GitHub.

Features
Fetch PR details from GitHub repositories
Generate AI-powered code reviews for pull requests
View and analyze PR diffs
Post reviews directly to GitHub as PR comments
Save review history for future reference
Prerequisites
Before running this application, make sure you have the following:

Node.js (v14 or newer)
MongoDB (v4.4 or newer)
GitHub account with a personal access token
OpenAI API key
Environment Setup
Create a .env file in the server directory with the following variables:

# Server configuration
PORT=5001
NODE_ENV=development

# MongoDB connection
MONGODB_URI=mongodb://localhost:27017/pr-review

# GitHub API
GITHUB_TOKEN=your_github_personal_access_token

# OpenAI API
OPENAI_API_KEY=your_openai_api_key

Installation
Server Setup
# Navigate to the server directory
cd server

# Install dependencies
npm install

# Start the server
npm run dev


# Navigate to the client directory
cd client

# Install dependencies
npm install

# Start the development server
npm start

The application should now be running at http://localhost:3000

Usage
Enter PR Details: Enter the repository owner, repository name, and pull request number.

Fetch PR: Click "Fetch Pull Request" to retrieve the PR details from GitHub.

Generate Review: Click "Generate Review" to analyze the PR and generate AI-powered feedback.

Show Diff: Click "Show Diff" to view the code diff from the PR.

Post to GitHub: Click "Post to GitHub" to post the review as a comment directly on the GitHub PR.

GitHub Token Permissions
Your GitHub personal access token needs the following permissions:

repo: Full control of private repositories
pull_requests: Access to pull requests
OpenAI API
This application uses the OpenAI API to generate code reviews. Make sure your API key is valid and has sufficient credits.

Troubleshooting
Common Errors
GitHub API Rate Limiting: If you see "API rate limit exceeded" errors, wait a while before trying again or use a different GitHub token.

Empty Reviews: If you get empty review results, check your OpenAI API key and make sure the PR has actual code changes to review.

MongoDB Connection Issues: Ensure MongoDB is running and accessible at the URI specified in your .env file.