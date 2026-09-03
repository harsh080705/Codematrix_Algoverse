import { DeveloperModel, UserModel } from "../models";
import { comparePassword, hashPassword } from "../lib/password";
import { signAccessToken, signRefreshToken, verifyRefreshToken, type JwtClaims } from "../lib/jwt";
import type { UserRole } from "@aihub/shared";
import { env } from "../config/env";
import { getDemoUserByEmail, updateDemoUserWallet, type DemoUserRecord } from "../lib/demo-store";

export async function registerUser(input: {
  fullName: string;
  email: string;
  password: string;
  role: UserRole | string;
}) {
  const normalizedRole = (String(input.role).toLowerCase() as UserRole) || "user";

  if (normalizedRole === "admin" && !env.ALLOW_ADMIN_REGISTRATION) {
    throw new Error("Public admin registration is restricted. Admin accounts must be created via system bootstrap or invitation.");
  }

  if (env.DEMO_MODE) {
    const existing = getDemoUserByEmail(input.email);
    if (existing) {
      throw new Error("Email already registered");
    }

    const demoUser: DemoUserRecord = {
      id: `demo-${normalizedRole}-${input.email}`,
      fullName: input.fullName,
      email: input.email,
      password: input.password,
      role: normalizedRole,
      walletAddress: "",
      walletProvider: "pera",
      isWalletVerified: false,
    };

    return {
      _id: demoUser.id,
      ...demoUser,
      passwordHash: "",
      refreshTokens: [],
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never;
  }

  const existing = await UserModel.findOne({ email: input.email.toLowerCase() });
  if (existing) {
    throw new Error("Email already registered");
  }

  const passwordHash = await hashPassword(input.password);
  const user = await UserModel.create({
    fullName: input.fullName,
    email: input.email.toLowerCase(),
    passwordHash,
    role: normalizedRole,
    status: "active",
    emailVerified: true,
  });

  if (normalizedRole === "developer") {
    await DeveloperModel.create({
      userId: user._id,
      payoutAddress: "",
      approved: false,
      totalRevenue: 0,
      totalUsage: 0,
      averageRating: 0,
      totalRatings: 0,
      categories: [],
    });
  }

  return user;
}

export async function loginUser(input: { email: string; password: string }) {
  if (env.DEMO_MODE) {
    const user = getDemoUserByEmail(input.email);
    if (!user || user.password !== input.password) {
      throw new Error("Invalid credentials");
    }

    const claims: JwtClaims = {
      sub: user.id,
      role: user.role,
      email: user.email,
      walletAddress: user.walletAddress,
    };

    const accessToken = signAccessToken(claims);
    const refreshToken = signRefreshToken(claims);

    return {
      user: {
        _id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        walletAddress: user.walletAddress,
        isWalletVerified: user.isWalletVerified,
      } as never,
      accessToken,
      refreshToken,
    };
  }

  const user = await UserModel.findOne({ email: input.email.toLowerCase() });
  if (!user) {
    throw new Error("Invalid credentials");
  }

  if (user.status === "suspended" || user.status === "deleted") {
    throw new Error("Account is suspended or deactivated. Contact support.");
  }

  const valid = await comparePassword(input.password, user.passwordHash);
  if (!valid) {
    throw new Error("Invalid credentials");
  }

  const claims: JwtClaims = {
    sub: String(user._id),
    role: user.role,
    email: user.email,
    walletAddress: user.walletAddress,
  };

  const accessToken = signAccessToken(claims);
  const refreshToken = signRefreshToken(claims);
  user.refreshTokens.push(refreshToken);
  user.lastLogin = new Date();
  await user.save();

  return { user, accessToken, refreshToken };
}

export async function logoutUser(userId: string, refreshToken?: string): Promise<void> {
  if (env.DEMO_MODE) {
    return;
  }

  if (userId) {
    const user = await UserModel.findById(userId);
    if (user) {
      if (refreshToken) {
        user.refreshTokens = user.refreshTokens.filter(token => token !== refreshToken);
      } else {
        user.refreshTokens = [];
      }
      await user.save();
    }
  }
}

export async function connectWallet(userId: string, walletAddress: string) {
  if (env.DEMO_MODE) {
    const user = updateDemoUserWallet(userId, walletAddress);
    if (!user) {
      throw new Error("User not found");
    }

    return {
      _id: user.id,
      fullName: user.fullName,
      email: user.email,
      walletAddress: user.walletAddress,
      isWalletVerified: user.isWalletVerified,
    } as never;
  }

  const user = await UserModel.findByIdAndUpdate(
    userId,
    { walletAddress, walletProvider: "pera", isWalletVerified: true },
    { new: true },
  );

  if (!user) {
    throw new Error("User not found");
  }

  return user;
}

export async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken?: string }> {
  const claims = verifyRefreshToken(refreshToken);

  if (env.DEMO_MODE) {
    const accessToken = signAccessToken({
      sub: claims.sub,
      role: claims.role,
      email: claims.email,
      walletAddress: claims.walletAddress,
    });
    return { accessToken };
  }

  const user = await UserModel.findById(claims.sub).lean();
  if (!user || user.status === "suspended" || user.status === "deleted") {
    throw new Error("User not found or suspended");
  }

  const accessToken = signAccessToken({
    sub: String(user._id),
    role: user.role,
    email: user.email,
    walletAddress: user.walletAddress,
  });

  return { accessToken, refreshToken };
}
