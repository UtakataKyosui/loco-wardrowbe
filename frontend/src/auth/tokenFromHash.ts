/**
 * Reads the one-time token from the URL fragment (`/verify#<token>`) and
 * removes it from the address bar.
 *
 * The mails carry the token in the fragment on purpose: a fragment is never
 * sent to the server, so it stays out of access logs and `Referer` headers
 * (RFC 3986 §7.5). Clearing it keeps it out of the browser history as well.
 */
export function takeTokenFromHash(): string | null {
  const token = window.location.hash.slice(1);
  if (token === "") return null;
  window.history.replaceState(
    null,
    "",
    window.location.pathname + window.location.search,
  );
  return token;
}
