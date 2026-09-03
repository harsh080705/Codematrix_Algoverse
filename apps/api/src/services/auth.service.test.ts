import { describe, expect, it } from "vitest";

process.env.DEMO_MODE = "true";

const { registerUser } = await import("./auth.service");

describe("3-Role Authentication System", () => {
  it("allows registering USER role", async () => {
    const user = await registerUser({
      fullName: "Test User",
      email: "testuser@example.com",
      password: "Password123!",
      role: "user",
    });

    expect(user.email).toBe("testuser@example.com");
    expect(user.role).toBe("user");
  });

  it("allows registering DEVELOPER role", async () => {
    const dev = await registerUser({
      fullName: "Test Dev",
      email: "testdev@example.com",
      password: "Password123!",
      role: "developer",
    });

    expect(dev.email).toBe("testdev@example.com");
    expect(dev.role).toBe("developer");
  });

  it("blocks public ADMIN registration when ALLOW_ADMIN_REGISTRATION is false", async () => {
    await expect(
      registerUser({
        fullName: "Rogue Admin",
        email: "rogueadmin@example.com",
        password: "Password123!",
        role: "admin",
      }),
    ).rejects.toThrow("Public admin registration is restricted");
  });
});
