"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useApp } from "@/lib/AppContext";
import CardPreferencesModal from "../components/CardPreferencesModal";
import {
  CardPreferences,
  CreditCardOwned,
  CreditCardRecommendation,
} from "@/lib/types";
import {
  getRecommendedCards,
  analyzeSpendingCategories,
} from "@/lib/recommendationEngine";
import { loadCreditCardData } from "@/lib/creditCardData";
import { ListFilterPlus } from "lucide-react";
import CreditCardComponent from "./components/CreditCard";

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

export default function AnalysisPage() {
  const { cardPreferences, setCardPreferences } = useApp();
  const [, setUser] = useState<User | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [analysis, setAnalysis] = useState<SpendingAnalysis | null>(null);
  const [creditCards, setCreditCards] = useState<CreditCardOwned[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [recIndex, setRecIndex] = useState(0);
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
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
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

      {analysis && (
        <>
          {/* Key Metrics */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {/* Total Spending */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm text-blue-800">Total Spending</h3>
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
                <h3 className="text-sm text-green-800">Monthly Average</h3>
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
                <h3 className="text-sm text-purple-800">Top Category</h3>
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

          {/* Credit Card Recommendations */}
          {recommendations.length > 0 || loadingRecommendations ? (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex gap-4 items-center">
                  <h3 className="text-4xl font-bold text-gray-900 mb-1">
                    Showing{" "}
                    <span
                      className="px-4 py-1.5 rounded-lg text-center bg-green-200 cursor-pointer"
                      onClick={() =>
                        setRecIndex(
                          (prev) => (prev + 1) % recommendations.length
                        )
                      }
                    >
                      {recIndex + 1}
                    </span>{" "}
                    of {recommendations.length} Recommendations
                  </h3>
                  <ListFilterPlus
                    onClick={() => setIsCardPreferencesOpen(true)}
                    className="bg-gray-300 rounded-lg p-2"
                    size={36}
                  />
                </div>
              </div>

              <div className="flex gap-4">
                {creditCards.length === 0 ? (
                  recommendations.map((rec) => (
                    <CreditCardComponent
                      key={rec.name}
                      cards={[rec]}
                      status="New"
                    />
                  ))
                ) : (
                  <CreditCardComponent
                    cards={[recommendations[recIndex]]}
                    status="New"
                  />
                )}
                {creditCards.length > 0 && (
                  <CreditCardComponent cards={creditCards} status="Old" />
                )}
              </div>
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
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
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
