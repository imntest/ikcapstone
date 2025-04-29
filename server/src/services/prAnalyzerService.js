// server/src/services/prAnalyzerService.js
const { ChatOpenAI } = require('@langchain/openai');
const { PromptTemplate } = require('@langchain/core/prompts');
const { LLMChain } = require('langchain/chains');

class PRAnalyzerService {
  constructor(openaiApiKey) {
    this.llm = new ChatOpenAI({
      modelName: 'gpt-4',
      temperature: 0.1,
      openAIApiKey: openaiApiKey
    });
    
    this.reviewPrompt = PromptTemplate.fromTemplate(
      `You are an expert code reviewer. Analyze the following code diff and provide:
      1. A summary of the changes
      2. Potential bugs or issues
      3. Security vulnerabilities
      4. Code quality suggestions
      5. Best practices recommendations
      
      Code diff:
      {codeDiff}
      
      Format your response in markdown.`
    );
    
    this.reviewChain = new LLMChain({
      llm: this.llm,
      prompt: this.reviewPrompt
    });
  }

  async analyzeCodeDiff(codeDiff) {
    try {
      const result = await this.reviewChain.call({ codeDiff });

      // Example: Parse the result into structured feedback
      const feedback = result.text.split('\n').map((line) => {
        const match = line.match(/Line (\d+): (.+)/); // Example format: "Line 42: Variable name should be more descriptive"
        if (match) {
          return {
            line: parseInt(match[1], 10),
            comment: match[2],
          };
        }
        return null;
      }).filter(Boolean); // Remove null entries

      return feedback;
    } catch (error) {
      console.error('Error analyzing PR:', error);
      throw new Error('Failed to analyze code changes');
    }
  }
}

module.exports = PRAnalyzerService;