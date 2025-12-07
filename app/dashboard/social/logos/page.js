
cardealer-ai

oyWD5LdEq


Find…
F

Source
Output
app/(dashboard)/social/logos/page.js

"use client";

import { useState, useEffect } from "react";

export default function LogoManagerPage() {
  const [files, setFiles] = useState([]);
  const [urls, setUrls] = useState([]);
  const [message, setMessage] = useState("");

  const loadLogos = async () => {
    const res = await fetch("/api/social/get-logos");
    const data = await res.json();
    setUrls(data.logos || []);
  };

  const uploadLogos = async () => {
    if (files.length === 0) return;

    const formData = new FormData();
    for (const file of files) {
      formData.append("logos", file);
    }

    setMessage("Uploading…");

    const res = await fetch("/api/social/upload-logos", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setMessage(data.message || "");

    if (data.urls) {
      setUrls((prev) => [...prev, ...data.urls]);
    }
