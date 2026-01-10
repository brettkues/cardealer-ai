import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function SharePage({ params }) {
  const id = params?.id;

  let imageUrl = "";
  let vehicleUrl = "/";

  try {
    const { data } = await supabase
      .from("image_shares")
      .select("image_url, vehicle_url")
      .eq("id", id)
      .single();

    if (data) {
      imageUrl = data.image_url;
      vehicleUrl = data.vehicle_url;
    }
  } catch (err) {
    console.error("Share page lookup failed:", err);
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://cardealership-ai.com";

  return (
    <html>
      <head>
        <title>Vehicle Listing</title>

        {/* Open Graph (Facebook SAFE) */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Vehicle Listing" />
        {imageUrl && <meta property="og:image" content={imageUrl} />}
        <meta property="og:url" content={`${siteUrl}/share/${id}`} />
        <meta
          property="og:description"
          content="View this vehicle listing."
        />

        {/* Human redirect */}
        <meta httpEquiv="refresh" content={`0; url=${vehicleUrl}`} />
      </head>
      <body>Redirecting…</body>
    </html>
  );
}
