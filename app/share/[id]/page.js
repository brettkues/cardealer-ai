import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function SharePage({ params }) {
  const { id } = params;

  const { data } = await supabase
    .from("image_shares")
    .select("*")
    .eq("id", id)
    .single();

  if (!data) notFound();

  return (
    <html>
      <head>
        <title>Vehicle Listing</title>

        <meta property="og:type" content="website" />
        <meta property="og:title" content="Vehicle Listing" />
        <meta property="og:image" content={data.image_url} />
        <meta property="og:url" content={`${process.env.NEXT_PUBLIC_SITE_URL}/share/${id}`} />
        <meta property="og:description" content="View this vehicle listing." />

        <meta httpEquiv="refresh" content={`0; url=${data.vehicle_url}`} />
      </head>
      <body>Redirecting…</body>
    </html>
  );
}
