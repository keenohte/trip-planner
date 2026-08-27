/* Bound a promise that talks to an external service.

   Used on the request path in middleware and in server components. Both
   run inside a platform invocation limit, so an unbounded await turns a
   degraded upstream into a hard 504 for the entire site — which is what
   happened when Supabase Auth went unhealthy while every other service
   was fine.

   The convention throughout: `undefined` means "we could not find out",
   which callers must treat differently from a definite answer. Guessing
   "not signed in" or "no trip" on a timeout produces worse behaviour than
   admitting the uncertainty. */
export async function withTimeout<T>(work: PromiseLike<T>, ms: number, fallback: T): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      work,
      new Promise<T>((resolve) => {
        timer = setTimeout(() => resolve(fallback), ms);
      }),
    ]);
  } catch {
    return fallback;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export const AUTH_TIMEOUT_MS = 3000;
export const QUERY_TIMEOUT_MS = 2000;
