
"use client";

import { useState } from "react";

export default function FIAnalyzePage() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [analysis, setAnalysis] = useState("");

  const analyzeDeal = async () => {
    if (!file) {
      setMessage("Please upload a PDF first.");
      return;
    }

    setMessage("Analyzing…");

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/fi/analyze", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    setMessage("");
    setAnalysis(data.analysis || "No analysis returned.");
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Deal Compliance Analyzer</h1>

      <div className="space-y-4 max-w-lg">
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files[0])}
        />

        <button
          onClick={analyzeDeal}
          className="bg-blue-600 text-white py-3 px-6 rounded hover:bg-blue-700 transition"
        >
          Analyze Deal
        </button>

        {message && <p>{message}</p>}

        {analysis && (
          <div className="p-4 bg-white border rounded shadow whitespace-pre-wrap">
            {analysis}
          </div>
        )}
      </div>
    </div>
  );
}
