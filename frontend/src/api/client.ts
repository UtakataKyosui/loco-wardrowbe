import type { ProblemDetails } from "./generated/model";
import { clearToken, getToken } from "../auth/token";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export class ApiClientError extends Error {
  readonly status: number;
  readonly body: ProblemDetails | null;

  constructor(status: number, body: ProblemDetails | null) {
    super(body?.detail ?? body?.title ?? `Request failed with status ${status}`);
    this.name = "ApiClientError";
    this.status = status;
    this.body = body;
  }
}

/** Reads an RFC 9457 `application/problem+json` error body. */
async function parseErrorBody(res: Response): Promise<ProblemDetails | null> {
  try {
    const data: unknown = await res.json();
    if (
      typeof data === "object" &&
      data !== null &&
      "title" in data &&
      "status" in data
    ) {
      return data as ProblemDetails;
    }
    return null;
  } catch {
    return null;
  }
}

export async function request<T>(
  method: HttpMethod,
  path: string,
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(path, {
    method,
    headers,
    credentials: "same-origin",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.ok) {
    return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
  }

  const errorBody = await parseErrorBody(res);

  if (res.status === 401) {
    clearToken();
    window.location.href = "/login";
  }

  throw new ApiClientError(res.status, errorBody);
}

export function get<T>(path: string): Promise<T> {
  return request<T>("GET", path);
}

export function post<T>(path: string, body: unknown): Promise<T> {
  return request<T>("POST", path, body);
}

export function put<T>(path: string, body: unknown): Promise<T> {
  return request<T>("PUT", path, body);
}

export function del(path: string): Promise<void> {
  return request<void>("DELETE", path);
}
