"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// FIXED — RELATIVE IMPORTS (REQUIRED FOR VERCEL)
import { watchSubscription } from "../utils/checkSubscription";
import { auth, storage, db } from "../firebase";

import { ref, getDownloadURL } from "firebase/storage";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";

export default function SocialPage() {
  const router = useRouter();

  const [sub, setSub] = useState(null);
  const [url, setUrl] = useState("");
  const [desc, setDesc] = useState("");
  const [logoUrl, setLogoUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  // -------------------------------
  // SUBSCRIPTION ENFORCEMENT
  // -------------------------------
  useState(() => {
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
  }, []);

  if (!sub) {
    return (
      <div className="h-screen bg-gray-900 text-white flex justify-center items-center">
        Checking subscription…
      </div>
    );
  }

  const uid = auth.currentUser.uid;

  // -------------------------------
  // LOAD USER LOGO
  // -------------------------------
  const loadLogo = async () => {
    try {
      const logoRef = ref(storage, `logos/${uid}/logo.png`);
      const url = await getDownloadURL(logoRef);
      setLogoUrl(url);
    } catch {
      setLogoUrl(null);
    }
  };

  // -------------------------------
  // GENERATE COLLAGE
  // -------------------------------
  const generate = async () => {
    if (!url.trim()) {
      alert("Enter the URL of the vehicle listing.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (data.error) {
        alert(data.error);
        setLoading(false);
        return;
      }

      const collageRes = await fetch("/api/collage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images: data.images,
          description: data.description,
          season: "generic",
          logoUrl,
          url,
        }),
      });

      const blob = await collageRes.blob();
      const imageUrl = URL.createObjectURL(blob);

      setDesc("Image generated. Right-click to save.");
      setUrl(imageUrl);
    } catch (err) {
      alert("Error: " + err.message);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">

      <h1 className="text-3xl font-bold mb-6">Social Media Generator</h1>

      <div className="max-w-3xl mx-auto bg-gray-800 p-6 rounded-xl border border-gray-700">

        <label className="block mb-3 font-semibold">Vehicle URL</label>
        <input
          type="text"
          className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg mb-4"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />

        <button
          onClick={generate}
          disabled={loading}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold"
        >
          {loading ? "Generating..." : "Generate Social Image"}
        </button>

        {desc && (
          <p className="text-gray-300 mt-4">{desc}</p>
        )}
      </div>
    </div>
  );
}
