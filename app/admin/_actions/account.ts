"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword, MIN_PASSWORD_LENGTH, verifyPassword } from "@/lib/auth/password";
import { requireAdmin, startSession } from "@/lib/auth/session";

export type AccountState = { error?: string; success?: string };

const schema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: z.string().min(MIN_PASSWORD_LENGTH, `Use at least ${MIN_PASSWORD_LENGTH} characters.`).max(200),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, { message: "The new passwords don't match." });

/** Changes the password and signs out every other session (sessionVersion bump). */
export async function changePassword(_state: AccountState, formData: FormData): Promise<AccountState> {
  const admin = await requireAdmin();
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const user = await db.user.findUniqueOrThrow({ where: { id: admin.id } });
  if (!(await verifyPassword(parsed.data.currentPassword, user.passwordHash))) {
    return { error: "Your current password is incorrect." };
  }

  const updated = await db.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(parsed.data.newPassword), sessionVersion: { increment: 1 } },
  });
  await startSession(updated);
  return { success: "Password changed. Other devices have been signed out." };
}
