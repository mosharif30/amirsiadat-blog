import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/lib/db";
import { SESSION_COOKIE, SESSION_MAX_AGE, signSession, verifySessionToken } from "./token";

export type AdminUser = { id: string; email: string; name: string | null };

/** Returns the signed-in admin, re-checking the user and session version in the database. */
export const getCurrentUser = cache(async (): Promise<AdminUser | null> => {
  const store = await cookies();
  const session = await verifySessionToken(store.get(SESSION_COOKIE)?.value);
  if (!session) return null;
  const user = await db.user.findUnique({
    where: { id: session.sub },
    select: { id: true, email: true, name: true, sessionVersion: true },
  });
  if (!user || user.sessionVersion !== session.ver) return null;
  return { id: user.id, email: user.email, name: user.name };
});

/** For admin pages: redirects to the login page when not signed in. */
export async function requireAdminPage(): Promise<AdminUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  return user;
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Not authorized");
  }
}

/** For server actions and route handlers: throws when not signed in. */
export async function requireAdmin(): Promise<AdminUser> {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();
  return user;
}

export async function startSession(user: { id: string; sessionVersion: number }) {
  const token = await signSession({ sub: user.id, ver: user.sessionVersion });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" && process.env.INSECURE_COOKIES !== "true",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function endSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
