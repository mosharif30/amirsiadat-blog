"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { clearAttempts, isRateLimited, recordFailedAttempt } from "@/lib/auth/rate-limit";
import { endSession, startSession } from "@/lib/auth/session";

export type LoginState = { error?: string; email?: string };

const credentials = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(200),
  next: z.string().optional(),
});

let dummyHash: Promise<string> | undefined;

/** Only allow redirects back into the admin area. */
const safeNext = (next?: string) => (next && /^\/admin(\/|$|\?)/.test(next) ? next : "/admin");

export async function login(_state: LoginState, formData: FormData): Promise<LoginState> {
  if ((process.env.AUTH_SECRET ?? "").length < 32) {
    return { error: "Sign-in is disabled: AUTH_SECRET is not configured on the server (see .env.example)." };
  }
  const parsed = credentials.safeParse(Object.fromEntries(formData));
  const email = String(formData.get("email") ?? "");
  if (!parsed.success) return { error: "Enter your email and password.", email };

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const key = `${ip}|${parsed.data.email}`;
  if (isRateLimited(key)) return { error: "Too many failed attempts. Try again in 15 minutes.", email };

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  // Hash anyway when the user doesn't exist so response times don't reveal valid emails.
  const valid = user
    ? await verifyPassword(parsed.data.password, user.passwordHash)
    : await verifyPassword(parsed.data.password, await (dummyHash ??= hashPassword("not-a-real-password"))).then(
        () => false,
      );

  if (!user || !valid) {
    recordFailedAttempt(key);
    return { error: "Invalid email or password.", email };
  }

  clearAttempts(key);
  await startSession(user);
  redirect(safeNext(parsed.data.next));
}

export async function logout() {
  await endSession();
  redirect("/admin/login");
}
