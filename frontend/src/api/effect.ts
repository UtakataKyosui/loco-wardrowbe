import { Data, Effect } from "effect";

/** Any generated response: a union of per-status `{ data, status }` shapes. */
type AnyResponse = { data: unknown; status: number };
type SuccessStatus = 200 | 201 | 202 | 203 | 204 | 205 | 206;
type SuccessData<R extends AnyResponse> = Extract<R, { status: SuccessStatus }>["data"];

/** The server answered with a non-2xx status. `body` is the parsed error body. */
export class HttpError extends Data.TaggedError("HttpError")<{
  readonly status: number;
  readonly body: unknown;
  readonly message: string;
}> {}

/** fetch failed (offline, CORS, ...) or the response failed Zod validation. */
export class NetworkError extends Data.TaggedError("NetworkError")<{
  readonly cause: unknown;
  readonly message: string;
}> {}

export type ApiError = HttpError | NetworkError;

function messageOf(body: unknown, status: number): string {
  if (typeof body === "object" && body !== null) {
    const b = body as Record<string, unknown>;
    // RFC 9457 `detail` / `title` first, then the pre-RFC shapes.
    for (const key of ["detail", "title", "description", "error", "message"]) {
      if (typeof b[key] === "string" && b[key]) return b[key] as string;
    }
  }
  return `Request failed with status ${status}`;
}

/**
 * Wraps a generated Orval call into an Effect.
 * 2xx -> success with the (validated) data; otherwise -> typed failure.
 *
 *   const user = yield* callApi(() => current());
 *   Effect.catchTag("HttpError", (e) => ...)
 */
export const callApi = <R extends AnyResponse>(
  call: () => Promise<R>,
): Effect.Effect<SuccessData<R>, ApiError> =>
  Effect.tryPromise({
    try: () => call(),
    catch: (cause) =>
      new NetworkError({
        cause,
        message: cause instanceof Error ? cause.message : "Network error",
      }),
  }).pipe(
    Effect.flatMap((res) =>
      res.status >= 200 && res.status < 300
        ? Effect.succeed(res.data as SuccessData<R>)
        : Effect.fail(
            new HttpError({
              status: res.status,
              body: res.data,
              message: messageOf(res.data, res.status),
            }),
          ),
    ),
  );
