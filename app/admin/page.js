"use client";

import { useEffect, useState } from "react";

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  async function loadUsers() {
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    setUsers(data.users || []);
  }

  async function updateRole(uid, role) {
    setLoading(true);
    await fetch("/api/admin/users", {
      method: "POST",
      body: JSON.stringify({ uid, role }),
    });
    await loadUsers();
    setLoading(false);
  }

  async function deleteUser(uid) {
    setLoading(true);
    await fetch("/api/admin/users", {
      method: "DELETE",
      body: JSON.stringify({ uid }),
    });
    await loadUsers();
    setLoading(false);
  }

  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <div className="max-w-2xl mx-auto mt-10 bg-white shadow p-6 rounded">
      <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>

      {users.map((u) => (
        <div
          key={u.id}
          className="p-3 mb-3 border rounded bg-gray-50 flex justify-between items-center"
        >
          <div>
            <div className="font-bold">{u.email}</div>
            <div className="text-sm text-gray-600">Role: {u.role}</div>
          </div>

          <div className="flex gap-2">
            <select
              className="p-1 border rounded"
              value={u.role}
              onChange={(e) => updateRole(u.id, e.target.value)}
              disabled={loading}
            >
              <option value="user">User</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>

            <button
              className="bg-red-600 text-white px-3 py-1 rounded"
              onClick={() => deleteUser(u.id)}
              disabled={loading}
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
