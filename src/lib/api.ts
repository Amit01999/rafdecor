import axios, { AxiosError } from "axios";

const hostname = typeof window === "undefined" ? "" : window.location.hostname.toLowerCase();
const isComBdFrontend = hostname === "rafdecor.com.bd" || hostname === "www.rafdecor.com.bd";
const useApiProxy = isComBdFrontend || process.env.REACT_APP_API_MODE === "proxy";
const backendUrl = useApiProxy
  ? ""
  : process.env.REACT_APP_BACKEND_URL?.trim().replace(/\/+$/, "") || "";

export const API_BASE = `${backendUrl}/api/v1`;

export const api = axios.create({ baseURL: API_BASE, withCredentials: true });

let refreshing: Promise<unknown> | null = null;
let authEpoch = 0;
let refreshUnavailableEpoch: number | null = null;
let authExpiredHandler: (() => void) | null = null;

export function markAuthSessionAuthenticated() {
  authEpoch += 1;
  refreshUnavailableEpoch = null;
}

export function markAuthSessionLoggedOut() {
  authEpoch += 1;
  refreshUnavailableEpoch = authEpoch;
}

export function onAuthSessionExpired(handler: () => void) {
  authExpiredHandler = handler;
  return () => {
    if (authExpiredHandler === handler) authExpiredHandler = null;
  };
}

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const cfg: any = error.config;
    const url = cfg?.url || "";
    if (error.response?.status === 401 && cfg && !cfg._retry
      && !/auth\/(refresh|login|register|logout|forgot-password|reset-password)/.test(url)
      && refreshUnavailableEpoch !== authEpoch) {
      cfg._retry = true;
      const requestEpoch = authEpoch;
      const refreshRequest = refreshing || (refreshing = api.post("/auth/refresh"));
      try {
        await refreshRequest;
      } catch (refreshError) {
        if ((refreshError as AxiosError).response?.status === 401 && requestEpoch === authEpoch
          && refreshUnavailableEpoch !== requestEpoch) {
          refreshUnavailableEpoch = requestEpoch;
          authExpiredHandler?.();
        }
        return Promise.reject(error);
      } finally {
        if (refreshing === refreshRequest) refreshing = null;
      }
      return api(cfg);
    }
    return Promise.reject(error);
  },
);

export function errorMessage(e: any, fallback = "Something went wrong. Please try again."): string {
  const d = e?.response?.data?.detail;
  if (!d) return e?.message && !e?.response ? "Network error. Please check your connection." : fallback;
  if (typeof d === "string") return d;
  if (Array.isArray(d)) return d.map((x) => x?.msg?.replace(/^Value error, /, "") || JSON.stringify(x)).join(" ");
  if (typeof d === "object" && d.message) return d.message;
  return fallback;
}

export function errorIssues(e: any): any[] {
  const d = e?.response?.data?.detail;
  return (d && typeof d === "object" && Array.isArray(d.issues)) ? d.issues : [];
}
