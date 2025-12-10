"use client";

import { useEffect, useState } from "react";
import { db } from "../../../lib/firebase";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);

  async function loadUsers() {
    const snap = await getDocs(collection(db, "users"));
    setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }

  async function setRole(uid, role) {
    await updateDoc(doc(db, "users", uid), { role });
    await loadUsers();
  }

  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">User Management</h1>

      <table className="w-full bg-white shadow rounded overflow-hidden">
        <thead className="bg-gray-200">
          <tr>
            <th className="p-3 text-left">Email</th>
            <th className="p-3 text-left">Role</th>
            <th className="p-3 text-left">Actions</th>
          </tr>
        </thead>

        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b">
              <td className="p-3">{u.email}</td>
              <td className="p-3 capitalize">{u.role}</td>

              <td className="p-3 space-x-2">
                <button
                  onClick={() => setRole(u.id, "user")}
                  className="px-3 py-1 bg-blue-600 text-white rounded"
                >
                  User
                </button>

                <button
                  onClick={() => setRole(u.id, "manager")}
                  className="px-3 py-1 bg-green-600 text-white rounded"
                >
                  Manager
                </button>

                <button
                  onClick={() => setRole(u.id, "admin")}
                  className="px-3 py-1 bg-red-600 text-white rounded"
                >
                  Admin
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
