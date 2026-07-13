/**
 * Secure admin authentication utilities.
 *
 * Passwords are NEVER stored in plaintext and NEVER hardcoded in source.
 * We use PBKDF2 (SHA-256, 210k iterations) via the browser-native Web Crypto
 * API to derive a salted hash. The format is: pbkdf2$<iterations>$<saltB64>$<hashB64>
 *
 * Production options (in priority order):
 *  1. Env vars: VITE_ADMIN_EMAIL + VITE_ADMIN_PASSWORD_HASH
 *     (generate the hash once with `hashPassword()` and store ONLY the hash).
 *  2. First-time setup page: creates the first admin (hash stored), then the
 *     setup flow is disabled permanently.
 *
 * Note: For a full server-side deployment, move verification to a Supabase
 * Edge Function and use Supabase Auth (bcrypt/argon2 server-side). This module
 * provides a secure client baseline that requires no plaintext credentials.
 */

const ITERATIONS = 210_000;
const ADMIN_KEY = "nursehub_admin_credential_v1"; // stores email + password hash (no plaintext)
const SESSION_KEY = "nursehub_admin_session_v1";
const SETUP_LOCK_KEY = "nursehub_setup_locked_v1";

const enc = new TextEncoder();

function toB64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}
function fromB64(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<string> {
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt as BufferSource, iterations, hash: "SHA-256" },
    keyMaterial,
    256
  );
  return toB64(bits);
}

/** Create a secure, salted password hash string (safe to store / put in env). */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(password, salt, ITERATIONS);
  return `pbkdf2$${ITERATIONS}$${toB64(salt.buffer)}$${hash}`;
}

/** Constant-time-ish comparison of a password against a stored hash string. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const [scheme, iterStr, saltB64, hashB64] = stored.split("$");
    if (scheme !== "pbkdf2") return false;
    const iterations = parseInt(iterStr, 10);
    const salt = fromB64(saltB64);
    const computed = await derive(password, salt, iterations);
    // length-safe compare
    if (computed.length !== hashB64.length) return false;
    let diff = 0;
    for (let i = 0; i < computed.length; i++) diff |= computed.charCodeAt(i) ^ hashB64.charCodeAt(i);
    return diff === 0;
  } catch {
    return false;
  }
}

interface StoredCredential { email: string; hash: string }

/** Env-configured admin (highest priority). Only the HASH is ever present. */
function envAdmin(): StoredCredential | null {
  const email = import.meta.env.VITE_ADMIN_EMAIL as string | undefined;
  const hash = import.meta.env.VITE_ADMIN_PASSWORD_HASH as string | undefined;
  if (email && hash) return { email, hash };
  return null;
}

function localAdmin(): StoredCredential | null {
  try {
    const raw = localStorage.getItem(ADMIN_KEY);
    return raw ? (JSON.parse(raw) as StoredCredential) : null;
  } catch {
    return null;
  }
}

/** Whether ANY admin exists (env or created via setup). */
export function adminExists(): boolean {
  return Boolean(envAdmin() || localAdmin());
}

/** Setup is available only if no admin exists AND the one-time lock isn't set. */
export function setupAvailable(): boolean {
  return !adminExists() && localStorage.getItem(SETUP_LOCK_KEY) !== "1";
}

/** Create the first admin (only allowed if setup is available). */
export async function createFirstAdmin(email: string, password: string): Promise<boolean> {
  if (!setupAvailable()) return false;
  const hash = await hashPassword(password);
  localStorage.setItem(ADMIN_KEY, JSON.stringify({ email: email.trim().toLowerCase(), hash }));
  localStorage.setItem(SETUP_LOCK_KEY, "1"); // disable setup permanently
  return true;
}

/** Verify credentials against env admin or the created admin. */
export async function authenticate(email: string, password: string): Promise<boolean> {
  const cred = envAdmin() || localAdmin();
  if (!cred) return false;
  if (email.trim().toLowerCase() !== cred.email.trim().toLowerCase()) return false;
  return verifyPassword(password, cred.hash);
}

/* ---- Session management with expiry (12h) ---- */
const SESSION_TTL = 12 * 60 * 60 * 1000;

export function startSession() {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ at: Date.now() }));
}
export function endSession() {
  localStorage.removeItem(SESSION_KEY);
}
export function hasValidSession(): boolean {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return false;
    const { at } = JSON.parse(raw);
    return Date.now() - at < SESSION_TTL;
  } catch {
    return false;
  }
}
