export default function GeneratorPage() {
  return (
    <div className="p-10 text-xl">
      <h1 className="text-3xl font-bold mb-6">Image Generator</h1>

      <p className="mb-4">
        Step 1: Enter the URL of the vehicle listing page you want to pull images from.
      </p>

      <input
        type="text"
        placeholder="https://www.pischkenissan.com/used-cars"
        className="border p-3 w-full max-w-xl rounded mb-6"
      />

      <button className="bg-blue-600 text-white px-6 py-3 rounded">
        Fetch Images
      </button>

      <p className="mt-10 text-gray-500">
        (This is the base UI — scraper API steps come next.)
      </p>
    </div>
  );
}
