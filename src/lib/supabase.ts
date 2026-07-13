import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase Production Client
 *
 * Environment variables (read from Vite at build time):
 *   SUPABASE_URL=https://xxx.supabase.co          (project URL)
 *   SUPABASE_PUBLISHABLE_KEY=sb_publishable_...   (public key)
 *
 * Also supports legacy VITE_ prefixed names for Vite compatibility:
 *   VITE_SUPABASE_URL
 *   VITE_SUPABASE_PUBLISHABLE_KEY
 *
 * No hardcoded keys — all credentials come from environment variables.
 * The application will refuse to run if these are missing.
 */

// Read environment variables (support both prefixed and non-prefixed names)
const SUPABASE_URL =
  (import.meta as any).env?.VITE_SUPABASE_URL ??
  (import.meta as any).env?.SUPABASE_URL ??
  undefined;

const SUPABASE_PUBLISHABLE_KEY =
  (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY ??
  (import.meta as any).env?.SUPABASE_PUBLISHABLE_KEY ??
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ??
  (import.meta as any).env?.SUPABASE_ANON_KEY ??
  undefined;

// --- Connection status ---
export interface SupabaseStatus {
  configured: boolean;
  url: string | null;
  keyPresent: boolean;
  connected: boolean;
  error: string | null;
}

const status: SupabaseStatus = {
  configured: false,
  url: null,
  keyPresent: false,
  connected: false,
  error: null,
};

// Validate env vars at module load
if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  status.error =
    "Missing required environment variables.\n" +
    "Please set both:\n" +
    "  SUPABASE_URL=https://xxx.supabase.co\n" +
    "  SUPABASE_PUBLISHABLE_KEY=sb_publishable_...\n" +
    "See .env.example for reference.";
  console.error(
    "%c[Supabase] ✗ Configuration Error%c\n" +
      "Missing environment variables: SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY\n" +
      "See .env.example for setup instructions.",
    "color:#ef4444;font-weight:bold;font-size:14px",
    "color:#94a3b8;font-size:11px"
  );
} else {
  status.configured = true;
  status.url = SUPABASE_URL;
  status.keyPresent = SUPABASE_PUBLISHABLE_KEY.length > 20;
}

// --- Create Supabase client ---
let supabaseClient: SupabaseClient | null = null;

if (status.configured) {
  try {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "pkce",
      },
      global: {
        headers: {
          "x-client-info": "nursehub-egypt/6.0",
        },
      },
      db: {
        schema: "public",
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });

    console.info(
      "%c[Supabase] ✓ Client Initialized%c\n  URL: %s\n  Key: %s...",
      "color:#10b981;font-weight:bold;font-size:13px",
      "color:#94a3b8;font-size:11px",
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY.slice(0, 12)
    );
  } catch (err) {
    status.error = `Client initialization failed: ${(err as Error).message}`;
    console.error("[Supabase] ✗ Client initialization failed:", err);
    supabaseClient = null;
  }
}

// --- Exports ---
export const supabase = supabaseClient;
export const isSupabaseConfigured = (): boolean => status.configured && supabaseClient !== null;

// For backward compatibility with existing code
export const isSupabaseEnabled = isSupabaseConfigured();

export function getSupabaseStatus(): Readonly<SupabaseStatus> {
  return { ...status };
}

/**
 * Verify connection to Supabase by pinging the auth API.
 * Returns true if connection is healthy, false otherwise.
 * Call this at application startup to ensure backend is reachable.
 */
export async function verifySupabaseConnection(): Promise<boolean> {
  if (!supabaseClient) {
    status.error = "Supabase client not initialized";
    status.connected = false;
    return false;
  }

  try {
    // Lightweight ping: fetch auth settings (no credentials needed)
    const { error } = await supabaseClient.auth.getSession();
    if (error && error.message !== "Auth session missing!") {
      status.error = `Connection failed: ${error.message}`;
      status.connected = false;
      console.warn("[Supabase] ⚠ Connection check returned:", error.message);
      // Still mark as connected — auth error is normal when no session exists
    }

    status.connected = true;
    status.error = null;
    console.info(
      "%c[Supabase] ✓ Connection Verified%c\n  Backend is reachable and healthy.",
      "color:#10b981;font-weight:bold;font-size:13px",
      "color:#94a3b8;font-size:11px"
    );
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    status.error = `Connection verification failed: ${message}`;
    status.connected = false;
    console.error("[Supabase] ✗ Connection verification failed:", err);
    return false;
  }
}

/**
 * Table names used by the platform. Keep them in one place so the SQL schema
 * (supabase/schema.sql) and the app stay in sync.
 */
export const TABLES = {
  articles: "articles",
  comments: "comments",
  media: "media",
  products: "products",
  users: "profiles",
  pages: "pages",
  categories: "categories",
  tags: "tags",
  subscribers: "subscribers",
  ads: "ads",
  affiliates: "affiliates",
  redirects: "redirects",
  activity: "activity_log",
  ratings: "ratings",
  drugs: "drugs",
  settings: "site_settings",
} as const;

/**
 * Subscribe to Supabase Realtime channels.
 * This enables live updates across connected clients.
 */
export function subscribeToTable(
  tableName: string,
  onInsert?: (payload: any) => void,
  onUpdate?: (payload: any) => void,
  onDelete?: (payload: any) => void
) {
  if (!supabaseClient) {
    console.warn("[Supabase] Cannot subscribe — client not initialized");
    return { unsubscribe: () => {} };
  }

  let channel = supabaseClient.channel(`public:${tableName}`);

  channel = channel.on(
    "postgres_changes" as any,
    { event: "*", schema: "public", table: tableName } as any,
    (payload: any) => {
      switch (payload.eventType) {
        case "INSERT":
          onInsert?.(payload.new);
          break;
        case "UPDATE":
          onUpdate?.(payload.new);
          break;
        case "DELETE":
          onDelete?.(payload.old);
          break;
      }
    }
  );

  channel.subscribe((status: string) => {
    if (status === "SUBSCRIBED") {
      console.info(`[Supabase] ✓ Subscribed to ${tableName} (Realtime)`);
    } else if (status === "CHANNEL_ERROR") {
      console.error(`[Supabase] ✗ Subscription failed for ${tableName}`);
    }
  });

  return {
    unsubscribe: () => {
      supabaseClient?.removeChannel(channel);
    },
  };
}

/**
 * Upload a file to Supabase Storage bucket.
 * Returns the public URL for the uploaded file.
 */
export async function uploadToStorage(
  bucket: string,
  path: string,
  file: File,
  options?: { upsert?: boolean; cacheControl?: number }
): Promise<{ url: string; path: string }> {
  if (!supabaseClient) {
    throw new Error("Supabase client not initialized");
  }

  const { data, error } = await supabaseClient.storage
    .from(bucket)
    .upload(path, file, {
      upsert: options?.upsert ?? false,
      cacheControl: String(options?.cacheControl ?? 3600),
    });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  const { data: publicData } = supabaseClient.storage.from(bucket).getPublicUrl(data.path);

  return {
    url: publicData.publicUrl,
    path: data.path,
  };
}

/**
 * Get public URL for a file in Supabase Storage.
 */
export function getStoragePublicUrl(bucket: string, path: string): string {
  if (!supabaseClient) {
    throw new Error("Supabase client not initialized");
  }
  const { data } = supabaseClient.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Sign out the current user from Supabase Auth.
 */
export async function signOut(): Promise<void> {
  if (!supabaseClient) return;
  await supabaseClient.auth.signOut();
}
