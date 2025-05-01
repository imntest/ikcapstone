require('dotenv').config();
const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function testOpenAI() {
  try {
    console.log("Testing OpenAI API connection...");
    
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Say hello and tell me what you can do." }
      ],
      max_tokens: 100
    });
    
    console.log("OpenAI API response:");
    console.log(JSON.stringify(response, null, 2));
    
    if (response.choices && response.choices.length > 0) {
      console.log("Generated text:", response.choices[0].message.content);
    } else {
      console.log("No choices returned in the response.");
    }
  } catch (error) {
    console.error("Error testing OpenAI API:", error);
  }
}

// Run the test
testOpenAI();