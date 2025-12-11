        className="w-full p-3 border rounded mb-3"
        placeholder="Website URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />

      <button
        onClick={add}
        className="w-full bg-blue-600 text-white p-3 rounded mb-6"
      >
        Add Website
      </button>

      <div className="space-y-3">
        {websites.map((w) => (
          <div
            key={w.id}
            className="p-3 border rounded bg-gray-50 flex justify-between items-center"
          >
            <div>
              <div className="font-bold">{w.label}</div>
              <div className="text-sm text-gray-600">{w.url}</div>
            </div>

            <button
              onClick={() => remove(w.id)}
              className="bg-red-600 text-white px-3 py-1 rounded"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
