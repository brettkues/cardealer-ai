export async function lookupVehicleImages(vehicleUrl) {
  // 1. Fetch vehicle page HTML
  const html = await fetch(vehicleUrl).then(r => r.text());

  // 2. Extract VIN (DealerOn always exposes it in the URL or page text)
  const vinMatch = html.match(/[A-HJ-NPR-Z0-9]{17}/i);
  if (!vinMatch) {
    throw new Error("VIN not found on vehicle page");
  }
  const vin = vinMatch[0].toLowerCase();

  // 3. Extract store ID (DealerOn inventoryphotos path)
  // Example: /inventoryphotos/8693/{VIN}/ip/1.jpg
  const storeMatch = html.match(/inventoryphotos\/(\d+)\//);
  if (!storeMatch) {
    throw new Error("DealerOn store ID not found");
  }
  const storeId = storeMatch[1];

  // 4. Build image candidates in order
  const base = `https://www.pischkemotorsoflacrosse.com/inventoryphotos/${storeId}/${vin}/ip`;
  const foundImages = [];

  for (let i = 1; i <= 10; i++) {
    const url = `${base}/${i}.jpg`;
    try {
      const res = await fetch(url, { method: "HEAD" });
      if (res.ok) {
        foundImages.push(url);
        if (foundImages.length === 4) break;
      }
    } catch (_) {
      // ignore fetch failures
    }
  }

  if (foundImages.length === 0) {
    throw new Error("No valid inventory photos found for VIN");
  }

  // 5. Enforce exactly 4 images (reuse first if needed)
  while (foundImages.length < 4) {
    foundImages.push(foundImages[0]);
  }

  return foundImages.slice(0, 4);
}
