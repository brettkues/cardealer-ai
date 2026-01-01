"use client";

import { useEffect, useState } from "react";

export default function AIReviewPage() {
  const [files, setFiles] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const [openSource, setOpenSource] = useState(null);
  const [fullText, setFullText] = useState("");
  const [loadingText, setLoadingText] = useState(false);

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

  async function viewFile(source_file) {
    setOpenSource(source_file);
    setFullText("");
    setLoadingText(true);

    try {
      const res = await fetch("/api/admin/ai-review/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source_file }),
      });

      if (!res.ok) throw new Error("Load failed");

      const data = await res.json();
      setFullText(data.content || "(No content)");
    } catch {
      setFullText("Failed to load training content.");
    } finally {
      setLoadingText(false);
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

    if (openSource === source_file) {
      setOpenSource(null);
      setFullText("");
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
            <th className="border px-3 py-2 text-center">View</th>
            <th className="border px-3 py-2 text-center">Delete</th>
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
                  onClick={() => viewFile(f.source_file)}
                  className="text-blue-600 hover:underline"
                >
                  View
                </button>
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

      {/* FULL TEXT MODAL */}
      {openSource && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-xl w-[90%] max-w-4xl max-h-[80vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <div className="font-semibold text-sm break-all">
                {openSource}
              </div>
              <button
                onClick={() => setOpenSource(null)}
                className="text-gray-600 hover:text-black"
              >
                Close
              </button>
            </div>

            <div className="p-4 overflow-auto whitespace-pre-wrap text-sm">
              {loadingText ? "Loading training content…" : fullText}
            </div>

            <div className="p-4 border-t text-right">
              <button
                onClick={() => deleteFile(openSource)}
                className="text-red-600 hover:underline"
              >
                Delete this training
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
