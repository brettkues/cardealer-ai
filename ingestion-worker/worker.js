""import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import * as pdfParse from "pdf-parse";
import OpenAI from "openai";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const DEALER_ID = process.env.DEALER_ID;
if (!DEALER_ID) throw new Error("Missing DEALER_ID");

function chunkText(text, size = 800, overlap = 100) {
  const chunks = [];
  let pos = 0;
  let index = 0;

  while (pos < text.length) {
    const chunk = text.slice(pos, pos + size).trim();
    if (chunk.length > 50) {
      chunks.push({ index, content: chunk });
      index++;
    }
    pos += size - overlap;
  }
  return chunks;
}

async function extractPdfText(buffer) {
  const data = await pdfParse(buffer);
  return data.text;
}

async function run() {
  console.log("🔍 Checking for pending ingest jobs…");

  const { data: jobs, error } = await supabase
    .from("ingest_jobs")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("❌ JOB FETCH ERROR:", error.message);
    return;
  }

  if (!jobs || jobs.length === 0) {
    console.log("✅ No pending jobs");
    return;
  }

  for (const job of jobs) {
    console.log("📄 Processing:", job.original_name);

    try {
      if (!job.original_name.toLowerCase().endsWith(".pdf")) {
        await supabase
          .from("ingest_jobs")
          .update({ status: "skipped" })
          .eq("id", job.id);
        continue;
      }

      const isService = job.source === "service";
      const bucket = isService ? "service-knowledge" : "knowledge";
      const table = isService ? "service_training_vectors" : "sales_training_vectors";

      const { data: file, error: dlError } = await supabase.storage
        .from(bucket)
        .download(job.file_path);

      if (dlError || !file) throw new Error("Storage download failed");

      const buffer = Buffer.from(await file.arrayBuffer());
      const text = await extractPdfText(buffer);

      if (!text || text.length < 200) {
        await supabase
          .from("ingest_jobs")
          .update({ status: "skipped" })
          .eq("id", job.id);
        continue;
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

        if (insertError) throw insertError;
      }

      await supabase
        .from("ingest_jobs")
        .update({ status: "complete" })
        .eq("id", job.id);

      console.log("✅ DONE:", job.original_name);
    } catch (err) {
      console.error("❌ FAILED:", job.original_name);
      console.error(err);

      await supabase
        .from("ingest_jobs")
        .update({ status: "failed" })
        .eq("id", job.id);

      throw err;
    }
  }
}

run().catch(console.error);
