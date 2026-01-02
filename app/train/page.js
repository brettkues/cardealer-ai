"use client";

import { useEffect, useMemo, useState } from "react";

export default function TrainPage() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [jobs, setJobs] = useState([]);

  const [tab, setTab] = useState("documents");
  const [brain, setBrain] = useState([]);
  const [search, setSearch] = useState("");

  /* ================= FILE UPLOAD ================= */

  async function uploadFiles() {
    if (!files.length) return alert("No files selected");

    setLoading(true);
    setStatus("Uploading…");

    const form = new FormData();
    files.forEach(f => form.append("files", f));

    const res = await fetch("/api/train/sales", {
      method: "POST",
      body: form,
    });

    const data = await res.json();
    setLoading(false);

    if (!data.ok) return setStatus("Upload failed");
    setFiles([]);
    setStatus("Uploaded. Processing…");
    fetchStatus();
  }

  /* ================= STATUS ================= */

  async function fetchStatus() {
    const res = await fetch("/api/train/status", { cache: "no-store" });
    const data = await res.json();
    if (data.ok) setJobs(data.jobs);
  }

  async function fetchBrain() {
    const res = await fetch("/api/train/brain", { cache: "no-store" });
    const data = await res.json();
    if (data.ok) setBrain(data.items);
  }

  useEffect(() => {
    fetchStatus();
    fetchBrain();
    const id = setInterval(fetchStatus, 5000);
    return () => clearInterval(id);
  }, []);

  const filteredBrain = useMemo(() => {
    if (!search) return brain;
    return brain.filter(b =>
      b.preview.toLowerCase().includes(search.toLowerCase())
    );
  }, [brain, search]);

  /* ================= UI ================= */

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Train AI</h1>

      <div className="flex gap-4 mb-6">
        <button onClick={() => setTab("documents")}>Documents</button>
        <button onClick={() => setTab("chat")}>Chat / Manual Training</button>
      </div>

      {tab === "documents" && (
        <>
          <input type="file" multiple onChange={e => setFiles([...e.target.files])} />
          <button onClick={uploadFiles} disabled={loading}>
            {loading ? "Uploading…" : "Upload Files"}
          </button>
          {status && <div>{status}</div>}

          <h2 className="mt-6 font-semibold">Ingestion Status</h2>
          {jobs.map(j => (
            <div key={j.id}>{j.original_name} — {j.status}</div>
          ))}
        </>
      )}

      {tab === "chat" && (
        <>
          <input
            placeholder="Search training…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {filteredBrain.map(b => (
            <div key={b.source_file}>
              <div>{b.source_file}</div>
              <pre>{b.preview}</pre>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
