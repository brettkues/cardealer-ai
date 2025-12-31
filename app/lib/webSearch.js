// app/lib/webSearch.js

export async function webSearch(query) {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new Error("Missing TAVILY_API_KEY");
  }

  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: "advanced",
      include_answer: true,
      include_raw_content: false,
      max_results: 5,
    }),
  });

  if (!res.ok) {
    throw new Error("Web search failed");
  }

  const data = await res.json();

  return {
    answer: data.answer || "",
    sources: data.results || [],
  };
}
