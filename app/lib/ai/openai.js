import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function getChatCompletion({ messages, model = "gpt-4o-mini" }) {
  const response = await client.chat.completions.create({
    model,
    messages,
    temperature: 0.7,
  });

  return response.choices[0].message.content;
}
