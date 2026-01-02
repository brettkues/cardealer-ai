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
  const { data: jobs, error } = await supabase
    .from("ingest_jobs")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("JOB FETCH ERROR", error);
    process.exit(1);
  }

  if (!jobs || jobs.length === 0) {
    return;
  }

  for (const job of jobs) {
    try {
      if (!job.file_path || !job.file_path.toLowerCase().endsWith(".pdf")) {
        await supabase
          .from("ingest_jobs")
          .update({ status: "skipped" })
          .eq("id", job.id);
        continue;
      }

      let bucket;
      let table;

      if (job.file_path.startsWith("service/")) {
        bucket = "service-knowledge";
        table = "service_training_vectors";
      } else if (job.file_path.startsWith("sales-training/")) {
        bucket = "knowledge";
        table = "sales_training_vectors";
      } else {
        throw new Error(`Unknown file_path prefix: ${job.file_path}`);
      }

      const { data: file, error: dlError } = await supabase.storage
        .from(bucket)
        .download(job.file_path);

      if (dlError || !file) {
        throw new Error("Storage download failed");
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const text = a
