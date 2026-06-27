const rawApiUrl = import.meta.env.VITE_API_URL as string | undefined;

// Normalize the environment variable by removing trailing/leading spaces or unintended quotes
const cleanedApiUrl = (rawApiUrl ?? "")
  .trim()
  .replace(/^['"]|['"]$/g, "");

// fallback is strictly restricted to development environment mode only
const fallbackApiUrl = import.meta.env.DEV ? "http://localhost:8000" : "";

// Final base configuration URL stripped of trailing forward slashes
export const API_BASE_URL = (cleanedApiUrl || fallbackApiUrl).replace(/\/+$/, "");

/**
 * Generates an absolute backend endpoint API path string uniform across the application.
 * @param path The nested route endpoint path string (e.g., '/api/auth/login' or 'api/users')
 */
export function apiUrl(path: string): string {
  if (!API_BASE_URL) {
    throw new Error(
      "CRITICAL APPLICATION ERROR: VITE_API_URL is missing. Please set your production backend URL inside your Vercel deployment project settings."
    );
  }

  if (!path) return API_BASE_URL;

  // Cleanly concatenate base URL and path without accidental double forward slashes
  return `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

// Global build environment logger
if (import.meta.env.MODE === "production") {
  // eslint-disable-next-line no-console
  console.log("[API Configuration] Application target pipeline locked onto:", API_BASE_URL);
}