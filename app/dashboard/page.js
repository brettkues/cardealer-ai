"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { watchSubscription } from "@/app/utils/checkSubscription";
import { auth, db, storage } from "@/app/firebase";
import { signOut } from "firebase/auth";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import {
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
} from "firebase/firestore";

// Tooltip Component
function Tooltip({ text }) {
  const [open, setOpen] = useState(false);

  return (
    <span
      className="relative inline-block"
      onClick={() => setOpen(!open)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <span className="ml-2 cursor-pointer text-blue-400 text-sm">ⓘ</span>

      {open && (
        <div className="absolute z-20 left-0 mt-2 w-64 bg-gray-800 text-gray-200 
                        text-sm p-3 rounded-xl border border-gray-700 shadow-xl">
          {text}
        </div>
      )}
    </span>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [sub, setSub] = useState(null);

  const [logoFile, setLogoFile] = useState(null);
  const [logoUrl, setLogoUrl] = useState(null);

  const [lawFile, setLawFile] = useState(null);
  const [textLaw, setTextLaw] = useState("");
  const [state, setState] = useState("WI");

  const [lawDocs, setLawDocs] = useState([]);
  const [loading, setLoading] = useState(false);

  // ----------------------------------------------------
  // AUTH + SUBSCRIPTION ENFORCEMENT
  // ----------------------------------------------------
  useEffect(() => {
    const unsub = watchSubscription(async (status) => {
      if (!status.loggedIn) return router.push("/login");
      if (!status.active) return router.push("/subscribe");

      setSub(status);
      await loadLogo();
      await loadLawDocs();
    });

    return () => unsub();
  }, [router]);

  if (!sub) {
    return (
      <div className="h-screen bg-gray-900 text-white flex justify-center items-center">
        Loading dashboard…
      </div>
    );
  }

  const uid = auth.currentUser.uid;

  // ----------------------------------------------------
  // LOAD LOGO
  // ----------------------------------------------------
  const loadLogo = async () => {
    const logoRef = ref(storage, `logos/${uid}/logo.png`);

    try {
      const url = await getDownloadURL(logoRef);
      setLogoUrl(url);
    } catch {
      setLogoUrl(null);
    }
  };

  // ----------------------------------------------------
  // UPLOAD LOGO
  // ----------------------------------------------------
  const uploadLogo = async () => {
    if (!logoFile) {
      alert("Please select a logo file first.");
      return;
    }

    if (!["image/png", "image/jpeg"].includes(logoFile.type)) {
      alert("Logo must be PNG or JPG.");
      return;
    }

    setLoading(true);
    try {
      const fileRef = ref(storage, `logos/${uid}/logo.png`);
      await uploadBytes(fileRef, logoFile);

      const url = await getDownloadURL(fileRef);
      setLogoUrl(url);
      setLogoFile(null);

      alert("Logo uploaded successfully!");
    } catch (err) {
      alert("Upload failed: " + err.message);
    }
    setLoading(false);
  };

  // ----------------------------------------------------
  // DELETE LOGO
  // ----------------------------------------------------
  const deleteLogo = async () => {
    if (!confirm("Delete logo?")) return;

    try {
      await deleteObject(ref(storage, `logos/${uid}/logo.png`));
      setLogoUrl(null);
    } catch (err) {
      alert("Error deleting logo.");
    }
  };

  // ----------------------------------------------------
  // LOAD LAW DOCUMENTS
  // ----------------------------------------------------
  const loadLawDocs = async () => {
    let q =
      sub.role === "admin"
        ? query(collection(db, "lawLibrary"))
        : query(collection(db, "lawLibrary"), where("owner", "==", uid));

    const snap = await getDocs(q);
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    setLawDocs(list);
  };

  // ----------------------------------------------------
  // UPLOAD PDF LAW
  // ----------------------------------------------------
  const uploadPDF = async () => {
    if (!lawFile) return alert("Please select a PDF.");

    setLoading(true);
    try {
      const path = `laws/${uid}/${Date.now()}_${lawFile.name}`;
      const fileRef = ref(storage, path);

      await uploadBytes(fileRef, lawFile);
      const url = await getDownloadURL(fileRef);

      await addDoc(collection(db, "lawLibrary"), {
        owner: uid,
        type: "pdf",
        state,
        url,
        filename: lawFile.name,
        uploadedAt: new Date(),
        storagePath: path,
      });

      setLawFile(null);
      await loadLawDocs();
      alert("PDF uploaded successfully.");
    } catch (err) {
      alert("Upload failed: " + err.message);
    }
    setLoading(false);
  };

  // ----------------------------------------------------
  // SAVE TEXT LAW (ONE PER STATE)
  // ----------------------------------------------------
  const saveTextLaw = async () => {
    if (!textLaw.trim()) {
      alert("Text cannot be empty.");
      return;
    }

    setLoading(true);
    try {
      await setDoc(doc(db, "lawText", `${uid}_${state}`), {
        owner: uid,
        type: "text",
        state,
        text: textLaw.trim(),
        updatedAt: new Date(),
      });

      setTextLaw("");
      alert("Text law saved.");
    } catch (err) {
      alert("Error saving text: " + err.message);
    }
    setLoading(false);
  };

  // ----------------------------------------------------
  // DELETE PDF
  // ----------------------------------------------------
  const deletePDF = async (item) => {
    if (!confirm("Delete this document?")) return;

    try {
      await deleteObject(ref(storage, item.storagePath));
    } catch {}

    await deleteDoc(doc(db, "lawLibrary", item.id));
    loadLawDocs();
  };

  // ----------------------------------------------------
  // UI STARTS HERE
  // ----------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-4xl font-bold">Dealer Dashboard</h1>

        <button
          onClick={() => signOut(auth)}
          className="px-4 py-2 bg-red-600 rounded-lg hover:bg-red-500"
        >
          Sign Out
        </button>
      </div>

      {/* LOGO SECTION */}
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 mb-12">
        <h2 className="text-2xl font-semibold mb-3">
          Dealer Logo
          <Tooltip text="Upload your dealership logo (PNG or JPG). This will be used in the Social Generator ribbon." />
        </h2>

        {logoUrl ? (
          <div className="mb-4">
            <img
              src={logoUrl}
              alt="Dealer Logo"
              className="w-40 h-auto mb-4 border border-gray-700 rounded-xl"
            />

            <button
              className="px-4 py-2 bg-red-600 rounded-lg hover:bg-red-500"
              onClick={deleteLogo}
            >
              Delete Logo
            </button>
          </div>
        ) : (
          <p className="text-gray-400 mb-4">No logo uploaded yet.</p>
        )}

        <input
          type="file"
          accept="image/png,image/jpeg"
          onChange={(e) => setLogoFile(e.target.files[0])}
          className="text-gray-300 mb-4"
        />

        <button
          onClick={uploadLogo}
          disabled={!logoFile || loading}
          className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-500 w-full"
        >
          {loading ? "Uploading…" : "Upload Logo"}
        </button>
      </div>

      {/* STATE SELECT */}
      <label className="text-gray-300 font-semibold">
        Select State for Law Upload
        <Tooltip text="Choose Wisconsin for default system behavior. Choose Other only if you operate outside WI." />
      </label>

      <select
        value={state}
        onChange={(e) => setState(e.target.value)}
        className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 mt-2 mb-8"
      >
        <option value="WI">Wisconsin (WI)</option>
        <option value="OTHER">Other State</option>
      </select>

      {/* PDF LAW UPLOAD */}
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 mb-12">
        <h2 className="text-2xl font-semibold mb-4">
          Upload PDF Law Document
          <Tooltip text="Upload advertising law PDFs from your OEM, dealer association, or attorney." />
        </h2>

        <input
          type="file"
          accept="application/pdf"
          className="text-gray-300 mb-4"
          onChange={(e) => setLawFile(e.target.files[0])}
        />

        <button
          onClick={uploadPDF}
          disabled={!lawFile || loading}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold"
        >
          {loading ? "Uploading…" : "Upload PDF"}
        </button>
      </div>

      {/* TEXT LAW */}
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 mb-12">
        <h2 className="text-2xl font-semibold mb-4">
          Paste Law Text
          <Tooltip text="If you cannot provide a PDF, paste the complete advertising law text here. This will be used for disclosure generation." />
        </h2>

        <textarea
          value={textLaw}
          onChange={(e) => setTextLaw(e.target.value)}
          className="w-full h-48 bg-gray-700 text-white p-3 rounded-lg border border-gray-600"
        />

        <button
          onClick={saveTextLaw}
          disabled={loading}
          className="w-full py-3 mt-3 bg-green-600 hover:bg-green-500 rounded-lg font-semibold"
        >
          {loading ? "Saving…" : "Save Text Law"}
        </button>
      </div>

      {/* LAW DOCS LIST */}
      <h2 className="text-2xl font-semibold mb-4">
        Uploaded Law Documents
        <Tooltip text="These are the uploaded law documents for this dealer. The newest document is used automatically." />
      </h2>

      {lawDocs.length === 0 && (
        <p className="text-gray-400 mb-6">No law documents uploaded.</p>
      )}

      <div className="space-y-4">
        {lawDocs.map((item) => (
          <div
            key={item.id}
            className="p-4 bg-gray-800 border border-gray-700 rounded-xl flex justify-between items-center"
          >
            <div>
              <p className="font-semibold">{item.filename}</p>
              <p className="text-gray-400 text-sm">State: {item.state}</p>
            </div>

            <div className="flex gap-3">
              <a
                href={item.url}
                target="_blank"
                className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg"
              >
                View
              </a>
              <button
                onClick={() => deletePDF(item)}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <p className="text-gray-400 text-sm mt-10">
        If you operate outside Wisconsin, upload your state’s laws
        to avoid relying on Wisconsin’s default requirements.
      </p>
    </div>
  );
}
