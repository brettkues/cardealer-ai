"use client";

import { useEffect, useState } from "react";

export default function AIReviewPage() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/brain/admin/list");
        const data = await res.json();

        if (!data.ok) {
          throw new Error(data.error || "Failed to load brain");
        }

        setFiles(data.files || []);
      } catch (err) {
        setError(String(err));
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">
        AI Training Review (Brain Vault)
      </h1>

      {loading && <div>Loading brain contents…</div>}

      {error && (
        <div className="text-red-600">
          Error loading brain: {error}
        </div>
      )}

      {!loading && !error && files.length === 0 && (
        <div>No training data found.</div>
      )}

      {!loading && !error && files.length > 0 && (
        <table className="w-full border-collapse border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">Source File</th>
              <th className="border p-2 text-left">Chunks</th>
              <th className="border p-2 text-left">Ingested</th>
            </tr>
          </thead>
          <tbody>
            {files.map((f) => (
              <tr key={f.source_file}>
                <td className="border p-2">{f.source_file}</td>
                <td className="border p-2">{f.count}</td>
                <td className="border p-2">
                  {new Date(f.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
