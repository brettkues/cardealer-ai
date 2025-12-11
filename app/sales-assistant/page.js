"use client";

import { useState, useRef } from "react";
import { auth } from "@/lib/firebaseClient";
import { useRouter } from "next/navigation";

export default function SalesAssistantPage() {
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
    "You are a helpful Sales Assistant for an automotive dealership. Provide friendly and informative answers. If the user provides an image or file, analyze it and use it in your response.";

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
        } else if (file.type === "text/plain") {
          const textContent = await file.text();
          newUserMsg.fileName = file.name
