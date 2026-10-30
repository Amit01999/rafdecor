import axios, { AxiosError } from "axios";

const useApiProxy = process.env.REACT_APP_API_MODE === "proxy";
const backendUrl = useApiProxy
  ? ""
  : process.env.REACT_APP_BACKEND_URL?.trim().replace(/\/+$/, "") || "";

export const API_BASE = `${backendUrl}/api/v1`;

export const api = axios.create({ baseURL: API_BASE, withCredentials: true });

let refreshing: Promise<unknown> | null = null;

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const cfg: any = error.config;
    const url = cfg?.url || "";
    if (error.response?.status === 401 && cfg && !cfg._retry && !/auth\/(refresh|login|register)/.test(url)) {
      cfg._retry = true;
      try {
        refreshing = refreshing || api.post("/auth/refresh");
        await refreshing;
        refreshing = null;
        return api(cfg);
      } catch {
        refreshing = null;
      }
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
