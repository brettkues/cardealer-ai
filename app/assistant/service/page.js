"use client";

import { useState } from "react";

export default function ServiceAssistant() {
  const [msg, setMsg] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);

  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");

  const role = "manager";

  async function sendMessage() {
    if (!msg.trim() || loading) return;

    const userMessage = { role: "user", content: msg };
    const newChat = [userMessage, ...chat];

    setChat(newChat);
    setMsg("");
    setLoading(true);

    try {
      const context = newChat
        .slice(0, 10)
        .map(m => `${m.role === "assistant" ? "Assistant" : "User"}: ${m.content}`);

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          role,
          domain: "service",
          context,
        }),
      });

      if (!res.ok) throw new Error();

      const data = await res.json();

      setChat([
        {
          role: "assistant",
          content: data.answer,
          source: data.source || null,
          _id: crypto.randomUUID(),
        },
        ...newChat,
      ]);

      if (userMessage.content.toLowerCase().startsWith("add to brain:")) {
        await fetch("/api/train/brain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: userMessage.content,
            source_file: `chat:${Date.now()}`,
            domain: "service",
          }),
        });
      }
    } catch {
      setChat([
        { role: "assistant", content: "Service assistant failed." },
        ...newChat,
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  async function uploadServiceTraining() {
    if (!files.length || uploading) return;

    setUploading(true);
    setUploadStatus("Uploading service training…");

    try {
      for (const file of files) {
        const init = await fetch("/api/train/service", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: file.name, contentType: file.type }),
        });

        const initData = await init.json();
        if (!init.ok || !initData.ok) throw new Error();

        const put = await fetch(initData.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (!put.ok) throw new Error();

        const fin = await fetch("/api/train/service/finish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filePath: initData.filePath,
            original_name: file.name,
          }),
        });

        if (!fin.ok) throw new Error();
      }

      setFiles([]);
      setUploadStatus("Service training uploaded");
    } catch {
      setUploadStatus("Service training upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <div className="px-6 py-3 border-b bg-white">
        <h1 className="text-xl font-bold">Service Assistant</h1>
      </div>

      <div className="p-4 bg-white border-b">
        <h2 className="font-semibold mb-2">Service Training Upload</h2>
        <input
          type="file"
          multiple
          accept="application/pdf"
          onChange={(e) => setFiles([...e.target.files])}
        />
        <button
          onClick={uploadServiceTraining}
          disabled={uploading}
          className="ml-3 px-4 py-2 bg-green-700 text-white rounded disabled:opacity-50"
        >
          Upload Service Training
        </button>
        {uploadStatus && (
          <div className="mt-2 text-sm text-gray-600">{uploadStatus}</div>
        )}
      </div>

      <div className="p-4 border-b bg-gray-50 flex gap-2">
        <textarea
          className="flex-1 p-3 border rounded"
          placeholder="Ask a service question…"
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          disabled={loading}
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="px-5 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          Send
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {chat.map((m) => (
          <div key={m._id} className="mb-4">
            <div className="font-semibold">
              {m.role === "user" ? "You" : "Service Assistant"}
            </div>
            <div className="whitespace-pre-wrap">{m.content}</div>
            {m.source && (
              <div className="text-xs text-gray-500">{m.source}</div>
            )}
          </div>
        ))}

        {loading && (
          <div className="text-sm text-gray-500">
            Service Assistant is typing…
          </div>
        )}
      </div>
    </div>
  );
}
