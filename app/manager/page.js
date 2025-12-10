"use client";

export default function ManagerHome() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Manager Panel</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <a
          href="/manager/train"
          className="p-6 bg-white shadow rounded hover:bg-gray-50 block"
        >
          <h2 className="text-xl font-semibold">AI Training</h2>
          <p>Train and configure AI tools</p>
        </a>

        <a
          href="/manager/config"
          className="p-6 bg-white shadow rounded hover:bg-gray-50 block"
        >
          <h2 className="text-xl font-semibold">Tool Configuration</h2>
          <p>Manager settings for tools</p>
        </a>

      </div>
    </div>
  );
}
