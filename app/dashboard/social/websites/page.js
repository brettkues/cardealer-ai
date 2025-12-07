      <h1 className="text-2xl font-semibold mb-4">Website Manager</h1>

      {/* Add Website */}
      <div className="space-y-4 max-w-xl mb-6">
        <input
          type="text"
          className="w-full p-3 border rounded"
          placeholder="Enter dealership website URL…"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />

        <button
          onClick={saveWebsite}
          className="bg-blue-600 text-white py-3 px-6 rounded hover:bg-blue-700 transition"
        >
          Save Website
        </button>

        <p>{message}</p>
      </div>

      {/* Website List */}
      <div className="space-y-2">
        {websites.map((site, i) => (
          <div
            key={i}
            className="p-3 bg-white border rounded shadow flex justify-between items-center"
          >
            <span>{site.url}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
