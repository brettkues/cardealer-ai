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
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          role,
          domain: "service",
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
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type,
          }),
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
      {/* HEADER */}
      <div className="px-6 py-3 border-b bg-white">
        <h1 className="text-xl font-bold">Service Assistant</h1>
      </div>

      {/* SERVICE TRAINING UPLOAD */}
      <div className="p-4 bg-white border-b">
        <h2 className="font-semibold mb-2">Service Training Upload</h2>

        <input
          type="file"
          multiple
          accept="application/pdf"
          onChange={(e) => setFiles([...e.target.files])}
        /
