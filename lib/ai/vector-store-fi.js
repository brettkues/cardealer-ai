import "server-only";

import { adminDB } from "@/lib/firebaseAdmin";
import { openai } from "@/lib/ai/openai";

const COLLECTION = "fi_training_vectors";

// Embed text for vector storage
export async function embedFIText(text) {
  const embedding = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });

  return embedding.data[0].embedding;
}

// Save F&I training text
export async function saveFITraining({ text, fileUrl = null }) {
  const embedding = await embedFIText(text);

  await adminDB.collection(COLLECTION).add({
    text,
    fileUrl,
    embedding,
    createdAt: Date.now(),
  });
}

// Search F&I training memory
export async function searchFITraining(query) {
  const queryEmbedding = await embedFIText(query);

  const snapshot = await adminDB.collection(COLLECTION).get();
  const all = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

  const scored = all.map((entry) => {
    const score = cosineSimilarity(queryEmbedding, entry.embedding);
    return { ...entry, score };
  });

  return scored.sort((a, b) => b.score - a.score).slice(0, 5);
}

// Cosine similarity
function cosineSimilarity(a, b) {
  let sum = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    sum += a[i] * b[i];
    normA += a[i] ** 2;
    normB += b[i] ** 2;
  }

  return sum / (Math.sqrt(normA) * Math.sqrt(normB));
}
