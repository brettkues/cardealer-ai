"use client";

import { useEffect, useState } from "react";

export default function AIReviewPage() {
  const [files, setFiles] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadBrain() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/admin/ai-review");
      if (!res.ok) throw new Error("API error");

      const data = await res.json();
      setFiles(data);
    } catch {
      setError("Failed to load AI brain");
    } finally {
      setLoading(false);
    }
  }

  async function deleteFile(source_file) {
    if (!confirm(`Delete all brain data from:\n\n${source_file}?`)) return;

    const res = await fetch("/api/admin/ai-review", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source_file }),
    });

    if (!res.ok) {
      alert("Delete failed");
      return;
    }

    loadBrain();
  }

  useEffect(() => {
    loadBrain();
  }, []);

  if (loading) return <div className="p-6">Loading AI brain…</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">AI Training Review</h1>

      <table className="w-full border text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-3 py-2 text-left">Source File</th>
            <th className="border px-3 py-2">Chunks</th>
            <th className="border px-3 py-2">Created</th>
            <th className="border px-3 py-2">Delete</th>
          </tr>
        </thead>
        <tbody>
          {files.map((f) => (
            <tr key={f.source_file}>
              <td className="border px-3 py-2">{f.source_file}</td>
              <td className="border px-3 py-2 text-center">
                {f.chunk_count}
              </td>
              <td className="border px-3 py-2">
                {new Date(f.created_at).toLocaleString()}
              </td>
              <td className="border px-3 py-2 text-center">
                <button
                  onClick={() => deleteFile(f.source_file)}
                  className="text-red-600 hover:underline"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
