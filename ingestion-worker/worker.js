import { createClient } from "@supabase/supabase-js";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import OpenAI from "openai";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const DEALER_ID = process.env.DEALER_ID;

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
  const uint8 = new Uint8Array(buffer);
  const pdf = await pdfjsLib.getDocument({ data: uint8 }).promise;
  let text = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map(it => it.str).join(" ") + "\n";
  }
  return text;
}

async function run() {
  const { data: jobs } = await supabase
    .from("ingest_jobs")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (!jobs || jobs.length === 0) return;

  for (const job of jobs) {
    try {
      if (!job.file_path || !job.file_path.toLowerCase().endsWith(".pdf")) {
        await supabase
          .from("ingest_jobs")
          .update({ status: "skipped" })
          .eq("id", job.id);
        continue;
      }

      // 🔥 FORCE DOWNLOAD — FULL PATH, NO PREFIX LOGIC
      const { data: file, error } = await supabase.storage
        .from("knowledge")
        .download(job.file_path);

      if (error || !file) {
        throw new Error("PDF download failed");
      }

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
        .from("sales_training_vectors")
        .delete()
        .eq("dealer_id", DEALER_ID)
        .eq("source_file", job.original_name);

      const chunks = chunkText(text);

      for (const chunk of chunks) {
        const emb = await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: chunk.content,
        });

        const { error: insertError } = await supabase
          .from("sales_training_vectors")
          .insert({
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

    } catch (err) {
      await supabase
        .from("ingest_jobs")
        .update({ status: "failed" })
        .eq("id", job.id);

      console.error("INGEST FAILED", err);
      process.exit(1);
    }
  }
}

run();
