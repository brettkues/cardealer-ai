"use client";

import { useEffect, useState } from "react";

export default function FILibraryPage() {
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    const fetchLibrary = async () => {
      const res = await fetch("/api/fi/library");
      const data = await res.json();
      setEntries(data.entries || []);
    };

    fetchLibrary();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">F&amp;I Training Library</h1>

      <div className="space-y-4">
        {entries.length === 0 && <p>No training items uploaded yet.</p>}

        {entries.map((entry, i) => (
          <div key={i} className="p-4 bg-white border rounded shadow">
            <h2 className="font-semibold">{entry.title || "Training Item"}</h2>
            {entry.text && (
              <p className="mt-2 whitespace-pre-line">{entry.text}</p>
            )}
            {entry.fileUrl && (
              <a
                href={entry.fileUrl}
                target="_blank"
                className="text-blue-600 underline mt-2 block"
              >
                View PDF
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
