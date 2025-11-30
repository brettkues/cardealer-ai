"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { watchSubscription } from "@/app/utils/checkSubscription";
import { auth, db } from "@/app/firebase";
import { signOut } from "firebase/auth";

export default function AIPage() {
  const router = useRouter();
  const [sub, setSub] = useState(null);
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  // -------------------------
  // SUBSCRIPTION ENFORCEMENT
  // -------------------------
  useEffect(() => {
    const unsub = watchSubscription((status) => {
      if (!status.loggedIn) {
        router.push("/login");
        return;
      }

      if (!status.active) {
        router.push("/subscribe");
        return;
      }

      setSub(status);
    });

    return () => unsub();
  }, [router]);

  if (!sub) {
    return (
      <div className="h-screen bg-gray-900 text-white flex justify-center items-center">
        Checking subscription…
      </div>
    );
  }

  // -------------------------
  // DUMMY AI HANDLER (Replace later)
  // -------------------------
  const handleSend = async () => {
    if (!input.trim()) return;
    setLoading(true);

    // Placeholder response
    setTimeout(() => {
      setResponse("AI response coming soon…");
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="p-5 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dealer AI Assistant</h1>

        <button
          onClick={() => signOut(auth)}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-medium"
        >
          Sign Out
        </button>
      </div>

      {/* AI Content */}
      <div className="flex-1 p-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-gray-300 mb-4">
            Ask dealership questions, sales strategy, advertising rules, inventory analysis, scripts, anything.
          </p>

          <textarea
            className="w-full h-40 p-4 bg-gray-800 border border-gray-600 rounded-lg text-white mb-4"
            placeholder="Ask the AI anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />

          <button
            onClick={handleSend}
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold mb-6"
          >
            {loading ? "Thinking…" : "Ask AI"}
          </button>

          {response && (
            <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
              {response}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
