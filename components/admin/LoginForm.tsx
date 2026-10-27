"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/app/admin/_actions/auth";
import { cx, ui } from "./ui";

export default function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});

  return (
    <form action={action} className={cx(ui.card, "space-y-4 p-6")}>
      <h1 className="text-lg font-semibold text-slate-900">Sign in</h1>
      {next && <input type="hidden" name="next" value={next} />}
      <div>
        <label htmlFor="email" className={ui.label}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          defaultValue={state.email}
          className={ui.input}
        />
      </div>
      <div>
        <label htmlFor="password" className={ui.label}>
          Password
        </label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className={ui.input} />
      </div>
      {state.error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className={cx(ui.button, ui.primary, "w-full")}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
