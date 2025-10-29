import type { IronSession, IronSessionOptions } from "iron-session";
import { getIronSession as getIronEdgeSession } from "iron-session/edge";
import { getIronSession as getIronNodeSession } from "iron-session";
import { cookies } from "next/headers";

export type SessionData = {
  userId?: string;
};

const SESSION_PASSWORD = process.env.SESSION_PASSWORD;

if (!SESSION_PASSWORD || SESSION_PASSWORD.length < 32) {
  throw new Error(
    "SESSION_PASSWORD must be set in the environment and be at least 32 characters long.",
  );
}

const sessionOptions: IronSessionOptions = {
  cookieName: "taskpilot_session",
  password: SESSION_PASSWORD,
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
  },
};

export function getSessionOptions(): IronSessionOptions {
  return sessionOptions;
}

export async function getRouteSession(
  request: Request,
  response: Response,
): Promise<IronSession<SessionData>> {
  return getIronEdgeSession<SessionData>(request, response, sessionOptions);
}

export async function getRequestSession(
  request: Request,
): Promise<IronSession<SessionData>> {
  const response = new Response();
  return getIronEdgeSession<SessionData>(request, response, sessionOptions);
}

export async function getServerSession(): Promise<IronSession<SessionData>> {
  const cookieStore = cookies();
  return getIronNodeSession<SessionData>(cookieStore, sessionOptions);
}
