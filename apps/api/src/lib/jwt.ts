import jwt from "jsonwebtoken";
import { env } from "../config/env";
import type { UserRole } from "@aihub/shared";

export interface JwtClaims {
  sub: string;
  role: UserRole;
  email: string;
  walletAddress?: string;
}

export function signAccessToken(claims: JwtClaims): string {
  return jwt.sign(claims, env.JWT_SECRET, { expiresIn: "15m" });
}

export function signRefreshToken(claims: JwtClaims): string {
  return jwt.sign(claims, env.JWT_REFRESH_SECRET, { expiresIn: "30d" });
}

export function verifyAccessToken(token: string): JwtClaims {
  return jwt.verify(token, env.JWT_SECRET) as JwtClaims;
}

export function verifyRefreshToken(token: string): JwtClaims {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtClaims;
}
