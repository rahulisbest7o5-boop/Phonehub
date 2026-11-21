
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    );

    const { data, error } = await supabase
      .from("phones")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      total: data.length,
      phones: data,
    });
  } catch (error) {
    console.error("Error loading phones:", error);

    return NextResponse.json(
      { error: "Failed to load phones" },
      { status: 500 }
    );
  }
}
