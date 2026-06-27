const rawApiUrl = import.meta.env.VITE_API_URL as string | undefined;
const cleanedApiUrl = (rawApiUrl ?? "")
  .trim()
  .replace(/^['"]|['"]$/g, "");
const fallbackApiUrl = import.meta.env.DEV ? "http://localhost:8000" : "";

export const API_BASE_URL = (cleanedApiUrl || fallbackApiUrl).replace(/\/+$/, "");

export function apiUrl(path: string) {
  if (!API_BASE_URL) {
    throw new Error(
      "VITE_API_URL is not set. For local development, set VITE_API_URL in .env or run the backend on http://localhost:8000."
    );
  }

  if (!path) return API_BASE_URL;

  return `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

// Optional debugging (enable with VITE_DEBUG_API=true)
if (import.meta.env.VITE_DEBUG_API === "true") {
  // eslint-disable-next-line no-console
  console.log("[api] VITE_API_URL =", rawApiUrl);
  // eslint-disable-next-line no-console
  console.log("[api] API_BASE_URL =", API_BASE_URL);
}
