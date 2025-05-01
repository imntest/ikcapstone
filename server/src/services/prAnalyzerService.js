// server/src/services/prAnalyzerService.js
class PRAnalyzerService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    // Initialize OpenAI or other LLM library with the API key
    const { OpenAI } = require('openai');
    this.openai = new OpenAI({ apiKey: this.apiKey });
  }

  async analyzeCodeDiff(diff) {
    try {
      console.log("Analyzing diff of length:", diff.length);
      
      // If there's no diff, return an appropriate message
      if (!diff || diff.length === 0) {
        return "No changes to analyze in this PR.";
      }
      
      // Prepare a better prompt for the AI to analyze the code diff
      const prompt = `
You are an expert code reviewer analyzing a GitHub Pull Request. 
Please review the following code diff and provide detailed, specific feedback.

CODE DIFF:
${diff}

Provide a comprehensive code review including:
1. Overall assessment of code quality
2. Specific issues found (if any)
3. Security concerns (if any)
4. Suggestions for improvement
5. Positive aspects of the code

Format your review in Markdown with clear sections and bullet points.
Be specific about file names and line numbers when pointing out issues.
If the code is well-written with no obvious issues, acknowledge that but still provide at least 2-3 suggestions for improvement.
`;

      // Call the OpenAI API
      console.log("Sending prompt to OpenAI...");
      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo", // or "gpt-4" if available
        messages: [
          { role: "system", content: "You are an expert code reviewer who provides detailed, actionable feedback." },
          { role: "user", content: prompt }
        ],
        max_tokens: 1500,
        temperature: 0.5 // Lower temperature for more focused, deterministic responses
      });
      
      console.log("Received response from OpenAI");
      
      // Extract and return the review content
      if (response.choices && response.choices.length > 0 && response.choices[0].message) {
        const reviewContent = response.choices[0].message.content;
        console.log("Review content length:", reviewContent.length);
        return reviewContent;
      } else {
        console.error("Unexpected response format from OpenAI:", response);
        return "Error: The AI returned an unexpected response format. Please try again.";
      }
    } catch (error) {
      console.error("Error in analyzeCodeDiff:", error);
      
      // Provide a more specific error message based on common OpenAI errors
      if (error.code === 'rate_limit_exceeded') {
        return "Error: API rate limit exceeded. Please try again later.";
      } else if (error.code === 'context_length_exceeded') {
        return "Error: The PR diff is too large for the AI to analyze. Try a smaller PR.";
      } else if (error.code === 'invalid_api_key') {
        return "Error: Invalid API key. Please check your OpenAI API key configuration.";
      }
      
      // Fallback error message
      return "Error analyzing PR: " + error.message;
    }
  }

  async analyzeCodeDiffWithDebug(diff) {
    console.log("==== DEBUG: OPENAI REQUEST ====");
    console.log("API Key (first 5 chars):", this.apiKey ? this.apiKey.substring(0, 5) + "..." : "undefined");
    
    const prompt = `
You are an expert code reviewer analyzing a GitHub Pull Request. 
Please review the following code diff and provide detailed, specific feedback.

CODE DIFF (excerpt):
${diff.substring(0, 500)}... (${diff.length} characters total)

Provide a comprehensive code review including:
1. Overall assessment of code quality
2. Specific issues found (if any)
3. Security concerns (if any)
4. Suggestions for improvement
5. Positive aspects of the code

Format your review in Markdown with clear sections and bullet points.
`;

    console.log("Prompt:", prompt);
    
    try {
      const result = await this.analyzeCodeDiff(diff);
      console.log("==== DEBUG: OPENAI RESPONSE ====");
      console.log("Result type:", typeof result);
      console.log("Result length:", typeof result === 'string' ? result.length : 'N/A');
      console.log("Result preview:", typeof result === 'string' ? result.substring(0, 100) + "..." : JSON.stringify(result));
      return result;
    } catch (error) {
      console.error("Debug error:", error);
      return "Error in debug mode: " + error.message;
    }
  }
}

module.exports = PRAnalyzerService;