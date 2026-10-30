import LoginForm from "./LoginForm";

const ERROR_MESSAGES: Record<string, string> = {
  invalid: "Incorrect email or password. Please try again.",
  not_admin: "This account does not have admin access.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; error?: string }>;
}) {
  const { from, error } = await searchParams;
  const errorMessage = error ? ERROR_MESSAGES[error] ?? "Something went wrong. Please try again." : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-bg px-4">
      <div className="w-full max-w-sm rounded-2xl border border-brand-border bg-brand-surface p-8 shadow-sm animate-fade-up">
        <h1 className="text-xl font-semibold text-foreground">MiniGreens Admin</h1>
        <p className="mt-1 text-sm text-muted">Sign in with your admin account to continue.</p>

        <LoginForm from={from} errorMessage={errorMessage} />
      </div>
    </div>
  );
}
