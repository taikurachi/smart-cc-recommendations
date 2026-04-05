import { SpendingAnalysis, Transaction } from "../types";
import {
  isSpendingTransaction,
  getAnnualizationFactor,
} from "../recommendation/utils";

export const analyzeSpending = (
  transactions: Transaction[],
): SpendingAnalysis => {
  const spendingTransactions = transactions.filter(isSpendingTransaction);

  const totalSpending = spendingTransactions.reduce(
    (sum, t) => sum + Math.abs(t.amount),
    0,
  );

  const annualizationFactor = getAnnualizationFactor(spendingTransactions);
  const annualizedSpending = totalSpending * annualizationFactor;

  const dates = spendingTransactions.map((t) => new Date(t.date));
  const timestamps = dates.map((d) => d.getTime()).filter((t) => !isNaN(t));
  const earliestDate = new Date(Math.min(...timestamps));
  const latestDate = new Date(Math.max(...timestamps));
  const dataSpanMonths = Math.max(
    1,
    (latestDate.getFullYear() - earliestDate.getFullYear()) * 12 +
      (latestDate.getMonth() - earliestDate.getMonth()) +
      1,
  );
  const monthlyAverage = totalSpending / dataSpanMonths;

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

  const monthlyTotals: { [key: string]: number } = {};
  spendingTransactions.forEach((transaction) => {
    const monthKey = new Date(transaction.date).toISOString().slice(0, 7);
    monthlyTotals[monthKey] =
      (monthlyTotals[monthKey] || 0) + Math.abs(transaction.amount);
  });

  const monthlyTrends = Object.entries(monthlyTotals)
    .map(([month, amount]) => ({ month, amount }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-6);

  const recentTransactions = spendingTransactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  return {
    totalSpending,
    annualizedSpending,
    dataSpanMonths,
    monthlyAverage,
    topCategory,
    categoryBreakdown: categoryBreakdown.slice(0, 8),
    monthlyTrends,
    recentTransactions,
  };
};
