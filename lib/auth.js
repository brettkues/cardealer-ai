import { adminAuth, adminDB } from "./firebaseAdmin";

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

// Role check utilities
export function isAdmin(user) {
  return user?.role === "admin";
}

export function isFIManager(user) {
  return user?.role === "fi"; // Your F&I Manager role label
}

export function isUser(user) {
  return user?.role === "user";
}
