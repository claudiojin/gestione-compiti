import { cookies } from "next/headers";
import { getIronSession, unsealData } from "iron-session";
import type { IronSession, SessionOptions } from "iron-session";

export type SessionData = {
  userId?: string;
};

const SESSION_PASSWORD = process.env.SESSION_PASSWORD;

if (!SESSION_PASSWORD || SESSION_PASSWORD.length < 32) {
  throw new Error(
    "SESSION_PASSWORD must be set in the environment and be at least 32 characters long.",
  );
}

const sessionOptions: SessionOptions = {
  cookieName: "taskpilot_session",
  password: SESSION_PASSWORD,
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
  },
};

export function getSessionOptions(): SessionOptions {
  return sessionOptions;
}

export async function getRouteSession(
  request: Request,
  response: Response,
): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(request, response, sessionOptions);
}

export async function getRequestSession(
  request: Request,
): Promise<IronSession<SessionData>> {
  const response = new Response();
  return getIronSession<SessionData>(request, response, sessionOptions);
}

export async function getSessionData(): Promise<SessionData> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(sessionOptions.cookieName);
  if (!cookie?.value) {
    return {};
  }

  try {
    const data = await unsealData<SessionData>(cookie.value, {
      password: sessionOptions.password,
    });
    return data ?? {};
  } catch (error) {
    console.warn("Failed to unseal session cookie", error);
    return {};
  }
}
