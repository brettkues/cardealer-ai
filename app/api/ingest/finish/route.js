import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const { department = "sales" } = await req.json();

    // get one unattempted
