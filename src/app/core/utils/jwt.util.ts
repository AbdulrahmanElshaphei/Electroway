/**
 * Minimal JWT payload decoder — no external dependency needed since a JWT
 * payload is just base64url-encoded JSON. Does NOT verify the signature
 * (that's the backend's job); this is purely for reading claims client-side
 * (role, user id, expiry) to drive routing/guards.
 */
export interface DecodedJwt {
  // ASP.NET Identity puts these under their long XML-namespace claim URIs by
  // default (ClaimTypes.NameIdentifier / .Role / .Email), not short names.
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'?: string;
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role'?: string;
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'?: string;
  VerificationStatus?: string;
  exp?: number;
  [key: string]: unknown;
}

export function decodeJwt(token: string): DecodedJwt | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;

    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const json = decodeURIComponent(
      atob(padded)
        .split('')
        .map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
    );

    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function isJwtExpired(token: string): boolean {
  const decoded = decodeJwt(token);
  if (!decoded?.exp) return true;
  return Date.now() >= decoded.exp * 1000;
}
