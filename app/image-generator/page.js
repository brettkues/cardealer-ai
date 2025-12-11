"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebaseClient";
import { useRouter } from "next/navigation";

export default function ImageGeneratorPage() {
  const router = useRouter();

  const [caption, setCaption] = useState("");
  const [selectedWebsite, setSelectedWebsite] = useState("");
  const [websites, setWebsites] = useState([]);

  const [logoA, setLogoA] = useState(null);
  const [logoB, setLogoB] = useState(null);
  const [logoC, setLogoC] = useState(null);

  const [vehicleUrl, setVehicleUrl] = useState("");

  useEffect(() => {
    if (!auth.currentUser) router.push("/auth/login");
  }, []);

  // TEMP — will connect to Firestore later
  useEffect(() => {
    setWebsites([
      { id: "temp1", name: "Example Nissan", url: "https://example.com" },
      { id: "temp2", name: "Example CDJR", url: "https://example2.com" },
    ]);
  }, []);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Social Image Generator</h1>

      <div className="space-y-6">

        {/* WEBSITE SELECTOR */}
        <div>
          <label className="block font-semibold mb-2">Select Website</label>
          <select
            className="w-full p-3 border rounded"
            value={selectedWebsite}
            onChange={(e) => setSelectedWebsite(e.target.value)}
          >
            <option value="">Select...</option>
            {websites.map((w) => (
              <option key={w.id} value={w.url}>
                {w.name}
              </option>
            ))}
          </select>

          <a
            href="/image-generator/websites"
            className="text-blue-600 underline mt-2 inline-block"
          >
            Manage Websites
          </a>
        </div>

        {/* VEHICLE URL */}
        <div>
          <label className="block font-semibold mb-2">
            Vehicle URL (to scrape)
          </label>
          <input
            className="w-full p-3 border rounded"
            placeholder="Paste vehicle page URL..."
            value={vehicleUrl}
            onChange={(e) => setVehicleUrl(e.target.value)}
          />
        </div>

        {/* CAPTION */}
        <div>
          <label className="block font-semibold mb-2">Caption</label>
          <input
            maxLength={85}
            className="w-full p-3 border rounded"
            placeholder="Type your caption (85 characters max)"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
        </div>

        {/* LOGO UPLOADS */}
        <div>
          <label className="block font-semibold mb-2">Logos (up to 3)</label>

          <div className="space-y-2">
            <input type="file" accept="image/*" onChange={(e) => setLogoA(e.target.files?.[0] || null)} />
            <input type="file" accept="image/*" onChange={(e) => setLogoB(e.target.files?.[0] || null)} />
            <input type="file" accept="image/*" onChange={(e) => setLogoC(e.target.files?.[0] || null)} />

            <a
              href="/image-generator/logos"
              className="text-blue-600 underline mt-2 inline-block"
            >
              Manage Logos
            </a>
          </div>
        </div>

        {/* GENERATE BUTTON */}
        <button
          className="w-full bg-blue-600 text-white p-3 rounded font-semibold"
        >
          Generate Image
        </button>

        {/* RESULT PREVIEW — PHASE 3 */}
        <div className="mt-8 border rounded p-4 text-center text-gray-500">
          Final image preview will appear here.
        </div>
      </div>
    </div>
  );
}
