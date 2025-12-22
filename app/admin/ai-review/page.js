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
    } catch (err) {
      setError("Failed to load AI brain");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBrain();
  }, []);

  if (loading) {
    return <div className="p-6">Loading AI brain…</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">AI Training Review</h1>

      {files.length === 0 ? (
        <div>No trained files found.</div>
      ) : (
        <table className="w-full border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-3 py-2 text-left">Source File</th>
              <th className="border px-3 py-2">Chunks</th>
              <th className="border px-3 py-2">Created</th>
              <th className="border px-3 py-2">Actions</th>
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
                <td className="border px-3 py-2 text-center text-gray-400">
                  delete (next)
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
