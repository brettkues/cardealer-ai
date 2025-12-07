          onClick={scrapeImages}
          className="bg-blue-600 text-white py-3 px-6 rounded hover:bg-blue-700 transition"
        >
          Scrape Images
        </button>

        <p>{status}</p>
      </div>

      {/* Image grid */}
      <div className="grid grid-cols-4 gap-4 mt-6">
        {images.map((src, i) => (
          <div
            key={i}
            className={`border rounded overflow-hidden cursor-pointer ${
              selected.includes(src) ? "ring-4 ring-blue-500" : ""
            }`}
            onClick={() => toggle(src)}
          >
            <img src={src} className="w-full h-32 object-cover" />
          </div>
        ))}
      </div>

      {/* Continue button */}
      {selected.length === 4 && (
        <button
          onClick={continueToGenerate}
          className="mt-6 bg-green-600 text-white py-3 px-6 rounded hover:bg-green-700 transition"
        >
          Continue to Image Generator
        </button>
      )}
    </div>
  );
}
