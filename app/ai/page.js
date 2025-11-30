"use client";

import { useState, useEffect, useRef } from "react";
import { auth } from "@/app/firebase";
import { watchSubscription } from "@/app/utils/checkSubscription";
import { useRouter } from "next/navigation";

export default function AIChatPage() {
  const router = useRouter();

  const [subReady, setSubReady] = useState(false);
  const [uid, setUid] = useState(null);

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Welcome back! I'm the Dealer AI Assistant. Ask me anything—advertising rules, disclosures, social media posts, inventory insights, or anything about your dealership operations.",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const chatEndRef = useRef(null);

  // Auto-scroll handler
  const scrollToBottom = () => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  useEffect(scrollToBottom, [messages]);

  // -------------------------------------
  // LOGIN + SUBSCRIPTION ENFORCEMENT
  // -------------------------------------
  useEffect(() => {
    const unsub = watchSubscription((status) => {
      if (!status.loggedIn) return router.push("/login");
      if (!status.active) return router.push("/subscribe");

      setUid(status.uid);
      setSubReady(true);
    });

    return () => unsub();
  }, []);

  if (!subReady) {
    return (
      <div className="h-screen bg-gray-900 text-white flex items-center justify-center">
        Checking account…
      </div>
    );
  }

  // -------------------------------------
  // SEND MESSAGE → API
  // -------------------------------------
  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();

    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setInput("");
    scrollToBottom();
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          userMessage,
          uid,
        }),
      });

      const data = await res.json();

      if (data.error) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "There was an error generating the response. Try again or rephrase your question.",
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.answer },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Network error. Unable to reach the AI server. Please try again.",
        },
      ]);
    }

    setLoading(false);
    scrollToBottom();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !loading) {
      e.preventDefault();
      sendMessage();
    }
  };

  // -------------------------------------
  // UI
  // -------------------------------------
  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* HEADER */}
      <div className="p-5 text-3xl font-bold bg-gray-800 border-b border-gray-700">
        Dealer AI Assistant
      </div>

      {/* CHAT WINDOW */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`max-w-[80%] p-4 rounded-xl ${
              msg.role === "user"
                ? "ml-auto bg-blue-600 text-white"
                : "mr-auto bg-gray-800 border border-gray-700 text-gray-200"
            }`}
          >
            {msg.content}
          </div>
        ))}

        <div ref={chatEndRef}></div>
      </div>

      {/* INPUT AREA */}
      <div className="p-5 bg-gray-800 border-t border-gray-700">
        <div className="flex space-x-3">
          <input
            type="text"
            className="flex-1 p-4 rounded-xl bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ask your dealership AI anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />

          <button
            onClick={sendMessage}
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50"
          >
            {loading ? "Thinking…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
