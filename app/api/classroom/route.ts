import { NextResponse } from "next/server";
import type { ClassroomAction } from "@/lib/state";
import { getStateFromSource, postActionToSource } from "@/lib/stateSource";

export async function GET() {
  try {
    const result = await getStateFromSource();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to load classroom state",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as ClassroomAction;
    const result = await postActionToSource(payload);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to update classroom state",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
