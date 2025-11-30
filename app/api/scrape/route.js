import * as cheerio from "cheerio";

/**
 * Extracts images from the HTML
 */
function extractImages($, url) {
  const images = [];
  const base = new URL(url).origin;

  $("img").each((i, el) => {
    const src = $(el).attr("src");

    if (!src) return;

    // Only include true vehicle images
    if (src.includes("inventoryphotos") || src.includes("photos") || src.includes("vehicle")) {
      if (src.startsWith("http")) {
        images.push(src);
      } else {
        images.push(base + src);
      }
    }
  });

  // Deduplicate
  return [...new Set(images)];
}

/**
 * Extracts vehicle description text
 */
function extractDescription($) {
  let description = "";

  // Common containers on dealership sites
  const selectors = [
    ".vehicle-summary",
    ".description",
    ".vehicle-description",
    "#description",
    ".col-md-8 p",
    ".col-md-8 div",
    "p",
    "div",
  ];

  for (const sel of selectors) {
    $(sel).each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > 40 && text.length < 1500) {
        // Reasonable size for vehicle summary
        description = text;
      }
    });
    if (description) break;
  }

  return description || "No description found.";
}

export async function POST(request) {
  try {
    const { url, descriptionOnly } = await request.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: "No URL provided." }),
        { status: 400 }
      );
    }

    const res = await fetch(url);
    const html = await res.text();

    const $ = cheerio.load(html);

    // DESCRIPTION-ONLY PATH
    if (descriptionOnly) {
      const description = extractDescription($);

      return new Response(
        JSON.stringify({ description }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // FULL SCRAPE PATH
    const images = extractImages($, url).slice(0, 8); // fetch up to 8 (Social uses 4)
    const description = extractDescription($);

    return new Response(
      JSON.stringify({ images, description }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    );
  }
}
