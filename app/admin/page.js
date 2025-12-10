"use client";

export default function AdminHome() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <a
          href="/admin/users"
          className="p-6 bg-white shadow rounded hover:bg-gray-50 block"
        >
          <h2 className="text-xl font-semibold">User Management</h2>
          <p>View and edit user roles</p>
        </a>

        <a
          href="/admin/settings"
          className="p-6 bg-white shadow rounded hover:bg-gray-50 block"
        >
          <h2 className="text-xl font-semibold">Global Settings</h2>
          <p>Configure system-wide options</p>
        </a>

        <a
          href="/admin/tools"
          className="p-6 bg-white shadow rounded hover:bg-gray-50 block"
        >
          <h2 className="text-xl font-semibold">Tool Settings</h2>
          <p>Collage generator & scraper configuration</p>
        </a>

      </div>
    </div>
  );
}
