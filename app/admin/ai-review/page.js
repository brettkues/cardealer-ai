"use client";

import { useEffect, useState } from "react";

export default function AIReviewPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadBrain() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/ai-review/list");
      const data = await res.json();

      if (!data.ok) {
        throw new Error("Failed to load brain");
      }

      setRows(data.rows || []);
    } catch (err) {
      setError("Failed to load AI brain");
    } finally {
      setLoading(false);
    }
  }

  async function deleteSource(sourceFile) {
    if (!confirm(`Delete all AI knowledge from:\n\n${sourceFile}?`)) return;

    const res = await fetch("/admin/ai-review/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source_file: sourceFile }),
    });

    const data = await res.json();

    if (!data.ok) {
      alert("Delete failed");
      return;
    }

    loadBrain();
  }

  useEffect(() => {
    loadBrain();
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">AI Training Review</h1>

      {loading && <div>Loading brain…</div>}

      {error && (
        <div className="text-red-600 mb-4">
          {error}
        </div>
      )}

      {!loading && rows.length === 0 && (
        <div>No training data found.</div>
      )}

      {!loading && rows.length > 0 && (
        <div className="border rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left p-3">Source File</th>
                <th className="text-left p-3">Chunks</th>
                <th className="text-right p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.source_file}
                  className="border-t hover:bg-gray-50"
                >
                  <td className="p-3">
                    {row.source_file}
                  </td>
                  <td className="p-3">
                    {row.chunks}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => deleteSource(row.source_file)}
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
      )}
    </div>
  );
}
