import type { ZodType } from "zod";
import { getToken } from "../auth/token";

/** Shape of every generated client function's return value. */
export type ApiResponse<T> = { data: T; status: number; headers: Headers };

/**
 * Orval mutator. It never throws on HTTP error statuses: the response is
 * returned as-is so that `src/api/effect.ts` can turn it into a typed Effect
 * failure. Successful JSON bodies are validated with the generated Zod schema.
 */
export const customFetch = async <T>(
  url: string,
  options: RequestInit & { schema?: ZodType<unknown> } = {},
): Promise<T> => {
  const { schema, ...init } = options;
  const headers = new Headers(init.headers);
  const token = await getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(url, { credentials: "same-origin", ...init, headers });

  const text = [204, 205, 304].includes(res.status) ? "" : await res.text();
  let data: unknown = text;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (res.ok && schema && text) {
    data = schema.parse(data);
  }

  return { data, status: res.status, headers: res.headers } as T;
};
