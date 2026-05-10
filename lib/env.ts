function mustGetEnv(name: string): string {
  const v = process.env[name];
  if (!v || v.trim().length === 0) {
    throw new Error(
      `Missing required environment variable: ${name}. Add it to your environment (and to .env.local in dev).`
    );
  }
  return v;
}

export function getAnthropicApiKey(): string {
  return mustGetEnv("ANTHROPIC_API_KEY");
}

export function getResendApiKey(): string {
  return mustGetEnv("RESEND_API_KEY");
}

export function getResendFromEmail(): string {
  return process.env.RESEND_FROM_EMAIL?.trim() || "audit@spendsight.app";
}

