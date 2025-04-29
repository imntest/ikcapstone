require('dotenv').config();
console.log('GITHUB_TOKEN:', process.env.GITHUB_TOKEN);

const GitHubService = require('./services/githubService');

const githubService = new GitHubService(process.env.GITHUB_TOKEN);

githubService.fetchPullRequest('imntest', 'iktest', 1)
  .then((pr) => console.log('Pull Request:', pr))
  .catch((err) => console.error('Error:', err.message));