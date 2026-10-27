import type { Metadata } from "next";
import { redirect } from "next/navigation";
import LoginForm from "@/components/admin/LoginForm";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Sign in" };

type Props = { searchParams: Promise<{ next?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  if (await getCurrentUser()) redirect("/admin");
  const { next } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 bg-customBlue px-5 py-4 text-center">
          <p className="text-3xl text-gray-200">AMIR SIADAT</p>
          <p className="mt-1 text-xs uppercase tracking-widest text-slate-300">Dashboard</p>
        </div>
        <LoginForm next={next} />
      </div>
    </div>
  );
}
