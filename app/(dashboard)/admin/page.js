export const dynamic = "force-dynamic";

export default function AdminPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Admin Panel</h1>

      <p>This section is restricted to admin users only.</p>

      <div className="mt-4 p-4 bg-white border rounded shadow">
        <p>Here you will eventually manage:</p>
        <ul className="list-disc ml-6 mt-2">
          <li>User roles</li>
          <li>System settings</li>
          <li>Platform-wide tools</li>
        </ul>
      </div>
    </div>
  );
}
