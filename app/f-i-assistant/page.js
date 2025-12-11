"use client";

import { useState, useRef } from "react";
import { auth } from "@/lib/firebaseClient";
import { useRouter } from "next/navigation";

export default function FinanceAssistantPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [uploadFile, setUploadFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (typeof window !== "undefined" && !auth.currentUser) {
    router.push("/login");
  }

  const SYSTEM_PROMPT =
    "You are an expert Finance & Insurance Assistant for an automotive dealership. Provide clear and professional answers. If the user provides an image or document, incorporate it into your response.";

  async function handleSend() {
    try {
      if (!userInput && !uploadFile) return;

      setError("");
      setLoading(true);

      const newUserMsg = { role: "user", content: userInput || "" };
      let imageDataUrl = null;

      if (uploadFile) {
        const file = uploadFile;

        if (file.type.startsWith("image/")) {
          imageDataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });

          newUserMsg.imageDataUrl = imageDataUrl;
          newUserMsg.fileName = file.name;
        } else if (
          file.type === "text/plain" ||
          file.type === "application/json"
        ) {
          const textContent = await file.text();
          newUserMsg.fileName = file.name;
          newUserMsg.content += `\n[File content: ${textContent.slice(
            0,
            5000
          )}]`;
        } else {
          newUserMsg.fileName = file.name;
          newUserMsg.content += `\n[Attached file ${file.name} (${file.type}) attached]`;
        }
      }

      setMessages((prev) => [...prev, newUserMsg]);
      setUserInput("");
      setUploadFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      const body = {
        messages: messages.concat(newUserMsg).map((m) => ({
          role: m.role,
          content: m.content,
        })),
        imageDataUrl,
        systemPrompt: SYSTEM_PROMPT,
      };

      const res = await fetch("/api/f-i-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const data = await res.json();

      const assistantMsg = { role: "assistant", content: data.reply };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setError(err.message || "Sending failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: "600px", margin: "2rem auto" }}>
      <h2>F&I Assistant</h2>

      <div
        style={{
          border: "1px solid #ccc",
          padding: "1rem",
          minHeight: "300px",
          marginBottom: "1rem",
        }}
      >
        {messages.map((msg, i) => (
          <div key={i} style={{ marginBottom: "1rem" }}>
            <strong>{msg.role === "assistant" ? "Assistant:" : "You:"}</strong>
            <p>{msg.content}</p>
            {msg.imageDataUrl && (
              <img
                src={msg.imageDataUrl}
