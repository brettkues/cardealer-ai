"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { watchSubscription } from "@/app/utils/checkSubscription";
import { auth } from "@/app/firebase";
import { signOut } from "firebase/auth";

export default function SocialPage() {
  const router = useRouter();
  const [sub, setSub] = useState(null);

  const [url, setUrl] = useState("");
  const [images, setImages] = useState([]);
  const [desc, setDesc] = useState("");
  const [logo, setLogo] = useState(null);
  const [generated, setGenerated] = useState(null);
  const [loading, setLoading] = useState(false);

  // -----------------------------
  // SUBSCRIPTION ENFORCEMENT
  // -----------------------------
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

  // -----------------------------
  // SCRAPE VEHICLE IMAGES
  // -----------------------------
  const fetchImages = async () => {
    setLoading(true);
    setImages([]);

    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (data.images) {
        setImages(data.images.slice(0, 4));
      }
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  };

  // -----------------------------
  // UPLOAD LOGO → BASE64
  // -----------------------------
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => setLogo(reader.result);
    reader.readAsDataURL(file);
  };

  // -----------------------------
  // GENERATE COLLAGE
  // -----------------------------
  const generateCollage = async () => {
    if (images.length !== 4) {
      alert("You must have exactly 4 images selected.");
      return;
    }

    setLoading(true);
    setGenerated(null);

    try {
      const res = await fetch("/api/collage", {
        method: "POST",
        body: JSON.stringify({
          images,
          description: desc,
          logo: logo || null,
          url: url,
        }),
      });

      const blob = await res.blob();
      const urlObj = URL.createObjectURL(blob);
      setGenerated(urlObj);
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* HEADER */}
      <div className="p-5 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Social Image Generator</h1>

        <button
          onClick={() => signOut(auth)}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-medium"
        >
          Sign Out
        </button>
      </div>

      {/* BODY */}
      <div className="p-6 max-w-4xl mx-auto w-full">
        <p className="text-gray-300 mb-6">
          Enter a vehicle VDP URL to automatically generate a 4-image collage with
          dealer branding, description, and seasonal ribbon.
        </p>

        {/* URL Input */}
        <input
          type="text"
          className="w-full p-3 bg-gray-800 border border-gray-700 rounded mb-4"
          placeholder="Paste vehicle URL here..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />

        <button
          onClick={fetchImages}
          disabled={!url || loading}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold mb-6"
        >
          {loading ? "Scraping…" : "Fetch Vehicle Images"}
        </button>

        {/* Show scraped images */}
        {images.length > 0 && (
          <>
            <h2 className="text-xl font-semibold mb-3">Selected Images</h2>
            <div className="grid grid-cols-2 gap-4 mb-6">
              {images.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  className="rounded border border-gray-700"
                  alt="Vehicle"
                />
              ))}
            </div>
          </>
        )}

        {/* Description input */}
        <textarea
          className="w-full h-32 p-3 bg-gray-800 border border-gray-700 rounded mb-4"
          placeholder="Write a short description for the ribbon…"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />

        {/* Logo upload */}
        <div className="mb-6">
          <label className="block mb-2 text-gray-300 font-semibold">
            Dealer Logo (optional)
          </label>
          <input
            type="file"
            accept="image/*"
            className="text-gray-300"
            onChange={handleLogoUpload}
          />
        </div>

        <button
          onClick={generateCollage}
          disabled={loading || images.length !== 4}
          className="w-full py-3 bg-green-600 hover:bg-green-500 rounded-lg font-semibold"
        >
          {loading ? "Generating…" : "Generate Collage"}
        </button>

        {/* Output */}
        {generated && (
          <div className="mt-10">
            <h3 className="text-2xl font-bold mb-4">Generated Collage</h3>
            <img
              src={generated}
              className="w-full border border-gray-700 rounded-lg"
              alt="Collage Result"
            />

            <a
              href={generated}
              download="collage.png"
              className="block w-full text-center mt-4 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold"
            >
              Download Image
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
