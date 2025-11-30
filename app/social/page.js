"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { watchSubscription } from "@/app/utils/checkSubscription";
import { auth, storage, db } from "@/app/firebase";
import { ref, getDownloadURL } from "firebase/storage";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";

export default function SocialGenerator() {
  const router = useRouter();

  const [url, setUrl] = useState("");
  const [vehicleImages, setVehicleImages] = useState([]);
  const [description, setDescription] = useState("");
  const [generatedImage, setGeneratedImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const [subReady, setSubReady] = useState(false);

  // ------------------------------------------------------
  // ENFORCE LOGIN + SUBSCRIPTION
  // ------------------------------------------------------
  useState(() => {
    const unsub = watchSubscription((status) => {
      if (!status.loggedIn) return router.push("/login");
      if (!status.active) return router.push("/subscribe");

      setSubReady(true);
    });

    return () => unsub();
  }, []);

  if (!subReady) {
    return (
      <div className="h-screen bg-gray-900 text-white flex items-center justify-center">
        Checking subscription…
      </div>
    );
  }

  const uid = auth.currentUser.uid;

  // ------------------------------------------------------
  // AUTO-SEASON DETECTION
  // ------------------------------------------------------
  function getSeasonRibbon() {
    const month = new Date().getMonth() + 1;

    if (month === 12) return "christmas";
    if (month === 11) return "thanksgiving";
    if (month === 10) return "halloween";
    if (month === 9) return "fall";
    if ([7, 8].includes(month)) return "summer";
    if (month === 6) return "july4";
    if (month === 5) return "memorial";
    if (month === 4) return "spring";
    if (month === 3) return "spring";
    if (month === 2) return "winter";
    if (month === 1) return "newyear";

    return "generic";
  }

  // ------------------------------------------------------
  // SCRAPE VEHICLE PAGE
  // ------------------------------------------------------
  const scrapeVehicle = async () => {
    setLoading(true);
    setVehicleImages([]);
    setDescription("");

    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        body: JSON.stringify({ url }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      if (!data.images || data.images.length < 4) {
        alert("Unable to find 4 valid vehicle images.");
        setLoading(false);
        return;
      }

      setVehicleImages(data.images.slice(0, 4));

      // Scrape description
      const descRes = await fetch("/api/scrape", {
        method: "POST",
        body: JSON.stringify({ url, descriptionOnly: true }),
      });

      const descData = await descRes.json();
      setDescription(descData.description || "");

    } catch (err) {
      alert("Scrape failed: " + err.message);
    }

    setLoading(false);
  };

  // ------------------------------------------------------
  // LOAD DEALER LOGO
  // ------------------------------------------------------
  const getDealerLogo = async () => {
    try {
      const logoRef = ref(storage, `logos/${uid}/logo.png`);
      return await getDownloadURL(logoRef);
    } catch {
      return null; // no logo
    }
  };

  // ------------------------------------------------------
  // LOAD ADVERTISING LAWS (PDF or TEXT)
  // ------------------------------------------------------
  const getDealerLaws = async () => {
    // 1) text laws take priority
    const textDoc = await getDoc(doc(db, "lawText", `${uid}_WI`));
    if (textDoc.exists()) return { type: "text", text: textDoc.data().text };

    // 2) most recent PDF for WI
    const q = query(
      collection(db, "lawLibrary"),
      where("owner", "==", uid),
      where("state", "==", "WI")
    );

    const snap = await getDocs(q);
    if (!snap.empty) {
      // pick newest document
      const newest = snap.docs.sort(
        (a, b) => b.data().uploadedAt - a.data().uploadedAt
      )[0].data();

      return {
        type: "pdf",
        url: newest.url,
      };
    }

    // Default: WI fallback (dealer has nothing uploaded)
    return {
      type: "fallback",
      text: "Wisconsin advertising law fallback active. Use legally required disclosures for price, payment, APR, availability, and qualifications.",
    };
  };

  // ------------------------------------------------------
  // GENERATE COLLAGE
  // ------------------------------------------------------
  const generateCollage = async () => {
    setLoading(true);

    try {
      const logoUrl = await getDealerLogo();
      const laws = await getDealerLaws();

      const res = await fetch("/api/collage", {
        method: "POST",
        body: JSON.stringify({
          images: vehicleImages,
          description,
          season: getSeasonRibbon(),
          logoUrl,
          laws,
          url,
        }),
      });

      const blob = await res.blob();
      const imgUrl = URL.createObjectURL(blob);
      setGeneratedImage(imgUrl);
    } catch (err) {
      alert("Collage failed: " + err.message);
    }

    setLoading(false);
  };

  // ------------------------------------------------------
  // UI
  // ------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold mb-6">Social Image Generator</h1>

      {/* URL INPUT */}
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 mb-10">
        <label className="block mb-3 text-xl font-semibold">
          Vehicle URL
        </label>

        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste vehicle URL"
          className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
        />

        <button
          onClick={scrapeVehicle}
          disabled={!url || loading}
          className="mt-4 w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-lg"
        >
          {loading ? "Scraping…" : "Scrape Vehicle"}
        </button>
      </div>

      {/* IMAGE PREVIEW */}
      {vehicleImages.length === 4 && (
        <div className="grid grid-cols-2 gap-4 mb-10">
          {vehicleImages.map((img, i) => (
            <img
              key={i}
              src={img}
              className="w-full h-auto rounded-xl border border-gray-700"
            />
          ))}
        </div>
      )}

      {/* DESCRIPTION PREVIEW */}
      {description && (
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 mb-10">
          <h2 className="text-xl font-semibold mb-2">Detected Description</h2>
          <p className="text-gray-300">{description}</p>
        </div>
      )}

      {/* GENERATE COLLAGE BUTTON */}
      {vehicleImages.length === 4 && (
        <button
          onClick={generateCollage}
          className="w-full py-4 bg-green-600 hover:bg-green-500 text-xl rounded-xl"
        >
          {loading ? "Generating…" : "Generate Social Image"}
        </button>
      )}

      {/* OUTPUT IMAGE */}
      {generatedImage && (
        <div className="mt-10">
          <h2 className="text-2xl font-semibold mb-4">Final Image</h2>

          <img
            src={generatedImage}
            className="w-full max-w-xl border border-gray-700 rounded-xl"
          />

          <a
            href={generatedImage}
            download="collage.png"
            className="mt-4 block text-center px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-500"
          >
            Download Image
          </a>
        </div>
      )}
    </div>
  );
}
