import "server-only";
import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Chat wrapper
export async function runChat(model, messages) {
  const response = await openai.chat.completions.create({
    model,
    messages,
    temperature: 0.2,
  });

  return response.choices[0].message.content;
}
