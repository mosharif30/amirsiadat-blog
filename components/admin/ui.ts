/** Shared Tailwind class names for the admin dashboard. */
export const ui = {
  input:
    "block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-customBlue focus:outline-none focus:ring-2 focus:ring-customBlue/20 disabled:bg-slate-100",
  label: "mb-1 block text-sm font-medium text-slate-700",
  hint: "mt-1 text-xs text-slate-500",
  error: "mt-1 text-xs font-medium text-red-600",
  card: "rounded-lg border border-slate-200 bg-white shadow-sm",
  button:
    "inline-flex items-center justify-center gap-2 rounded-md px-3.5 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-customBlue/40 disabled:cursor-not-allowed disabled:opacity-50",
  primary: "bg-customBlue text-white hover:bg-[#0c4d7c]",
  secondary: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
  danger: "border border-red-200 bg-white text-red-600 hover:bg-red-50",
  ghost: "text-slate-600 hover:bg-slate-100",
};

export const cx = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(" ");
