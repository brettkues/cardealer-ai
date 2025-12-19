"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Get logged-in user from Firebase
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUserId(user.uid);
        loadUsers(user.uid);
      } else {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  async function loadUsers(userId) {
    setLoading(true);
    const res = await fetch("/api/admin/users", {
      headers: {
        "x-user-id": userId,
      },
    });

    if (res.status === 403) {
      setUsers([]);
      setLoading(false);
      return;
    }

    const data = await res.json();
    setUsers(data.users || []);
    setLoading(false);
  }

  async function changeRole(targetUserId, role) {
    if (!currentUserId) return;

    await fetch("/api/admin/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": currentUserId,
      },
      body: JSON.stringify({
        userId: targetUserId,
        role,
      }),
    });

    loadUsers(currentUserId);
  }

  if (loading) {
    return <div className="p-6">Loading users…</div>;
  }

  if (!currentUserId) {
    return <div className="p-6">Not authenticated.</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">User Roles (Admin)</h1>

      {users.length === 0 ? (
        <div className="text-red-600">
          You do not have permission to view this page.
        </div>
      ) : (
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border text-left">User ID</th>
              <th className="p-2 border text-left">Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.user_id}>
                <td className="p-2 border text-sm">{u.user_id}</td>
                <td className="p-2 border">
                  <select
                    className="border p-1 rounded"
                    value={u.role}
                    onChange={(e) =>
                      changeRole(u.user_id, e.target.value)
                    }
                  >
                    <option value="sales">Sales</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
