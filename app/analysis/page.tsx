"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useApp } from "@/lib/AppContext";
import CardPreferencesModal from "../components/CardPreferencesModal";
import { CardPreferences } from "@/lib/types";
import {
  getRecommendedCards,
  analyzeSpendingCategories,
  CreditCardRecommendation,
} from "@/lib/recommendationEngine";
import { loadCreditCardData } from "@/lib/creditCardData";

interface User {
  id: string;
  email?: string;
  created_at: string;
}

interface Connection {
  id: string;
  item_id: string;
  institution_name?: string;
  accounts: Array<{
    account_id: string;
    name: string;
    type: string;
    subtype: string;
    mask?: string;
  }>;
  created_at: string;
  last_synced?: string;
}

interface Transaction {
  transaction_id: string;
  account_id: string;
  amount: number;
  date: string;
  name: string;
  category?: string[];
}

interface SpendingAnalysis {
  totalSpending: number;
  monthlyAverage: number;
  topCategory: {
    category: string;
    amount: number;
    percentage: number;
  };
  categoryBreakdown: Array<{
    category: string;
    amount: number;
    percentage: number;
    count: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    amount: number;
  }>;
  recentTransactions: Transaction[];
}

interface CreditCard {
  account_id: string;
  name: string;
  official_name: string;
  type: string;
  subtype: string;
  mask?: string;
  institution_name?: string;
  credit_limit?: number;
  current_balance?: number;
  available_credit?: number;
}

export default function AnalysisPage() {
  const { cardPreferences, setCardPreferences } = useApp();
  const [, setUser] = useState<User | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [analysis, setAnalysis] = useState<SpendingAnalysis | null>(null);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCardPreferencesOpen, setIsCardPreferencesOpen] = useState(false);
  const [recommendations, setRecommendations] = useState<
    CreditCardRecommendation[]
  >([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  useEffect(() => {
    if (transactions.length === 0) return;

    const fetchAccountsData = async () => {
      try {
        const userId = localStorage.getItem("userId");
        if (!userId) return;

        const response = await fetch(`/api/plaid/accounts?userId=${userId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch accounts");
        }

        const data = await response.json();
        setCreditCards(data.creditCards || []);

        console.log("All accounts:", data.accounts);
        console.log("Credit cards found:", data.creditCards);
      } catch (error) {
        console.error("Error fetching accounts:", error);
      }
    };

    fetchAccountsData();
  }, [transactions]);
  useEffect(() => {
    loadUserDataAndAnalysis();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-open preferences modal if no preferences exist and we have transactions
  useEffect(() => {
    if (!loading && transactions.length > 0 && !cardPreferences) {
      setIsCardPreferencesOpen(true);
    }
  }, [loading, transactions.length, cardPreferences]);

  // Calculate recommendations when transactions are loaded
  // Use preferences if available, otherwise use default (all false)
  useEffect(() => {
    if (
      transactions.length > 0 &&
      recommendations.length === 0 &&
      !loadingRecommendations &&
      !loading
    ) {
      console.log("Triggering recommendation calculation from useEffect");
      const prefsToUse = cardPreferences || {
        travel: false,
        cashback: false,
        no_annual_fee: false,
        low_interest: false,
        beginner_friendly: false,
      };
      calculateRecommendations(prefsToUse);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    transactions.length,
    recommendations.length,
    loadingRecommendations,
    loading,
    cardPreferences,
  ]);

  const loadUserDataAndAnalysis = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem("userId");

      if (!userId) {
        setError("No user found. Please connect your bank account first.");
        return;
      }

      // Load user and connections
      const userResponse = await fetch(`/api/users?userId=${userId}`);
      if (!userResponse.ok) {
        throw new Error("Failed to load user data");
      }

      const userData = await userResponse.json();
      setUser(userData.user);
      setConnections(userData.connections || []);

      if (userData.connections?.length === 0) {
        setError(
          "No bank connections found. Please connect your bank account first."
        );
        return;
      }

      // Load transactions for all connections
      const allTransactions: Transaction[] = [];

      for (const connection of userData.connections) {
        try {
          const transactionResponse = await fetch("/api/plaid/transactions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: userId,
              itemId: connection.item_id,
              months: 12, // Get last 12 months for better analysis
            }),
          });

          if (transactionResponse.ok) {
            const transactionData = await transactionResponse.json();
            allTransactions.push(...(transactionData.transactions || []));
          }
        } catch (error) {
          console.error(
            `Error loading transactions for ${connection.institution_name}:`,
            error
          );
        }
      }

      setTransactions(allTransactions);

      if (allTransactions.length > 0) {
        const analysisResult = analyzeSpending(allTransactions);
        setAnalysis(analysisResult);
      } else {
        setError("No transactions found. Please sync your transactions first.");
      }
    } catch (error) {
      console.error("Error loading analysis:", error);
      setError("Failed to load spending analysis. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const analyzeSpending = (transactions: Transaction[]): SpendingAnalysis => {
    // Filter out positive amounts (credits/refunds/payments) and focus on spending
    // Transactions are typically negative (spending) or positive (credits)
    const spendingTransactions = transactions.filter(
      (t) =>
        t.amount < 0 ||
        (t.amount > 0 &&
          !t.category?.some((cat) => cat.toLowerCase().includes("payment")))
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
      const category = transaction.category?.[0] || "Other";
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatMonth = (monthStr: string) => {
    return new Date(monthStr + "-01").toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
    });
  };

  if (loading) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Analyzing your spending patterns...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-600 mb-4">
            <svg
              className="w-12 h-12 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-red-800 mb-2">
            Analysis Not Available
          </h2>
          <p className="text-red-700 mb-4">{error}</p>
          <Link
            href="/connect"
            className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Connect Bank Account
          </Link>
        </div>
      </div>
    );
  }

  const calculateRecommendations = async (preferences: CardPreferences) => {
    if (transactions.length === 0) {
      console.log("No transactions available for recommendations");
      return;
    }

    setLoadingRecommendations(true);
    try {
      // Load credit card data (cached after first load)
      const allCards = await loadCreditCardData();
      console.log("Loaded credit cards:", allCards.length);

      // Analyze spending categories
      const spendingCategories = analyzeSpendingCategories(transactions);
      console.log("Spending categories:", spendingCategories);
      console.log("User preferences:", preferences);

      // Calculate recommendations
      const recs = getRecommendedCards(
        allCards,
        preferences,
        spendingCategories
      );

      console.log("Calculated recommendations:", recs.length, recs);
      setRecommendations(recs);
    } catch (error) {
      console.error("Error calculating recommendations:", error);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const handleSavePreferences = async (preferences: CardPreferences) => {
    setCardPreferences(preferences);
    setIsCardPreferencesOpen(false);

    // Calculate recommendations in the background
    await calculateRecommendations(preferences);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Card Preferences Modal */}
      <CardPreferencesModal
        isOpen={isCardPreferencesOpen}
        onClose={() => setIsCardPreferencesOpen(false)}
        onSave={handleSavePreferences}
        initialPreferences={cardPreferences || undefined}
      />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              📊 Spending Analysis
            </h1>
            <p className="text-gray-600">
              Insights from {transactions.length} transactions across{" "}
              {connections.length} account{connections.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setIsCardPreferencesOpen(true)}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
            >
              💳 Card Preferences
            </button>
            <Link
              href="/manage"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Manage Connections
            </Link>
          </div>
        </div>
      </div>

      {/* Credit Cards Section */}
      {creditCards.length > 0 && (
        <div className="bg-white border rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            💳 Your Credit Cards
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({creditCards.length} found)
            </span>
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {creditCards.map((card) => (
              <div
                key={card.account_id}
                className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {card.official_name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {card.institution_name}
                    </p>
                  </div>
                  {card.mask && (
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                      •••• {card.mask}
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  {card.credit_limit && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Credit Limit:</span>
                      <span className="font-semibold">
                        {formatCurrency(card.credit_limit)}
                      </span>
                    </div>
                  )}
                  {card.current_balance !== undefined && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Current Balance:</span>
                      <span className="font-semibold text-red-600">
                        {formatCurrency(card.current_balance)}
                      </span>
                    </div>
                  )}
                  {card.available_credit !== undefined && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Available Credit:</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(card.available_credit)}
                      </span>
                    </div>
                  )}
                  {card.credit_limit && card.current_balance !== undefined && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Utilization</span>
                        <span>
                          {(
                            (card.current_balance / card.credit_limit) *
                            100
                          ).toFixed(1)}
                          %
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            (card.current_balance / card.credit_limit) * 100 >
                            30
                              ? "bg-red-500"
                              : "bg-green-500"
                          }`}
                          style={{
                            width: `${Math.min(
                              (card.current_balance / card.credit_limit) * 100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {analysis && (
        <>
          {/* Key Metrics */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {/* Total Spending */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-blue-800">
                  Total Spending
                </h3>
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                    />
                  </svg>
                </div>
              </div>
              <p className="text-2xl font-bold text-blue-900">
                {formatCurrency(analysis.totalSpending)}
              </p>
              <p className="text-xs text-blue-700 mt-1">Last 12 months</p>
            </div>

            {/* Monthly Average */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-green-800">
                  Monthly Average
                </h3>
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
              </div>
              <p className="text-2xl font-bold text-green-900">
                {formatCurrency(analysis.monthlyAverage)}
              </p>
              <p className="text-xs text-green-700 mt-1">Per month</p>
            </div>

            {/* Top Category */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-purple-800">
                  Top Category
                </h3>
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                    />
                  </svg>
                </div>
              </div>
              <p className="text-lg font-bold text-purple-900">
                {analysis.topCategory.category}
              </p>
              <p className="text-sm text-purple-700">
                {formatCurrency(analysis.topCategory.amount)} (
                {analysis.topCategory.percentage.toFixed(1)}%)
              </p>
            </div>
          </div>

          {/* Charts and Details */}
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            {/* Category Breakdown */}
            <div className="bg-white border rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">
                💳 Spending by Category
              </h3>
              <div className="space-y-3">
                {analysis.categoryBreakdown.map((category, index) => (
                  <div
                    key={category.category}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center flex-1">
                      <div
                        className="w-3 h-3 rounded-full mr-3"
                        style={{
                          backgroundColor: `hsl(${
                            (index * 45) % 360
                          }, 65%, 55%)`,
                        }}
                      ></div>
                      <span className="text-sm font-medium text-gray-700">
                        {category.category}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          {formatCurrency(category.amount)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {category.count} transactions
                        </p>
                      </div>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${category.percentage}%`,
                            backgroundColor: `hsl(${
                              (index * 45) % 360
                            }, 65%, 55%)`,
                          }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500 w-10 text-right">
                        {category.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly Trends */}
            <div className="bg-white border rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">📈 Monthly Trends</h3>
              <div className="space-y-3">
                {analysis.monthlyTrends.map((month) => {
                  const maxAmount = Math.max(
                    ...analysis.monthlyTrends.map((m) => m.amount)
                  );
                  const percentage = (month.amount / maxAmount) * 100;

                  return (
                    <div
                      key={month.month}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm font-medium text-gray-700 w-16">
                        {formatMonth(month.month)}
                      </span>
                      <div className="flex-1 mx-4">
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 w-20 text-right">
                        {formatCurrency(month.amount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white border rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">
              🕐 Recent Transactions
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 font-medium text-gray-700">
                      Date
                    </th>
                    <th className="text-left py-2 px-3 font-medium text-gray-700">
                      Merchant
                    </th>
                    <th className="text-left py-2 px-3 font-medium text-gray-700">
                      Category
                    </th>
                    <th className="text-right py-2 px-3 font-medium text-gray-700">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.recentTransactions.map((transaction) => (
                    <tr
                      key={transaction.transaction_id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-2 px-3 text-gray-600">
                        {new Date(transaction.date).toLocaleDateString()}
                      </td>
                      <td className="py-2 px-3 font-medium text-gray-900">
                        {transaction.name}
                      </td>
                      <td className="py-2 px-3">
                        <span className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-600">
                          {transaction.category?.[0] || "Other"}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-semibold text-red-600">
                        {formatCurrency(transaction.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Connected Accounts Summary */}
          <div className="bg-gray-50 border rounded-xl p-6 mt-8">
            <h3 className="text-lg font-semibold mb-4">
              🏦 Connected Accounts
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {connections.map((connection) => (
                <div
                  key={connection.id}
                  className="bg-white border rounded-lg p-4"
                >
                  <h4 className="font-medium text-gray-900 mb-2">
                    {connection.institution_name}
                  </h4>
                  <p className="text-sm text-gray-600 mb-2">
                    {connection.accounts.length} account
                    {connection.accounts.length !== 1 ? "s" : ""}
                  </p>
                  <p className="text-xs text-gray-500">
                    Last synced:{" "}
                    {connection.last_synced
                      ? new Date(connection.last_synced).toLocaleDateString()
                      : "Never"}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Credit Card Recommendations */}
          {recommendations.length > 0 || loadingRecommendations ? (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 mt-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">
                    💳 Personalized Card Recommendations
                  </h3>
                  <p className="text-sm text-gray-600">
                    {cardPreferences
                      ? "Based on your preferences and spending patterns"
                      : "Based on your spending patterns"}
                  </p>
                </div>
                <button
                  onClick={() => setIsCardPreferencesOpen(true)}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                >
                  {cardPreferences ? "Edit Preferences" : "Set Preferences"}
                </button>
              </div>

              {loadingRecommendations ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">
                      Calculating your perfect matches...
                    </p>
                  </div>
                </div>
              ) : recommendations.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {recommendations.map((card, index) => (
                    <div
                      key={index}
                      className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-lg transition-shadow"
                    >
                      {/* Card Image */}
                      {card.image?.src && (
                        <div className="mb-4 flex justify-center">
                          <div className="relative w-full h-48 bg-gray-50 rounded-lg overflow-hidden">
                            <Image
                              src={card.image.src}
                              alt={card.image.alt || card.name}
                              fill
                              className="object-contain"
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-bold text-lg text-gray-900 mb-1">
                            {card.name}
                          </h4>
                          <p className="text-sm text-gray-600">{card.issuer}</p>
                        </div>
                        <div className="text-right">
                          <div className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded">
                            {card.matchScore.toFixed(0)}% Match
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Rating:</span>
                          <span className="font-semibold">
                            ⭐ {card.rating}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Annual Fee:</span>
                          <span className="font-semibold">
                            {card.annualFee === "0" || card.annualFee === "$0"
                              ? "No Fee"
                              : card.annualFee}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Rewards:</span>
                          <span className="font-semibold text-green-700">
                            {card.rewards}
                          </span>
                        </div>
                        {card.introOffer && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">
                              Welcome Bonus:
                            </span>
                            <span className="font-semibold text-blue-700">
                              {card.introOffer}
                            </span>
                          </div>
                        )}
                        {card.estimatedValue && (
                          <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-200">
                            <span className="text-gray-600">
                              Est. Annual Value:
                            </span>
                            <span className="font-bold text-green-700">
                              ${card.estimatedValue.toFixed(0)}
                            </span>
                          </div>
                        )}
                      </div>

                      {card.matchReasons.length > 0 && (
                        <div className="pt-3 border-t border-gray-200">
                          <p className="text-xs font-medium text-gray-700 mb-2">
                            Why this card:
                          </p>
                          <ul className="space-y-1">
                            {card.matchReasons
                              .slice(0, 3)
                              .map((reason, idx) => (
                                <li
                                  key={idx}
                                  className="text-xs text-gray-600 flex items-start"
                                >
                                  <span className="text-green-500 mr-2">✓</span>
                                  {reason}
                                </li>
                              ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">
                    No recommendations found. Try adjusting your preferences.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 mt-8 text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                💳 Get Personalized Recommendations
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Set your card preferences to see personalized recommendations
              </p>
              <button
                onClick={() => setIsCardPreferencesOpen(true)}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
              >
                Set Preferences
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
