import { adminAuth, adminDB } from "@/lib/firebaseAdmin";

// Get user record + role from Firestore
export async function getUserFromToken(token) {
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const userDoc = await adminDB.collection("users").doc(uid).get();

    if (!userDoc.exists) return null;

    return {
      uid,
      email: decoded.email,
      role: userDoc.data().role || "user",
    };
  } catch (err) {
    return null;
  }
}

// Role utilities
export function isAdmin(user) {
  return user?.role === "admin";
}

export function isFIManager(user) {
  return user?.role === "fi";
}

export function isUser(user) {
  return user?.role === "user";
}
