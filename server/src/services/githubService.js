const { Octokit } = require('@octokit/rest');

class GitHubService {
  constructor(authToken) {
    console.log('Initializing Octokit with token:', authToken ? 'Token provided' : 'No token provided'); // Debug log
    console.log('Initializing Octokit with token:', authToken ); // Debug log

    this.octokit = new Octokit({ auth: authToken });
  }

  async fetchPullRequest(owner, repo, pullNumber) {
    try {
      console.log('fetchPullRequest called with:', { owner, repo, pullNumber }); // Debug log
      const { data } = await this.octokit.pulls.get({
        owner,
        repo,
        pull_number: pullNumber,
      });
      console.log('Pull request data fetched successfully:', data); // Log success
      return data;
    } catch (error) {
      console.error('Error fetching pull request:', error.message); // Log the error message
      if (error.response) {
        console.error('GitHub API response status:', error.response.status); // Log HTTP status
        console.error('GitHub API response data:', error.response.data); // Log response data
      } else {
        console.error('Error details:', error); // Log the full error object
      }
      throw error;
    }
  }

  async getPRDiff(owner, repo, pullNumber) {
    const { data: files } = await this.octokit.rest.pulls.listFiles({
      owner,
      repo,
      pull_number: pullNumber
    });
    
    return files.map(file => ({
      filename: file.filename,
      status: file.status,
      additions: file.additions,
      deletions: file.deletions,
      patch: file.patch
    }));
  }

  async addReviewComment(owner, repo, pullNumber, reviewContent) {
    await this.octokit.rest.pulls.createReview({
      owner,
      repo,
      pull_number: pullNumber,
      body: reviewContent,
      event: 'COMMENT' // or 'REQUEST_CHANGES' based on severity
    });
  }

  async fetchRepoDetails(owner, repo) {
    try {
      const { data } = await this.octokit.repos.get({
        owner,
        repo,
      });
      return data;
    } catch (error) {
      console.error('Error fetching repository details:', error);
      throw error;
    }
  }
}

module.exports = GitHubService;