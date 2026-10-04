// ─── Authentication Utilities ───
// JWT signing, verification, password hashing

import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

// ─── Config ───
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-change-in-production"
);

const TOKEN_EXPIRY = "7d";
const COOKIE_NAME = "shopvault_token";

// ─── Types ───
export interface JWTPayload {
  userId: string;
  email: string;
  role: "MEMBER" | "ADMIN";
}

export interface AuthResult {
  success: boolean;
  token?: string;
  user?: JWTPayload;
  error?: string;
}

// ─── Password Hashing ───
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// ─── JWT Token Creation ───
export async function createToken(payload: JWTPayload): Promise<string> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(JWT_SECRET);

  return token;
}

// ─── JWT Token Verification ───
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch (error) {
    return null;
  }
}

// ─── Set Auth Cookie (Server Action / API Route) ───
export function setAuthCookie(token: string) {
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

// ─── Remove Auth Cookie ───
export function removeAuthCookie() {
  cookies().delete(COOKIE_NAME);
}

// ─── Get Current User from Request ───
export async function getCurrentUser(
  request?: NextRequest
): Promise<JWTPayload | null> {
  try {
    // Try cookie first
    const cookieStore = cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
      // Try Authorization header
      const authHeader = request?.headers.get("authorization");
      if (!authHeader?.startsWith("Bearer ")) return null;
      const headerToken = authHeader.split(" ")[1];
      return verifyToken(headerToken);
    }

    return verifyToken(token);
  } catch {
    return null;
  }
}

// ─── Check if user is Admin ───
export async function requireAdmin(
  request?: NextRequest
): Promise<JWTPayload> {
  const user = await getCurrentUser(request);
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  if (user.role !== "ADMIN") {
    throw new Error("FORBIDDEN");
  }
  return user;
}

// ─── Check if user is authenticated (any role) ───
export async function requireAuth(
  request?: NextRequest
): Promise<JWTPayload> {
  const user = await getCurrentUser(request);
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}