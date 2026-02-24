import { SpendingAnalysis, Transaction } from "./types";

export const analyzeSpending = (
  transactions: Transaction[]
): SpendingAnalysis => {
  // Filter out positive amounts (credits/refunds/payments) and focus on spending
  // Transactions are typically negative (spending) or positive (credits)
  const paymentPrimaries = new Set([
    "LOAN_PAYMENTS",
    "TRANSFER_IN",
    "TRANSFER_OUT",
    "INCOME",
  ]);
  const spendingTransactions = transactions.filter(
    (t) =>
      t.amount < 0 ||
      (t.amount > 0 &&
        !paymentPrimaries.has(t.personal_finance_category?.primary ?? ""))
  );

  // Calculate total spending (use absolute values)
  const totalSpending = spendingTransactions.reduce(
    (sum, t) => sum + Math.abs(t.amount),
    0
  );

  // Calculate date range for monthly average
  const dates = spendingTransactions.map((t) => new Date(t.date));
  const earliestDate = new Date(Math.min(...dates.map((d) => d.getTime())));
  const latestDate = new Date(Math.max(...dates.map((d) => d.getTime())));
  const monthsDiff = Math.max(
    1,
    (latestDate.getFullYear() - earliestDate.getFullYear()) * 12 +
      (latestDate.getMonth() - earliestDate.getMonth()) +
      1
  );
  const monthlyAverage = totalSpending / monthsDiff;

  // Category analysis
  const categoryTotals: { [key: string]: { amount: number; count: number } } =
    {};

  spendingTransactions.forEach((transaction) => {
    const category =
      transaction.personal_finance_category?.primary || "Other";
    if (!categoryTotals[category]) {
      categoryTotals[category] = { amount: 0, count: 0 };
    }
    categoryTotals[category].amount += Math.abs(transaction.amount);
    categoryTotals[category].count += 1;
  });

  // Sort categories by spending amount
  const categoryBreakdown = Object.entries(categoryTotals)
    .map(([category, data]) => ({
      category,
      amount: data.amount,
      percentage: (data.amount / totalSpending) * 100,
      count: data.count,
    }))
    .sort((a, b) => b.amount - a.amount);

  const topCategory = categoryBreakdown[0] || {
    category: "No Data",
    amount: 0,
    percentage: 0,
  };

  // Monthly trends
  const monthlyTotals: { [key: string]: number } = {};
  spendingTransactions.forEach((transaction) => {
    const monthKey = new Date(transaction.date).toISOString().slice(0, 7); // YYYY-MM
    monthlyTotals[monthKey] =
      (monthlyTotals[monthKey] || 0) + Math.abs(transaction.amount);
  });

  const monthlyTrends = Object.entries(monthlyTotals)
    .map(([month, amount]) => ({ month, amount }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-6); // Last 6 months

  // Recent transactions (last 10)
  const recentTransactions = spendingTransactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  return {
    totalSpending,
    monthlyAverage,
    topCategory,
    categoryBreakdown: categoryBreakdown.slice(0, 8), // Top 8 categories
    monthlyTrends,
    recentTransactions,
  };
};
