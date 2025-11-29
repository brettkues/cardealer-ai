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

    $("img").each((i, el) => {
      const src = $(el).attr("src");
      if (src && images.length < 20) {
        images.push(src);
      }
    });

    return new Response(JSON.stringify({ images }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}
