import Link from "next/link";

export default function HomePage() {
  return (
    <main className="p-10 text-center">
      <h1 className="text-3xl font-semibold mb-6">
        Welcome to CarDealer AI
      </h1>

      <p className="mb-6 text-gray-700">
        Select a tool from the dashboard to get started.
      </p>

      <Link
        href="/dashboard"
        className="px-6 py-3 bg-blue-600 text-white rounded shadow hover:bg-blue-700"
      >
        Go to Dashboard
      </Link>
    </main>
  );
}
