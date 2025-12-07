              }`}
              onClick={() => toggleSelect(url)}
            >
              <img src={url} alt="" className="w-full h-32 object-cover" />
            </div>
          ))}
        </div>
      )}

      {/* GENERATE COLLAGE */}
      {selectedImages.length === 4 && (
        <button
          onClick={generateCollage}
          className="mt-6 bg-green-600 text-white py-3 px-6 rounded hover:bg-green-700 transition"
        >
          Generate Collage
        </button>
      )}

      {/* OUTPUT */}
      {collageUrl && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Final Image</h2>
          <img src={collageUrl} className="w-[850px] h-[850px] border rounded shadow" />
          <a
            href={collageUrl}
            download={`collage-${stock}.jpg`}
            className="block mt-4 text-blue-600 underline"
          >
            Download JPEG
          </a>
        </div>
      )}
    </div>
  );
}
