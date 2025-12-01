"use client";

import { useEffect, useState } from "react";
import { auth, storage, db } from "@/app/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

import { watchSubscription } from "@/app/utils/checkSubscription";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();

  const [subInfo, setSubInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // Upload states
  const [logoFile, setLogoFile] = useState(null);
  const [website, setWebsite] = useState("");
  const [lawFile, setLawFile] = useState(null);
  const [lawText, setLawText] = useState("");

  const [message, setMessage] = useState("");

  // --------------------------------------
  // WATCH LOGIN + SUBSCRIPTION
  // --------------------------------------
  useEffect(() => {
    const unsub = watchSubscription(async (status) => {
      if (!status.loggedIn) return router.push("/login");

      setSubInfo(status);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  if (loading || !subInfo) {
    return (
      <div className="h-screen bg-gray-900 text-white flex justify-center items-center">
        Loading dashboard…
      </div>
    );
  }

  // --------------------------------------
  // BILLING PORTAL
  // --------------------------------------
  const openBillingPortal = async () => {
    try {
      const res = await fetch("/api/portal", {
        method: "POST",
        body: JSON.stringify({ uid: subInfo.uid }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Unable to open billing portal.");
      }
    } catch (err) {
      alert("Billing portal error.");
    }
  };

  // --------------------------------------
  // LOGO UPLOAD
  // --------------------------------------
  const uploadLogo = async () => {
    if (!logoFile) return;

    try {
      const fileRef = ref(storage, `logos/${subInfo.uid}/logo.png`);
      await uploadBytes(fileRef, logoFile);

      setMessage("Logo uploaded successfully.");
    } catch (err) {
      setMessage("Logo upload failed.");
    }
  };

  // --------------------------------------
  // WEBSITE ADD
  // --------------------------------------
  const addWebsite = async () => {
    if (!website.trim()) return;

    try {
      await addDoc(collection(db, "dealerWebsites"), {
        owner: subInfo.uid,
        url: website.trim(),
        createdAt: serverTimestamp(),
      });

      setWebsite("");
      setMessage("Website added.");
    } catch (err) {
      setMessage("Website add failed.");
    }
  };

  // --------------------------------------
  // LAW PDF UPLOAD
  // --------------------------------------
  const uploadLawPdf = async () => {
    if (!lawFile) return;

    try {
      const fileRef = ref(
        storage,
        `laws/${subInfo.uid}/WI-${Date.now()}.pdf`
      );
      await uploadBytes(fileRef, lawFile);

      const url = await getDownloadURL(fileRef);

      await addDoc(collection(db, "lawLibrary"), {
        owner: subInfo.uid,
        state: "WI",
        url,
        uploadedAt: Date.now(),
      });

      setMessage("Law PDF uploaded.");
    } catch (err) {
      setMessage("Law PDF upload failed.");
    }
  };

  // --------------------------------------
  // LAW TEXT UPLOAD
  // --------------------------------------
  const uploadLawText = async () => {
    if (!lawText.trim()) return;

    try {
      await updateDoc(doc(db, "lawText", `${subInfo.uid}_WI`), {
        text: lawText.trim(),
        updatedAt: serverTimestamp()
      }).catch(async () => {
        await setDoc(doc(db, "lawText", `${subInfo.uid}_WI`), {
          text: lawText.trim(),
          updatedAt: serverTimestamp()
        });
      });

      setMessage("Law text saved.");
    } catch (err) {
      setMessage("Law text save failed.");
    }
  };

  // --------------------------------------
  // UI COMPONENTS
  // --------------------------------------
  const subscriptionStatus = subInfo.active
    ? "Active"
    : subInfo.subscriptionSource === "promo"
    ? "Promo Access"
    : "Inactive";

  const statusColor = subInfo.active
    ? "text-green-400"
    : subInfo.subscriptionSource === "promo"
    ? "text-purple-400"
    : "text-red-400";

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 space-y-10">

      <h1 className="text-4xl font-bold mb-2">Dealer Dashboard</h1>

      <p className="text-gray-300">
        Manage your AI system, logos, websites, laws, and billing settings.
      </p>

      {/* Billing Card */}
      <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700">
        <h2 className="text-2xl font-bold mb-4">Billing Overview</h2>

        <div className="mb-4">
          <span className="font-semibold">Subscription Status: </span>
          <span className={statusColor}>{subscriptionStatus}</span>
        </div>

        <div className="mb-4">
          <span className="font-semibold">Plan: </span>
          {subInfo.subscriptionSource === "promo"
            ? "Promo Access"
            : subInfo.subscriptionSource === "stripe"
            ? "Stripe Subscription"
            : "None"}
        </div>

        <button
          onClick={openBillingPortal}
          className="mt-4 bg-blue-600 hover:bg-blue-500 px-5 py-3 rounded-xl font-semibold"
        >
          Manage Billing (Stripe Portal)
        </button>
      </div>

      {/* LOGO Upload */}
      <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 space-y-4">
        <h2 className="text-2xl font-bold">Dealer Logo</h2>

        <input
          type="file"
          onChange={(e) => setLogoFile(e.target.files[0])}
          className="bg-gray-700 p-3 rounded-lg border border-gray-600"
        />

        <button
          onClick={uploadLogo}
          className="bg-green-600 hover:bg-green-500 px-5 py-3 rounded-xl"
        >
          Upload Logo
        </button>
      </div>

      {/* WEBSITE Add */}
      <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 space-y-4">
        <h2 className="text-2xl font-bold">Dealer Websites</h2>

        <input
          type="text"
          placeholder="https://www.exampledealer.com"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          className="bg-gray-700 p-3 rounded-lg w-full border border-gray-600"
        />

        <button
          onClick={addWebsite}
          className="bg-blue-600 hover:bg-blue-500 px-5 py-3 rounded-xl"
        >
          Add Website
        </button>
      </div>

      {/* LAWS Upload */}
      <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 space-y-4">
        <h2 className="text-2xl font-bold">Advertising Laws (Wisconsin)</h2>

        {/* PDF */}
        <label className="block text-gray-300">Upload Law PDF</label>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setLawFile(e.target.files[0])}
          className="bg-gray-700 p-3 rounded-lg border border-gray-600"
        />
        <button
          onClick={uploadLawPdf}
          className="bg-purple-600 hover:bg-purple-500 px-5 py-3 rounded-xl"
        >
          Upload PDF
        </button>

        {/* TEXT */}
        <label className="block text-gray-300 mt-6">Paste Law Text</label>
        <textarea
          className="bg-gray-700 p-3 rounded-lg w-full border border-gray-600 h-40"
          value={lawText}
          onChange={(e) => setLawText(e.target.value)}
        ></textarea>

        <button
          onClick={uploadLawText}
          className="bg-green-600 hover:bg-green-500 px-5 py-3 rounded-xl"
        >
          Save Text
        </button>
      </div>

      {/* STATUS MESSAGE */}
      {message && (
        <div className="p-4 bg-gray-700 text-white rounded-xl border border-gray-600">
          {message}
        </div>
      )}
    </div>
  );
}
