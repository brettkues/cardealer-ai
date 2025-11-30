"use client";

import { useState, useEffect, useRef } from "react";
import { auth } from "@/app/firebase";
import { onAuthStateChanged } from "firebase/auth";

// Helper for streaming text
async function streamChat(uid, messages, onChunk) {
  const res = await fetch("/api/chat", {
    method: "POST",
    body: JSON.stringify({ uid, messages }),
  });

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    onChunk(decoder.decode(value));
  }
}

export default function AIPage() {
  const [uid, setUid] = useState(null);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Alright, I'm online. What do you want to build, fix, or tear apart today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) setUid(user.uid);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  if (!uid) {
    return (
      <div className="p-10 text-center text-xl">
        <p>You need to log in first.</p>
      </div>
    );
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const newMessage = {
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, newMessage]);
    setInput("");
    setLoading(true);

    let streamed = "";

    // Temporary placeholder assistant message
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      await streamChat(
        uid,
        [...messages, newMessage],
        (chunk) => {
          streamed += chunk;
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1].content = streamed;
            return updated;
          });
        }
      );
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Something broke. Here's the error: ${err.message}`,
        },
      ]);
    }

    setLoading(false);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* HEADER */}
      <div className="p-4 bg-gray-800 text-2xl font-bold border-b border-gray-700">
        Dealer AI Portal
      </div>

      {/* CHAT WINDOW */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`max-w-[80%] p-3 rounded-lg ${
              msg.role === "assistant"
                ? "bg-blue-700 self-start"
                : "bg-gray-700 self-end ml-auto"
            }`}
          >
            {msg.content}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* INPUT BAR */}
      <div className="p-4 bg-gray-800 border-t border-gray-700 flex gap-3">
        <textarea
          className="flex-1 bg-gray-700 p-2 rounded text-white resize-none h-16"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask something…"
        />

        <button
          onClick={sendMessage}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-500 px-6 h-16 rounded text-lg font-semibold"
        >
          {loading ? "…" : "Send"}
        </button>
      </div>
    </div>
  );
}
