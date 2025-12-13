import { auth } from "@/lib/firebase";

export async function authFetch(url, options = {}) {
  const user = auth.currentUser;

  const token = user ? await user.getIdToken() : null;

  const headers = {
    ...(options.headers || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return fetch(url, {
    ...options,
    headers,
  });
}
