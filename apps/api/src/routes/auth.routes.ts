import { Hono } from "hono";
import { connectWalletSchema, loginSchema, registerSchema, type UserRole } from "@aihub/shared";
import { authMiddleware } from "../middleware/auth";
import { failure, success } from "../lib/response";
import { connectWallet, loginUser, logoutUser, refreshAccessToken, registerUser } from "../services";
import { UserModel } from "../models";
import { env } from "../config/env";
import { getDemoUserByEmail } from "../lib/demo-store";

export function createAuthRoutes() {
  const app = new Hono();

  app.post("/auth/register", async c => {
    try {
      const payload = registerSchema.parse(await c.req.json());
      const user = await registerUser({ ...payload, role: payload.role as UserRole });
      return c.json(
        success("User registered successfully", {
          userId: String(user._id),
          fullName: user.fullName,
          email: user.email,
          role: user.role,
        }),
        201,
      );
    } catch (error) {
      return c.json(failure(error instanceof Error ? error.message : "Registration failed"), 400);
    }
  });

  app.post("/auth/login", async c => {
    try {
      const payload = loginSchema.parse(await c.req.json());
      const result = await loginUser(payload);
      return c.json(
        success("Login successful", {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          user: {
            id: String(result.user._id),
            fullName: result.user.fullName,
            email: result.user.email,
            role: result.user.role,
            walletAddress: result.user.walletAddress ?? "",
            isWalletVerified: result.user.isWalletVerified ?? false,
          },
        }),
      );
    } catch (error) {
      return c.json(failure(error instanceof Error ? error.message : "Invalid email or password"), 401);
    }
  });

  app.post("/auth/logout", authMiddleware, async c => {
    try {
      const auth = c.get("auth");
      const body = await c.req.json().catch(() => ({}));
      await logoutUser(auth.userId, body.refreshToken);
      return c.json(success("Logged out successfully", { loggedOut: true }));
    } catch {
      return c.json(success("Logged out successfully", { loggedOut: true }));
    }
  });

  app.post("/auth/connect-wallet", authMiddleware, async c => {
    try {
      const payload = connectWalletSchema.parse(await c.req.json());
      const auth = c.get("auth");
      const user = await connectWallet(auth.userId, payload.walletAddress);
      return c.json(
        success("Wallet connected successfully", {
          walletAddress: user.walletAddress,
          isWalletVerified: user.isWalletVerified,
        }),
      );
    } catch (error) {
      return c.json(failure(error instanceof Error ? error.message : "Failed to connect wallet"), 400);
    }
  });

  app.get("/auth/me", authMiddleware, async c => {
    const auth = c.get("auth");

    if (env.DEMO_MODE) {
      const demoUser = getDemoUserByEmail(auth.email);
      return c.json(
        success("Authenticated user profile", {
          id: auth.userId,
          role: auth.role,
          fullName: demoUser?.fullName ?? "Demo User",
          email: auth.email,
          walletAddress: auth.walletAddress ?? "",
          walletProvider: "pera",
          isWalletVerified: Boolean(auth.walletAddress),
          status: "active",
          emailVerified: true,
        }),
      );
    }

    const user = await UserModel.findById(auth.userId).lean();
    if (!user) {
      return c.json(failure("User profile not found"), 401);
    }

    return c.json(
      success("Authenticated user profile", {
        id: String(user._id),
        role: user.role,
        fullName: user.fullName,
        email: user.email,
        walletAddress: user.walletAddress ?? "",
        walletProvider: user.walletProvider ?? "pera",
        isWalletVerified: user.isWalletVerified,
        status: user.status,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLogin: user.lastLogin,
      }),
    );
  });

  app.post("/auth/refresh", async c => {
    const body = await c.req.json().catch(() => ({}));
    const refreshToken = body.refreshToken;
    if (!refreshToken) {
      return c.json(failure("Refresh token required"), 400);
    }

    try {
      const result = await refreshAccessToken(refreshToken);
      return c.json(success("Access token refreshed", result), 200);
    } catch {
      return c.json(failure("Invalid or expired refresh token"), 401);
    }
  });

  return app;
}
