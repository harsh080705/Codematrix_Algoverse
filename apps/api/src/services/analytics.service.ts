import { AnalyticsModel, AgentModel, DeveloperModel, TransactionModel, UserModel } from "../models";
import { env } from "../config/env";
import { demoAgents, demoDeveloperId, demoReceipts, demoTransactions, demoUsers } from "../lib/demo-store";

export async function getPlatformAnalytics() {
  if (env.DEMO_MODE) {
    const totalUsers = demoUsers.length;
    const totalDevelopers = 1;
    const totalAgents = demoAgents.length;
    const totalTransactions = demoTransactions.length;
    const approvedAgents = demoAgents.filter(agent => agent.status === "approved").length;
    const disabledAgents = demoAgents.filter(agent => agent.status === "disabled").length;
    const revenue = demoTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    const topAgents = [...demoAgents].sort((a, b) => b.totalRuns - a.totalRuns).slice(0, 5);
    const topDevelopers = [
      {
        _id: demoDeveloperId,
        totalRevenue: revenue,
        totalUsage: demoTransactions.length,
        averageRating: 4.8,
        totalRatings: 12,
        approved: true,
        payoutAddress: "",
      },
    ];
    const recentTransactions = demoTransactions.slice(0, 10);
    const usageByDay: Array<{ date: string; runs: number; revenue: number }> = [];

    return {
      totalUsers,
      totalDevelopers,
      totalAgents,
      totalTransactions,
      approvalRate: totalAgents === 0 ? 0 : approvedAgents / totalAgents,
      disabledAgents,
      revenue,
      topAgents,
      topDevelopers,
      recentTransactions,
      usageByDay,
    };
  }

  const [totalUsers, totalDevelopers, totalAgents, totalTransactions, approvedAgents, disabledAgents] = await Promise.all([
    UserModel.countDocuments(),
    DeveloperModel.countDocuments(),
    AgentModel.countDocuments(),
    TransactionModel.countDocuments(),
    AgentModel.countDocuments({ status: "approved" }),
    AgentModel.countDocuments({ status: "disabled" }),
  ]);

  const revenueAgg = await TransactionModel.aggregate([
    { $match: { status: { $in: ["settled", "verified"] } } },
    { $group: { _id: null, revenue: { $sum: "$amount" } } },
  ]);

  const topAgents = await AgentModel.find().sort({ totalRuns: -1 }).limit(5).lean();
  const topDevelopers = await DeveloperModel.find().sort({ totalRevenue: -1 }).limit(5).lean();
  const recentTransactions = await TransactionModel.find().sort({ createdAt: -1 }).limit(10).lean();

  const usageByDay = await AnalyticsModel.find({ scope: "platform" }).sort({ date: 1 }).lean();

  return {
    totalUsers,
    totalDevelopers,
    totalAgents,
    totalTransactions,
    approvalRate: totalAgents === 0 ? 0 : approvedAgents / totalAgents,
    disabledAgents,
    revenue: revenueAgg[0]?.revenue ?? 0,
    topAgents,
    topDevelopers,
    recentTransactions,
    usageByDay,
  };
}
