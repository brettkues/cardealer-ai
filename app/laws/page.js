"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { checkSubscription } from "@/utils/checkSubscription";
import { auth, db, storage } from "@/app/firebase";
import { signOut } from "firebase/auth";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  setDoc,
} from "firebase/firestore";

// Tooltip component (hover on desktop, tap-to-open on mobile)
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

export default function LawsPage() {
  const router = useRouter();

  const [sub, setSub] = useState(null);
  const [file, setFile] = useState(null);
  const [textLaw, setTextLaw] = useState("");
  const [state, setState] = useState("WI");
  const [uploaded, setUploaded] = useState([]);
  const [loading, setLoading] = useState(false);

  // ----------------------------------------
  // LOGIN + SUBSCRIPTION CHECK
  // ----------------------------------------
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      const active = await checkSubscription(user.uid);

      if (!active) {
        router.push("/subscribe");
        return;
      }

      setSub({
        loggedIn: true,
        active,
        uid: user.uid,
      });
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

  const uid = auth.currentUser.uid;

  // ----------------------------------------
  // LOAD USER UPLOADS
  // ----------------------------------------
  const loadDocs = async () => {
    const baseQuery =
      sub.role === "admin"
        ? query(collection(db, "lawLibrary"))
        : query(collection(db, "lawLibrary"), where("owner", "==", uid));

    const snap = await getDocs(baseQuery);
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    setUploaded(list);
  };

  useEffect(() => {
    loadDocs();
  }, [sub]);

  // ----------------------------------------
  // UPLOAD PDF
  // ----------------------------------------
  const uploadPDF = async () => {
    if (!file) {
      alert("Select a PDF first.");
      return;
    }

    setLoading(true);

    try {
      const storagePath = `laws/${uid}/${Date.now()}_${file.name}`;
      const fileRef = ref(storage, storagePath);

      await uploadBytes(fileRef, file);

      const url = await getDownloadURL(fileRef);

      await addDoc(collection(db, "lawLibrary"), {
        type: "pdf",
        state,
        url,
        filename: file.name,
        owner: uid,
        storagePath,
        uploadedAt: new Date(),
      });

      setFile(null);
      await loadDocs();
      alert("PDF uploaded.");
    } catch (err) {
      alert("Upload failed: " + err.message);
    }

    setLoading(false);
  };

  // ----------------------------------------
  // SAVE TEXT LAW
  // ----------------------------------------
  const saveTextLaw = async () => {
    if (!textLaw.trim()) {
      alert("Text is empty.");
      return;
    }

    setLoading(true);

    try {
      await setDoc(doc(db, "lawText", `${uid}_${state}`), {
        type: "text",
        state,
        text: textLaw.trim(),
        owner: uid,
        updatedAt: new Date(),
      });

      setTextLaw("");
      alert("Saved.");
    } catch (err) {
      alert("Error saving text: " + err.message);
    }

    setLoading(false);
  };

  // ----------------------------------------
  // DELETE PDF
  // ----------------------------------------
  const deletePDF = async (item) => {
    if (!confirm("Delete this file?")) return;

    try {
      await deleteObject(ref(storage, item.storagePath));
    } catch {}

    await deleteDoc(doc(db, "lawLibrary", item.id));

    await loadDocs();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      …
      {/* (Rest of UI stays unchanged) */}
      …
    </div>
  );
}
