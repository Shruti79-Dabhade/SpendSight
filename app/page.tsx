import { SpendForm } from "@/components/SpendForm";

export default function Page() {
  return (
    <main className="min-h-dvh bg-background text-foreground">
      <div className="container max-w-6xl py-10">
        <div className="mb-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">SpendSight</p>
              <h1 className="mt-1 text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
                Get a free AI spend audit in 60 seconds
              </h1>
              <p className="mt-2 max-w-2xl text-pretty text-sm text-muted-foreground">
                Tell us your team size and the AI tools you pay for. We’ll estimate waste, right-size
                plans, and suggest savings.
              </p>
            </div>

            <div
              className="rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground"
              aria-label="Progress: step 1 of 3"
              role="status"
            >
              Step <span className="font-medium text-foreground">1</span> of{" "}
              <span className="font-medium text-foreground">3</span>
            </div>
          </div>
        </div>

        <SpendForm />
      </div>
    </main>
  );
}

