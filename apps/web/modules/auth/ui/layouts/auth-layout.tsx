export const Authlayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
      <div className="flex w-full max-w-md flex-col gap-6">
        <div className="space-y-2 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            Vivia Workspace
          </p>
          <h1 className="text-3xl font-bold tracking-tight">
            Friendly support starts here
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign in to manage conversations, customize your widget, and help visitors with confidence.
          </p>
        </div>
        {children}
      </div>
    </div>
  );
};
