import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "aspec_session";
const TOKEN_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export interface SessionUser {
  user_id: number;
  name: string;
  email: string;
  role: string;
}

export interface SessionPayload extends JWTPayload {
  user_id: number;
  name: string;
  email: string;
  role: string;
}

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not defined in .env");
  return new TextEncoder().encode(secret);
}

/**
 * Create a signed JWT for the given user.
 */
export async function signToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    user_id: user.user_id,
    name: user.name,
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_MAX_AGE}s`)
    .sign(getSecret());
}

/**
 * Verify and decode a JWT. Returns null if invalid/expired.
 */
export async function verifyToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * Read session cookie and return the authenticated user, or null.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  return {
    user_id: payload.user_id,
    name: payload.name,
    email: payload.email,
    role: payload.role,
  };
}

export { COOKIE_NAME, TOKEN_MAX_AGE };
