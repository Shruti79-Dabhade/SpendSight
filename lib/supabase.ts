import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function mustGetEnv(name: string): string {
  const v = process.env[name];
  if (!v || v.trim().length === 0) {
    throw new Error(
      `Missing required environment variable: ${name}. Add it to your environment (and to .env.local in dev).`
    );
  }
  return v;
}

function isServer(): boolean {
  return typeof window === "undefined";
}

function getPublicSupabaseConfig(): { url: string; anonKey: string } {
  const url = mustGetEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = mustGetEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return { url, anonKey };
}

function getServiceRoleKey(): string {
  return mustGetEnv("SUPABASE_SERVICE_ROLE_KEY");
}

/**
 * Browser client: use in Client Components and browser-only code.
 */
export function getSupabaseBrowserClient(): SupabaseClient {
  if (isServer()) {
    throw new Error("getSupabaseBrowserClient() called on the server.");
  }
  const { url, anonKey } = getPublicSupabaseConfig();
  return createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
}

/**
 * Server (anon) client: use in Server Components / Route Handlers when acting as the user.
 * Note: Without `@supabase/ssr` we cannot automatically bind cookies; this client is mainly
 * for service-to-supabase calls where anon is sufficient (public reads, etc.).
 */
export function getSupabaseServerClient(): SupabaseClient {
  if (!isServer()) {
    throw new Error("getSupabaseServerClient() called in the browser.");
  }
  const { url, anonKey } = getPublicSupabaseConfig();
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });
}

/**
 * Admin client (service role): use ONLY on the server for privileged operations.
 */
export function getSupabaseAdminClient(): SupabaseClient {
  if (!isServer()) {
    throw new Error("getSupabaseAdminClient() must not be created in the browser.");
  }
  const { url } = getPublicSupabaseConfig();
  const serviceRoleKey = getServiceRoleKey();
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });
}

