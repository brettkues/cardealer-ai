import * as cheerio from "cheerio";

export async function POST(request) {
  try {
    const { url } = await request.json();
    if (!url) {
      return new Response(JSON.stringify({ error: "No URL provided" }), {
        status: 400,
      });
    }

    const res = await fetch(url);
    const html = await res.text();
    const $ = cheerio.load(html);

    const images = [];
    const base = new URL(url).origin;

    $("img").each((i, el) => {
      let src = $(el).attr("src") || $(el).attr("data-src") || "";

      if (!src) return;

      // Convert relative → absolute
      if (!src.startsWith("http")) {
        src = base + src;
      }

      // FILTER OUT garbage images (logos, icons, social media, low-res)
      const lower = src.toLowerCase();

      const blacklist = [
        "logo",
        "icon",
        "favicon",
        "sprite",
        "placeholder",
        "thumbnail",
        "thumb",
        "badge",
        "banner",
        "arrow",
        "pixel",
        "tracker",
        ".svg",
        "facebook",
        "twitter",
        "apple-touch",
        "google",
      ];

      if (blacklist.some((b) => lower.includes(b))) return;

      // FILTER IN large meaningful vehicle images
      const whitelist = [
        "inventory",
        "photos",
        "vehicle",
        "autotrader",
        "cars.com",
        "carfax",
        "cdn",
        "images",
        "photo",
        "media",
        "dealer",
        "uploads",
      ];

      if (!whitelist.some((w) => lower.includes(w))) return;

      // Basic size filter (avoid tiny icons)
      const width = parseInt($(el).attr("width") || "0");
      const height = parseInt($(el).attr("height") || "0");

      if (width && height && (width < 300 || height < 200)) return;

      // FINAL: push it
      images.push(src);
    });

    // Return first 20 just in case page has duplicates
    const unique = [...new Set(images)].slice(0, 20);

    return new Response(JSON.stringify({ images: unique }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}
