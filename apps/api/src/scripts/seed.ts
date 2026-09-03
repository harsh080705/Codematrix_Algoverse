import { connectDatabase } from "../config/database";
import { env } from "../config/env";
import { hashPassword } from "../lib/password";
import { DeveloperModel, UserModel } from "../models";
import { seedCategories, seedSampleAgents } from "../services";

async function seed() {
  await connectDatabase();
  await seedCategories();

  const adminEmail = "admin@aihub.market";
  const developerEmail = "developer@aihub.market";
  const developerWalletAddress = env.X402_PAY_TO;

  const admin = await UserModel.findOneAndUpdate(
    { email: adminEmail },
    {
      $set: {
        fullName: "AIHub Admin",
        email: adminEmail,
        passwordHash: await hashPassword("ChangeMe123!"),
        role: "admin",
        isWalletVerified: true,
        status: "active",
      },
      $unset: {
        walletAddress: 1,
        walletProvider: 1,
      },
    },
    { upsert: true, new: true },
  );

  const developerUser = await UserModel.findOneAndUpdate(
    { email: developerEmail },
    {
      $set: {
        fullName: "Demo Developer",
        email: developerEmail,
        passwordHash: await hashPassword("ChangeMe123!"),
        role: "developer",
        isWalletVerified: true,
        walletAddress: developerWalletAddress,
        walletProvider: "pera",
        status: "active",
      },
    },
    { upsert: true, new: true },
  );

  const developer = await DeveloperModel.findOneAndUpdate(
    { userId: developerUser._id },
    {
      userId: developerUser._id,
      companyName: "Nova Labs",
      bio: "Demo publisher for AIHub sample agents.",
      payoutAddress: env.X402_PAY_TO,
      approved: true,
      approvedAt: new Date(),
      totalRevenue: 0,
      totalUsage: 0,
      averageRating: 4.8,
      totalRatings: 12,
      categories: ["career", "research", "design"],
    },
    { upsert: true, new: true },
  );

  await seedSampleAgents(String(developer._id));

  console.log("Seed complete");
}

void seed().catch(error => {
  console.error(error);
  process.exit(1);
});
