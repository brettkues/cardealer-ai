"use client";

import { useEffect, useState } from "react";

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [saving, setSaving] = useState(false);

  async function loadUsers() {
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    setUsers(data.users || []);
  }

  async function updateRole(uid, newRole) {
    setSaving(true);

    await fetch("/api/admin/role", {
      method: "POST",
      body: JSON.stringify({ uid, role: newRole }),
    });

    setSaving(false);
    loadUsers();
  }

  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <div className="max-w-2xl mx-auto mt-10 bg-white shadow p-6 rounded">
      <h1 className="text-3xl font-bold mb-6">Admin — User Roles</h1>

      {saving && (
        <div className="mb-4 text-blue-600 font-semibold">Saving...</div>
      )}

      <div className="space-y-4">
        {users.map((u) => (
          <div
            key={u.uid}
            className="bg-gray-100 p-4 rounded flex justify-between items-center"
          >
            <div>
              <div className="font-bold">{u.email}</div>
              <div className="text-sm text-gray-600">Role: {u.role}</div>
            </div>

            <select
              className="border p-2 rounded"
              value={u.role}
              onChange={(e) => updateRole(u.uid, e.target.value)}
            >
              <option value="user">User</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
