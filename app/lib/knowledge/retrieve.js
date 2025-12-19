import { supabase } from "@/lib/supabaseClient";

/**
 * Retrieve relevant dealership knowledge for a question.
 * Safe baseline: keyword relevance against approved training only.
 */
export async function retrieveKnowledge(question, domain = "sales") {
  if (!question) return [];

  // Extract meaningful terms
  const terms = question
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 3);

  if (terms.length === 0) return [];

  // Pull active dealership training
  const { data, error } = await supabase
    .from("knowledge")
    .select("content")
    .eq("domain", domain)
    .eq("status", "active")
    .in("authority", ["approved", "reference"])
    .limit(20);

  if (error || !data) return [];

  // Score by keyword overlap (transparent + predictable)
  const scored = data
    .map((row) => {
      const text = row.content.toLowerCase();
      let score = 0;
      for (const term of terms) {
        if (text.includes(term)) score += 1;
      }
      return { content: row.content, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);

  // Return top matches only (never hallucinate)
  return scored.slice(0, 3).map((r) => r.content);
}
