"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebaseClient";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const snap = await getDocs(collection(db, "users"));
    const arr = [];
    snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
    setUsers(arr);
  }

  async function changeRole(id, role) {
    await updateDoc(doc(db, "users", id), { role });
    await load();
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">User Management</h1>

      <div className="space-y-4">
        {users.map((u) => (
          <div key={u.id} className="border rounded p-4 flex justify-between">
            <div>
              <div className="font-semibold">{u.email}</div>
              <div className="text-sm text-gray-600">Role: {u.role}</div>
            </div>

            <select
              className="border p-2 rounded"
              value={u.role}
              onChange={(e) => changeRole(u.id, e.target.value)}
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
