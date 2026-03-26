"use client";
import { useState } from "react";
import Link from "next/link";

import { useApp } from "@/lib/ui/AppContext";
import CardPreferencesModal from "../components/CardPreferencesModal";
import { CardPreferences } from "@/lib/types";

import {
  AlertTriangle,
  ArrowLeft,
  Award,
  BarChart3,
  Columns3Cog,
  CopyPlus,
  DollarSign,
  ListFilterPlus,
  SquarePlus,
} from "lucide-react";
import CreditCardComponent from "./components/CreditCard";
import { formatCurrency } from "@/lib/data/transactionHelpers";
import Button from "../components/Button";
import { useAnalysisData } from "./hooks/useAnalysisData";
import { useRecommendations } from "./hooks/useRecommendations";

export default function AnalysisPage() {
  const { cardPreferences, setCardPreferences } = useApp();
  const { connections, transactions, analysis, ownedCards, loading, error } =
    useAnalysisData();
  const { recommendations, loadingRecommendations, calculateRecommendations } =
    useRecommendations(transactions, ownedCards, cardPreferences, loading);

  const [isCardPreferencesOpen, setIsCardPreferencesOpen] = useState(false);
  const [recommendationFilterModalOn, setRecommendationFilterModalOn] =
    useState(false);

  const shouldPromptPreferences =
    !loading && transactions.length > 0 && !cardPreferences;

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
            <AlertTriangle className="w-12 h-12 mx-auto mb-2" />
          </div>
          <h2 className="text-xl font-semibold text-red-800 mb-2">
            Analysis Not Available
          </h2>
          <p className="text-red-700 mb-4">{error}</p>
          <Link
            href="/connect"
            className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Connect Bank Account
          </Link>
        </div>
      </div>
    );
  }

  const handleSavePreferences = async (preferences: CardPreferences) => {
    setCardPreferences(preferences);
    setIsCardPreferencesOpen(false);
    await calculateRecommendations({ ...preferences });
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <CardPreferencesModal
        isOpen={isCardPreferencesOpen || shouldPromptPreferences}
        onClose={() => setIsCardPreferencesOpen(false)}
        onSave={handleSavePreferences}
        initialPreferences={cardPreferences || undefined}
      />

      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Spending Analysis
            </h1>
            <p className="text-gray-600">
              Insights from {transactions.length} transactions across{" "}
              {connections.length} account{connections.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {analysis && (
        <>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm text-blue-800">Total Spending</h3>
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold text-blue-900">
                {formatCurrency(analysis.totalSpending)}
              </p>
              <p className="text-xs text-blue-700 mt-1">Last 12 months</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm text-green-800">Monthly Average</h3>
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold text-green-900">
                {formatCurrency(analysis.monthlyAverage)}
              </p>
              <p className="text-xs text-green-700 mt-1">Per month</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm text-purple-800">Top Category</h3>
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <Award className="w-4 h-4 text-white" />
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

          {recommendations.length > 0 || loadingRecommendations ? (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-2">
                <div className="flex gap-4 items-center">
                  <h3 className="text-4xl font-bold text-gray-900 mb-1">
                    <span className="amount">{recommendations.length}</span>{" "}
                    Recommendations Found!
                  </h3>
                </div>
              </div>
              <div className="mb-4 flex gap-4 relative">
                <Button
                  color="gray-light"
                  onClick={() =>
                    setRecommendationFilterModalOn((prev) => !prev)
                  }
                >
                  <Columns3Cog className="rounded-lg" size={20} />
                  <span>Customize</span>
                </Button>
                <Button
                  color="gray-light"
                  onClick={() => setIsCardPreferencesOpen((prev) => !prev)}
                >
                  <ListFilterPlus className="rounded-lg" size={20} />
                  <span>Preferences</span>
                </Button>
                {recommendationFilterModalOn && (
                  <div className="absolute top-full flex flex-col gap-4 text-[14px] mt-1 left-0 bg-gray-light p-3 shadow-lg rounded-lg">
                    <button className="flex items-center gap-2 font-semibold cursor-pointer">
                      <SquarePlus size={20} />
                      <span>Single-card</span>
                    </button>
                    <button className="flex items-center gap-2 font-semibold cursor-pointer">
                      <CopyPlus size={20} />
                      <span>Multi-card</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                {ownedCards.length === 0 ? (
                  recommendations.map((rec) => (
                    <CreditCardComponent
                      key={rec.name}
                      cards={[rec]}
                      status="New"
                    />
                  ))
                ) : (
                  <CreditCardComponent cards={recommendations} status="New" />
                )}
                {ownedCards.length > 0 && (
                  <CreditCardComponent cards={ownedCards} status="Old" />
                )}
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 mt-8 text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Get Personalized Recommendations
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
