import { NextResponse } from "next/server";

import { getRouteSession } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const response = NextResponse.json({ success: true });
  const session = await getRouteSession(request, response);
  session.destroy();
  await session.save();
  return response;
}
