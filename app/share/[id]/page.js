import { createClient } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

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
  const shareUrl = `${siteUrl}/share/${id}`;
  const resolvedVehicleUrl = vehicleUrl?.startsWith("http")
    ? vehicleUrl
    : `${siteUrl}${vehicleUrl?.startsWith("/") ? "" : "/"}${vehicleUrl}`;

  const userAgent = headers().get("user-agent") || "";
  const isFacebookCrawler = /facebookexternalhit|facebot/i.test(userAgent);

  if (!isFacebookCrawler) {
    redirect(resolvedVehicleUrl);
  }

  const imageType = imageUrl?.endsWith(".png")
    ? "image/png"
    : imageUrl?.endsWith(".webp")
      ? "image/webp"
      : imageUrl?.endsWith(".gif")
        ? "image/gif"
        : "image/jpeg";
  const imageWidth = 1200;
  const imageHeight = 630;

  return (
    <html>
      <head>
        <title>Vehicle Listing</title>

        {/* Open Graph (Facebook SAFE) */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Vehicle Listing" />
        {imageUrl && <meta property="og:image" content={imageUrl} />}
        {imageUrl && (
          <meta property="og:image:secure_url" content={imageUrl} />
        )}
        {imageUrl && (
          <meta property="og:image:type" content={imageType} />
        )}
        {imageUrl && (
          <meta property="og:image:width" content={imageWidth} />
        )}
        {imageUrl && (
          <meta property="og:image:height" content={imageHeight} />
        )}
        <meta property="og:url" content={shareUrl} />
        <meta
          property="og:description"
          content="View this vehicle listing."
        />

        <link rel="canonical" href={shareUrl} />
      </head>
      <body>
        <p>View this vehicle listing:</p>
        <a href={resolvedVehicleUrl}>{resolvedVehicleUrl}</a>
      </body>
    </html>
  );
}
