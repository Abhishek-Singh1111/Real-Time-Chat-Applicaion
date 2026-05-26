const rawApiUrl = import.meta.env.VITE_API_URL as string | undefined;

export const API_BASE_URL = (rawApiUrl ?? "").replace(/\/+$/, "");

export function apiUrl(path: string) {
  if (!API_BASE_URL) {
    throw new Error("VITE_API_URL is not set (frontend/.env).");
  }

  if (!path) return API_BASE_URL;

  return `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

