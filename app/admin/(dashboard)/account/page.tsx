import type { Metadata } from "next";
import AccountForm from "@/components/admin/AccountForm";
import { requireAdminPage } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const user = await requireAdminPage();
  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-1 text-2xl font-semibold">Account</h1>
      <p className="mb-6 text-sm text-slate-500">Signed in as {user.email}</p>
      <AccountForm />
    </div>
  );
}
