import { OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import { pinecone } from "./pinecone";

const embeddings = new OpenAIEmbeddings({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function getSalesVectorStore() {
  const index = pinecone.Index(process.env.PINECONE_INDEX_SALES);
  return await PineconeStore.fromExistingIndex(embeddings, { index });
}
