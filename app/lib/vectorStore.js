import fs from "fs";
import path from "path";

const DATA_PATH = path.join(process.cwd(), "data");
const FILE_PATH = path.join(DATA_PATH, "salesVectors.json");

let store = [];

if (fs.existsSync(FILE_PATH)) {
  store = JSON.parse(fs.readFileSync(FILE_PATH, "utf8"));
}

function persist() {
  if (!fs.existsSync(DATA_PATH)) {
    fs.mkdirSync(DATA_PATH);
  }
  fs.writeFileSync(FILE_PATH, JSON.stringify(store));
}

export function addVector({ embedding, text, metadata }) {
  store.push({ embedding, text, metadata });
  persist();
}

function cosineSimilarity(a, b) {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function searchVectors(queryEmbedding, limit = 5) {
  return store
    .map(item => ({
      ...item,
      score: cosineSimilarity(queryEmbedding, item.embedding)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
