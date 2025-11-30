"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { watchSubscription } from "@/app/utils/checkSubscription";
import { auth } from "@/app/firebase";
import { signOut } from "firebase/auth";

export default function DashboardPage() {
  const router = useRouter();
  const [sub, setSub] = useState(null);

  // ----------------------------------------
  // SUBSCRIPTION + LOGIN ENFORCEMENT
  // ----------------------------------------
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

  // Loading UI while checking subscription
  if (!sub) {
    return (
      <div className="h-screen bg-gray-900 text-white flex justify-center items-center">
        Checking subscription…
      </div>
    );
  }

  // Trial Status
  let trialMessage = null;
  if (sub.trialEnds) {
    const now = new Date();
    const end = new Date(sub.trialEnds);
    const days = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    trialMessage = days > 0 ? `${days} days remaining in free trial` : null;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* HEADER */}
      <div className="p-5 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dealer Dashboard</h1>

        <button
          onClick={() => signOut(auth)}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-medium"
        >
          Sign Out
        </button>
      </div>

      {/* BODY */}
      <div className="p-8 max-w-4xl mx-auto w-full">
        {/* Subscription Info Box */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 mb-10">
          <h2 className="text-2xl font-semibold mb-4">Account Status</h2>

          <p>
            <span className="font-semibold text-green-400">Status:</span>{" "}
            {sub.role === "admin"
              ? "Admin Access"
              : sub.active
              ? "Active Subscription"
              : "Inactive"}
          </p>

          {trialMessage && (
            <p className="mt-2 text-yellow-300">{trialMessage}</p>
          )}

          {sub.subscriptionSource && (
            <p className="mt-2 text-gray-300">
              Source: {sub.subscriptionSource}
            </p>
          )}
        </div>

        {/* NAVIGATION */}
        <h2 className="text-2xl font-semibold mb-4">Tools</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* AI */}
          <div
            onClick={() => router.push("/ai")}
            className="p-6 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl cursor-pointer transition"
          >
            <h3 className="text-xl font-bold mb-2">Dealer AI Assistant</h3>
            <p className="text-gray-300">
              Get answers, scripts, advertising advice, compliance rules,
              pricing help, and more.
            </p>
          </div>

          {/* SOCIAL GENERATOR */}
          <div
            onClick={() => router.push("/social")}
            className="p-6 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl cursor-pointer transition"
          >
            <h3 className="text-xl font-bold mb-2">Social Image Generator</h3>
            <p className="text-gray-300">
              Create 4-image collages with seasonal ribbons, your logo, simple
              disclaimers, and the Year/Make/Model.
            </p>
          </div>

          {/* FUTURE — TRAINING DASHBOARD */}
          <div className="p-6 bg-gray-800 border border-gray-700 rounded-xl opacity-40 cursor-not-allowed">
            <h3 className="text-xl font-bold mb-2">Dealer Training Library</h3>
            <p className="text-gray-300">
              Upload PDFs, websites, and documents to train the AI (coming
              soon).
            </p>
          </div>

          {/* FUTURE — ADVERTISING RULES */}
          <div className="p-6 bg-gray-800 border border-gray-700 rounded-xl opacity-40 cursor-not-allowed">
            <h3 className="text-xl font-bold mb-2">Advertising Compliance</h3>
            <p className="text-gray-300">
              Manage state-specific advertising laws and generate auto
              disclosures (coming soon).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
