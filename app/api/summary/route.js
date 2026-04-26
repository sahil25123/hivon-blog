import { NextResponse } from "next/server";
import { generateSummary } from "@/lib/gemini";
import { createClient } from "@/lib/supabase/server";

export async function POST(request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const role = profile?.role;
    if (role !== "author" && role !== "admin") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const payload = await request.json();
    const bodyText = payload?.bodyText;

    if (typeof bodyText !== "string" || !bodyText.trim()) {
      return NextResponse.json(
        { error: "bodyText is required." },
        { status: 400 },
      );
    }

    const summary = await generateSummary(bodyText);

    if (!summary) {
      return NextResponse.json(
        { error: "Failed to generate summary." },
        { status: 502 },
      );
    }

    return NextResponse.json({ summary }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Failed to generate summary." },
      { status: 500 },
    );
  }
}
