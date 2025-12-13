import { adminDB } from "@/lib/firebaseAdmin";
import { openai } from "@/lib/ai/openai";

const COLLECTION = "fi_training_vectors";

// Create embedding for text
export async function embedFIText(text) {
  const embedding = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });

  return embedding.data[0].embedding;
}

// Save F&I training text + embedding
export async function saveFITraining({ text, fileUrl = null }) {
  const embedding = await embedFIText(text);

  await adminDB.collection(COLLECTION).add({
    text,
    fileUrl,
    embedding,
    createdAt: Date.now(),
  });
}

// Search FI training memory
export async function searchFITraining(query) {
  const queryEmbedding = await embedFIText(query);

  const snapshot = await adminDB.collection(COLLECTION).get();
  const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  const scored = docs.map((entry) => ({
    ...entry,
    score: cosineSimilarity(queryEmbedding, entry.embedding),
  }));

  return scored.sort((a, b) => b.score - a.score).slice(0, 5);
}

// Cosine similarity function
function cosineSimilarity(a, b) {
  let dot = 0;
  let aMag = 0;
  let bMag = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    aMag += a[i] ** 2;
    bMag += b[i] ** 2;
  }

  return dot / (Math.sqrt(aMag) * Math.sqrt(bMag));
}
