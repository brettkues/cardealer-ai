import { OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import { pinecone } from "./pinecone";

const embeddings = new OpenAIEmbeddings({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function getFiVectorStore() {
  const index = pinecone.Index(process.env.PINECONE_INDEX_FI);
  return await PineconeStore.fromExistingIndex(embeddings, { index });
}
