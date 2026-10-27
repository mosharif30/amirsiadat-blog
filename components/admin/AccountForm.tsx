"use client";

import { useActionState } from "react";
import { changePassword, type AccountState } from "@/app/admin/_actions/account";
import { cx, ui } from "./ui";

export default function AccountForm() {
  const [state, action, pending] = useActionState<AccountState, FormData>(changePassword, {});

  return (
    <form action={action} className={cx(ui.card, "space-y-4 p-5")} key={state.success}>
      <h2 className="text-sm font-semibold">Change password</h2>
      {[
        { name: "currentPassword", label: "Current password", autoComplete: "current-password" },
        { name: "newPassword", label: "New password", autoComplete: "new-password" },
        { name: "confirmPassword", label: "Confirm new password", autoComplete: "new-password" },
      ].map((field) => (
        <div key={field.name}>
          <label htmlFor={field.name} className={ui.label}>
            {field.label}
          </label>
          <input id={field.name} name={field.name} type="password" required autoComplete={field.autoComplete} className={ui.input} />
        </div>
      ))}
      {state.error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      {state.success && <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{state.success}</p>}
      <button type="submit" disabled={pending} className={cx(ui.button, ui.primary)}>
        {pending ? "Saving…" : "Change password"}
      </button>
    </form>
  );
}
