import { NextResponse } from "next/server";
import { generateSummary } from "@/lib/gemini";

export async function POST(request) {
  try {
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
