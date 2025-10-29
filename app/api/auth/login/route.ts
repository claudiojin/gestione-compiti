import { NextResponse } from "next/server";

import { findUserByEmail, verifyPassword } from "@/lib/auth";
import { getRouteSession } from "@/lib/session";
import { loginSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Formato JSON non valido" }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Credenziali non valide",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const { email, password } = parsed.data;
  const user = await findUserByEmail(email.toLowerCase());

  if (!user) {
    return NextResponse.json({ error: "Email o password errati" }, { status: 401 });
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Email o password errati" }, { status: 401 });
  }

  const response = NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  });

  const session = await getRouteSession(request, response);
  session.userId = user.id;
  await session.save();

  return response;
}
