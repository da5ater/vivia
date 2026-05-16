export default function Page() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-center text-foreground">
      <div className="max-w-md space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
          Diagnostics
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Sentry example page
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          This route is kept for diagnostics, but the sample error trigger is
          disabled in production builds.
        </p>
      </div>
    </main>
  );
}
