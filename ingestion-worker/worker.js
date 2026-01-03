import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const DEALER_ID = process.env.DEALER_ID;
if (!DEALER_ID) throw new Error("DEALER_ID missing from env");

function chunkText(text, maxTokens = 800, overlap = 100) {
  const chunks = [];
  const sentences = text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+(?=[A-Z])/);

  let chunk = "";
  let index = 0;

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    if ((chunk + sentence).length > maxTokens) {
      if (chunk.length > 50) {
        chunks.push({ index, content: chunk.trim() });
        index++;
      }
      const overlapText = chunk
        .split(" ")
        .slice(-overlap)
        .join(" ");
      chunk = overlapText + " " + sentence;
    } else {
      chunk += " " + sentence;
    }
  }

  if (chunk.trim().length > 50) {
    chunks.push({ index, content: chunk.trim() });
  }

  return chunks;
}

export async function extractPdfText(buffer) {
  let text = "";
  try {
    const pdfParse = require("pdf-parse");
    const result = await pdfParse(buffer);
    text = result.text || "";
  } catch {}

  if (!text || text.trim().length === 0) {
    try {
      const { getDocumentProxy, extractText } = await import("unpdf");
      const pdf = await getDocumentProxy(new Uint8Array(buffer));
      const { text: unpdfText } = await extractText(pdf, { mergePages: true });
      text = unpdfText || "";
    } catch {}
  }

  return text;
}

async function run() {
  console.log("🔍 Checking for pending ingest jobs…");

  const { data: jobs, error: jobError } = await supabase
    .from("ingest_jobs")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(1);

  if (jobError || !jobs || jobs.length === 0) {
    console.log("✅ No pending jobs");
    return;
  }

  const job = jobs[0];
  console.log("📄 Processing:", job.original_name);

const bucket = job.file_path.startsWith("service/")
  ? "service-knowledge"
  : "knowledge";

  const table = bucket === "service-knowledge" ? "service_training_vectors" : "sales_training_vectors";

  const { data: file, error: dlError } = await supabase.storage
    .from(bucket)
    .download(job.file_path);

  if (dlError || !file) {
    console.error("❌ File download failed", dlError?.message);
    await supabase.from("ingest_jobs").update({ status: "failed" }).eq("id", job.id);
    return;
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const text = await extractPdfText(buffer);

  if (!text || text.length < 200) {
    console.log("⚠️ Not enough extractable text");
    await supabase.from("ingest_jobs").update({ status: "skipped" }).eq("id", job.id);
    return;
  }

  await supabase
    .from(table)
    .delete()
    .eq("dealer_id", DEALER_ID)
    .eq("source_file", job.original_name);

  const chunks = chunkText(text);
  console.log("🧩 Chunks created:", chunks.length);

  for (const chunk of chunks) {
    const emb = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: chunk.content,
    });

    const { error: insertError } = await supabase.from(table).insert({
      dealer_id: DEALER_ID,
      source_file: job.original_name,
      chunk_index: chunk.index,
      content: chunk.content,
      embedding: emb.data[0].embedding,
    });

    if (insertError) console.error("❌ INSERT ERROR:", insertError.message);
  }

  await supabase.from("ingest_jobs").update({ status: "complete" }).eq("id", job.id);
  console.log("✅ DONE:", job.original_name);
}

run().catch(err => {
  console.error("❌ WORKER FAILED:");
  console.error(err);
});
