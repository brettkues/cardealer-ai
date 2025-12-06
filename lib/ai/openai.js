import OpenAI from "openai";

// Insert your OpenAI API key here before deploying
const OPENAI_API_KEY = "INSERT_YOUR_OPENAI_KEY_HERE";

export const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

// Helper for chat-style responses
export async function runChat(model, messages) {
  const response = await openai.chat.completions.create({
    model,
    messages,
    temperature: 0.2,
  });

  return response.choices[0].message.content;
}
