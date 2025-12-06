import { adminDB } from "@/lib/firebaseAdmin";
import { openai } from "@/lib/ai/openai";

const COLLECTION = "sales_training_vectors";

// Embed text for vector storage
export async function embedSalesText(text) {
  const embedding = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });

  return embedding.data[0].embedding;
}

// Save sales training memory
export async function saveSalesTraining({ text, fileUrl = null }) {
  const embedding = await embedSalesText(text);

  await adminDB.collection(COLLECTION).add({
    text,
    fileUrl,
    embedding,
    createdAt: Date.now(),
  });
}

// Search sales training memory
export async function searchSalesTraining(query) {
  const queryEmbedding = await embedSalesText(query);

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
