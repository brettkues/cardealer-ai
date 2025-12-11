"use client";

import { useState } from "react";
import { auth } from "@/lib/firebaseClient";
import { useRouter } from "next/navigation";

export default function FIAssistantPage() {
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  if (typeof window !== "undefined" && !auth.currentUser) {
    router.push("/auth/login");
  }

  async function sendMessage() {
    if (!input && !file) return;

    setLoading(true);

    let imageDataUrl = null;

    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      const dataUrl = await new Promise((resolve) => {
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
      imageDataUrl = dataUrl;
    }

    const newMsg = { role: "user", content: input };
    if (imageDataUrl) newMsg.imageDataUrl = imageDataUrl;

    setMessages((prev) => [...prev, newMsg]);

    const res = await fetch("/api/f-i-assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: messages.concat(newMsg).map((m) => ({
          role: m.role,
          content: m.content
        })),
        imageDataUrl,
        systemPrompt:
          "You are an automotive F&I Assistant. Give clear, factual, easy-to-understand explanations.",
      }),
    });

    const data = await res.json();

    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: data.reply },
    ]);

    setInput("");
    setFile(null);
    setLoading(false);
  }

  return (
    <div className="max-w-xl mx-auto mt-10 bg-white shadow p-6 rounded">

      <h1 className="text-3xl font-bold mb-4">F&I Assistant</h1>

      <div className="h-64 overflow-y-auto border p-3 mb-4 rounded bg-gray-50">
        {messages.map((msg, i) => (
          <div key={i} className="mb-4">
            <strong>{msg.role === "user" ? "You" : "Assistant"}:</strong>
            <p>{msg.content}</p>
            {msg.imageDataUrl && (
              <img
                src={msg.imageDataUrl}
                className="max-h-32 mt-2"
                alt="uploaded"
              />
            )}
          </div>
        ))}
        {loading && <p>Processing…</p>}
      </div>

      <textarea
        className="w-full p-3 border rounded mb-3"
        rows={3}
        placeholder="Type message..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      <input
        type="file"
        className="mb-3"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />

      <button
        onClick={sendMessage}
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded"
      >
        {loading ? "Sending..." : "Send"}
      </button>

    </div>
  );
}
