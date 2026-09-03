import { AgentModel, DeveloperModel, TransactionModel, UserModel } from "../models";
import { env } from "../config/env";
import { demoAgents, demoTransactions } from "../lib/demo-store";

export async function getDashboardStats() {
  if (env.DEMO_MODE) {
    const revenue = demoTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    const txCount = demoTransactions.length;
    const activeUsers = 2;
    const pendingApprovals = 0;
    const disabledAgents = demoAgents.filter(agent => agent.status === "disabled").length;
    const topCategories = Array.from(new Map(demoAgents.map(agent => [agent.category, 0]))).map(([category]) => ({
      category,
      count: demoAgents.filter(agent => agent.category === category).length,
    }));

    return { revenue, txCount, activeUsers, pendingApprovals, disabledAgents, topCategories };
  }

  const [revenueAgg, txCount, activeUsers, pendingApprovals, disabledAgents, topCategories] = await Promise.all([
    TransactionModel.aggregate([{ $match: { status: { $in: ["settled", "verified"] } } }, { $group: { _id: null, revenue: { $sum: "$amount" } } }]),
    TransactionModel.countDocuments(),
    UserModel.countDocuments({ status: "active" }),
    DeveloperModel.countDocuments({ approved: false }),
    AgentModel.countDocuments({ status: "disabled" }),
    AgentModel.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]),
  ]);

  return {
    revenue: revenueAgg[0]?.revenue ?? 0,
    txCount,
    activeUsers,
    pendingApprovals,
    disabledAgents,
    topCategories: topCategories.map(item => ({ category: item._id as string, count: item.count as number })),
  };
}
