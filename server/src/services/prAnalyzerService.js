// server/src/services/prAnalyzerService.js
const { ChatOpenAI } = require("@langchain/openai");
const { ChatPromptTemplate, HumanMessagePromptTemplate, SystemMessagePromptTemplate } = require("@langchain/core/prompts");
const { SequentialChain, LLMChain } = require("langchain/chains");
const { StringOutputParser } = require("@langchain/core/output_parsers");
const { StructuredOutputParser } = require("langchain/output_parsers");
const { BufferMemory } = require("langchain/memory");

class PRAnalyzerService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.model = new ChatOpenAI({ 
      openAIApiKey: this.apiKey, 
      modelName: "gpt-3.5-turbo",
      temperature: 0.5,
      maxTokens: 1500
    });
    this.outputParser = new StringOutputParser();
  }

  async analyzeCodeDiff(diff) {
    try {
      console.log("Analyzing diff of length:", diff.length);
      
      if (!diff || diff.length === 0) {
        return "No changes to analyze in this PR.";
      }
      
      // Step 1: Code Quality Analysis
      const codeQualityPrompt = ChatPromptTemplate.fromMessages([
        SystemMessagePromptTemplate.fromTemplate(
          "You are an expert in code quality assessment."
        ),
        HumanMessagePromptTemplate.fromTemplate(
          `Analyze the following code diff for code quality issues only.
          
CODE DIFF:
{diff}

Focus only on code quality aspects such as:
- Code organization and structure
- Variable/function naming
- Comment quality
- Code duplication
- Readability

Output a concise analysis in markdown format with clear bullet points.`
        )
      ]);
      
      // Step 2: Security Analysis
      const securityPrompt = ChatPromptTemplate.fromMessages([
        SystemMessagePromptTemplate.fromTemplate(
          "You are a security expert specializing in code vulnerabilities."
        ),
        HumanMessagePromptTemplate.fromTemplate(
          `Analyze the following code diff for security issues only.
          
CODE DIFF:
{diff}

CODE QUALITY ANALYSIS:
{codeQualityAnalysis}

Focus only on security aspects such as:
- Potential vulnerabilities
- Input validation
- Authentication/authorization issues
- Data exposure risks
- Secure coding practices

Output a concise security analysis in markdown format with clear bullet points.`
        )
      ]);
      
      // Step 3: Performance Analysis
      const performancePrompt = ChatPromptTemplate.fromMessages([
        SystemMessagePromptTemplate.fromTemplate(
          "You are a performance optimization expert."
        ),
        HumanMessagePromptTemplate.fromTemplate(
          `Analyze the following code diff for performance issues only.
          
CODE DIFF:
{diff}

Focus only on performance aspects such as:
- Algorithm efficiency
- Resource usage
- Potential bottlenecks
- Optimization opportunities

Output a concise performance analysis in markdown format with clear bullet points.`
        )
      ]);
      
      // Step 4: Final Comprehensive Review
      const finalReviewPrompt = ChatPromptTemplate.fromMessages([
        SystemMessagePromptTemplate.fromTemplate(
          "You are a senior code reviewer responsible for providing comprehensive feedback."
        ),
        HumanMessagePromptTemplate.fromTemplate(
          `Create a comprehensive code review based on the specialized analyses below.
          
CODE QUALITY ANALYSIS:
{codeQualityAnalysis}

SECURITY ANALYSIS:
{securityAnalysis}

PERFORMANCE ANALYSIS:
{performanceAnalysis}

Synthesize these analyses into a well-organized, comprehensive code review.
Include:
1. Overall assessment
2. Key findings (organized by category)
3. Specific recommendations
4. Positive aspects of the code

Format as a professional markdown document with appropriate headings and bullet points.`
        )
      ]);
      
      // Create the chains
      const codeQualityChain = new LLMChain({
        llm: this.model, 
        prompt: codeQualityPrompt,
        outputKey: "codeQualityAnalysis",
        outputParser: this.outputParser
      });
      
      const securityChain = new LLMChain({
        llm: this.model,
        prompt: securityPrompt,
        outputKey: "securityAnalysis",
        outputParser: this.outputParser
      });
      
      const performanceChain = new LLMChain({
        llm: this.model,
        prompt: performancePrompt,
        outputKey: "performanceAnalysis",
        outputParser: this.outputParser
      });
      
      const finalReviewChain = new LLMChain({
        llm: this.model,
        prompt: finalReviewPrompt,
        outputKey: "finalReview",
        outputParser: this.outputParser
      });
      
      // Create sequential chain
      const overallChain = new SequentialChain({
        chains: [codeQualityChain, securityChain, performanceChain, finalReviewChain],
        inputVariables: ["diff"],
        outputVariables: ["finalReview"],
        verbose: true
      });
      
      console.log("Starting sequential chain analysis...");
      const result = await overallChain.call({ diff });
      console.log("Sequential chain analysis complete.");
      
      return result.finalReview;
    } catch (error) {
      console.error("Error in analyzeCodeDiff:", error);
      return "Error analyzing PR: " + error.message;
    }
  }

  async analyzeCodeDiffWithDebug(diff) {
    console.log("==== DEBUG: LANGCHAIN REQUEST ====");
    console.log("API Key (first 5 chars):", this.apiKey ? this.apiKey.substring(0, 5) + "..." : "undefined");
    
    try {
      console.log("Diff length:", diff.length);
      console.log("Diff excerpt:", diff.substring(0, 200) + "...");
      
      const result = await this.analyzeCodeDiff(diff);
      console.log("==== DEBUG: LANGCHAIN RESPONSE ====");
      console.log("Result type:", typeof result);
      console.log("Result length:", typeof result === 'string' ? result.length : 'N/A');
      console.log("Result preview:", typeof result === 'string' ? result.substring(0, 100) + "..." : JSON.stringify(result));
      return result;
    } catch (error) {
      console.error("Debug error:", error);
      return "Error in debug mode: " + error.message;
    }
  }

  async analyzeCodeDiffStructured(diff) {
    try {
      console.log("Analyzing diff for structured output, length:", diff.length);
      
      if (!diff || diff.length === 0) {
        return { overallQuality: 0, issues: [], suggestions: [], positiveAspects: [] };
      }
      
      // Define the structure we want from the LLM
      const parser = StructuredOutputParser.fromNamesAndDescriptions({
        overallQuality: "A rating from 1-10 of the overall code quality",
        issues: "An array of identified issues in the code",
        suggestions: "An array of suggestions for improvement",
        positiveAspects: "An array of positive aspects about the code",
        securityConcerns: "An array of potential security vulnerabilities, or empty if none found"
      });
      
      const formatInstructions = parser.getFormatInstructions();
      
      const prompt = ChatPromptTemplate.fromMessages([
        SystemMessagePromptTemplate.fromTemplate(
          "You are an expert code reviewer. Analyze the code diff and provide structured feedback."
        ),
        HumanMessagePromptTemplate.fromTemplate(
          `Analyze the following code diff and provide a detailed review.
          
CODE DIFF:
{diff}

${formatInstructions}

Focus on providing specific, actionable feedback.`
        )
      ]);
      
      const chain = new LLMChain({
        llm: this.model,
        prompt: prompt
      });
      
      console.log("Sending structured prompt...");
      const result = await chain.call({ diff });
      console.log("Received structured response");
      
      // Parse the result
      const parsedResult = await parser.parse(result.text);
      return parsedResult;
    } catch (error) {
      console.error("Error in analyzeCodeDiffStructured:", error);
      return { 
        error: error.message,
        overallQuality: 0, 
        issues: ["Error analyzing code: " + error.message], 
        suggestions: [], 
        positiveAspects: [] 
      };
    }
  }

  async analyzeCodeDiffWithMemory(diff, repositoryInfo) {
    try {
      console.log("Analyzing diff with memory context, length:", diff.length);
      
      if (!diff || diff.length === 0) {
        return "No changes to analyze in this PR.";
      }
      
      // Create memory instance
      const memory = new BufferMemory({
        memoryKey: "chat_history",
        returnMessages: true,
        inputKey: "diff",
        outputKey: "analysis"
      });
      
      // Add repository context to memory if available
      if (repositoryInfo) {
        await memory.saveContext(
          { input: "Repository context" }, 
          { output: `This repository is ${repositoryInfo.name} by ${repositoryInfo.owner}. 
            It's primarily written in ${repositoryInfo.language} and focuses on ${repositoryInfo.description}.` }
        );
      }
      
      const prompt = ChatPromptTemplate.fromMessages([
        SystemMessagePromptTemplate.fromTemplate(
          "You are an expert code reviewer with knowledge of the repository context."
        ),
        HumanMessagePromptTemplate.fromTemplate(
          `Review the following code diff with consideration of previous analyses and repository context.
          
CODE DIFF:
{diff}

Provide a comprehensive markdown formatted review that includes:
1. Overall assessment
2. Specific issues found
3. Security concerns
4. Improvement suggestions
5. Positive aspects

{chat_history}`
        )
      ]);
      
      const chain = new LLMChain({
        llm: this.model,
        prompt: prompt,
        memory: memory,
        verbose: true
      });
      
      console.log("Sending prompt with memory context...");
      const result = await chain.call({ diff });
      console.log("Received response with memory integration");
      
      return result.text;
    } catch (error) {
      console.error("Error in analyzeCodeDiffWithMemory:", error);
      return "Error analyzing PR with memory context: " + error.message;
    }
  }

  // Add this new method to your PRAnalyzerService class
  async analyzeWithFeedback(diff, userFeedback) {
    try {
      console.log("Analyzing with user feedback, diff length:", diff.length);
      console.log("User feedback:", userFeedback);
      
      if (!diff || diff.length === 0) {
        return "No changes to analyze in this PR.";
      }
      
      // Create a custom prompt that incorporates user feedback
      const chatPrompt = ChatPromptTemplate.fromMessages([
        SystemMessagePromptTemplate.fromTemplate(
          "You are an expert code reviewer who provides detailed, actionable feedback."
        ),
        HumanMessagePromptTemplate.fromTemplate(
          `Review this code diff with special attention to the user's specific feedback.

CODE DIFF:
{diff}

USER FEEDBACK/FOCUS AREAS:
{feedback}

Provide a comprehensive code review that specifically addresses the user's feedback/focus areas,
but also include any other important issues you notice. Format as markdown with clear sections.`
        )
      ]);
      
      // Create and execute the chain
      const chain = new LLMChain({
        llm: this.model,
        prompt: chatPrompt
      });
      
      console.log("Sending feedback-guided prompt to LangChain...");
      const result = await chain.call({ 
        diff: diff,
        feedback: userFeedback || "Provide a general review focusing on best practices."
      });
      console.log("Received feedback-guided response from LangChain");
      
      return result.text;
    } catch (error) {
      console.error("Error in analyzeWithFeedback:", error);
      return `Error analyzing PR with feedback: ${error.message}`;
    }
  }
}

module.exports = PRAnalyzerService;