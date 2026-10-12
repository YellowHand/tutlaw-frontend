import { clearStoredToken, getStoredToken } from "../features/auth/tokenStorage";
import { ROUTES } from "../config/routes";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

const PUBLIC_PATHS: string[] = [ROUTES.landing, ROUTES.login, ROUTES.register, ROUTES.checkEmail, ROUTES.verify];

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });

  if (response.status === 401) {
    clearStoredToken();
    if (!PUBLIC_PATHS.includes(window.location.pathname)) {
      window.location.href = ROUTES.login;
    }
    throw new ApiError(401, "Unauthorized");
  }

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new ApiError(response.status, message || response.statusText);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}