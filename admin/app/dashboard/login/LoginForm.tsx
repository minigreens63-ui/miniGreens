"use client";

import { useTransition } from "react";
import { CircleNotch } from "@phosphor-icons/react";
import { login } from "./actions";
import { PasswordInput } from "@/components/PasswordInput";

export default function LoginForm({ from, errorMessage }: { from?: string; errorMessage: string | null }) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await login(formData);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <input type="hidden" name="from" value={from ?? "/dashboard"} />
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-foreground">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoFocus
          autoComplete="email"
          disabled={isPending}
          className="mt-1 w-full rounded-lg border border-brand-border bg-white px-3 py-2 text-sm outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary disabled:opacity-60"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-foreground">
          Password
        </label>
        <PasswordInput
          id="password"
          name="password"
          required
          autoComplete="current-password"
          disabled={isPending}
        />
      </div>

      {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-brand-primary px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-primary-dark disabled:opacity-70"
      >
        {isPending && <CircleNotch size={16} className="animate-spin" />}
        {isPending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
