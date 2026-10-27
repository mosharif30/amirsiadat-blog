/**
 * Creates an admin user, or resets the password of an existing one.
 *
 *   npm run admin:create -- --email you@example.com [--password "…"] [--name "Your Name"]
 *
 * Without --password you are prompted for it (input hidden).
 */
import { parseArgs } from "node:util";
import { loadEnv } from "./lib/env";

loadEnv();

const { createPrismaClient } = await import("../lib/db");
const { hashPassword, MIN_PASSWORD_LENGTH } = await import("../lib/auth/password");

const { values } = parseArgs({
  options: { email: { type: "string" }, password: { type: "string" }, name: { type: "string" } },
});

const email = values.email?.trim().toLowerCase();
if (!email || !/^[^@\s]+@[^@\s]+$/.test(email)) {
  console.error('Usage: npm run admin:create -- --email you@example.com [--password "…"] [--name "Name"]');
  process.exit(1);
}

const password = values.password ?? (await promptHidden("Password: "));
if (password.length < MIN_PASSWORD_LENGTH) {
  console.error(`The password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  process.exit(1);
}

const db = createPrismaClient();
try {
  const passwordHash = await hashPassword(password);
  const existing = await db.user.findUnique({ where: { email } });
  await db.user.upsert({
    where: { email },
    create: { email, name: values.name ?? null, passwordHash },
    // Resetting the password also signs out existing sessions.
    update: { passwordHash, sessionVersion: { increment: 1 }, ...(values.name ? { name: values.name } : {}) },
  });
  console.log(existing ? `Password reset for ${email}.` : `Created admin ${email}.`);
} finally {
  await db.$disconnect();
}

function promptHidden(question: string): Promise<string> {
  return new Promise((resolve) => {
    const { stdin, stdout } = process;
    stdout.write(question);
    let input = "";
    stdin.setRawMode?.(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    const onData = (char: string) => {
      if (char === "\r" || char === "\n" || char === "\u0004") {
        stdin.setRawMode?.(false);
        stdin.pause();
        stdin.off("data", onData);
        stdout.write("\n");
        resolve(input);
      } else if (char === "\u0003") {
        process.exit(130);
      } else if (char === "\u007f") {
        input = input.slice(0, -1);
      } else {
        input += char;
      }
    };
    stdin.on("data", onData);
  });
}
