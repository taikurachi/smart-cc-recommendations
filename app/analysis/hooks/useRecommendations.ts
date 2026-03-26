"use client";
import { useState, useEffect, useCallback } from "react";

import { CardPreferences, Transaction } from "@/lib/types";
import {
  CreditCardWithValue,
  getMultiCardRecommendations,
} from "@/lib/recommendation";
import { showToast } from "@/lib/ui/toastUtils";
import { DEFAULT_CARD_PREFERENCES } from "@/lib/constants";

export function useRecommendations(
  transactions: Transaction[],
  ownedCards: CreditCardWithValue[],
  cardPreferences: CardPreferences | null,
  loading: boolean,
) {
  const [recommendations, setRecommendations] = useState<CreditCardWithValue[]>(
    [],
  );
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  const calculateRecommendations = useCallback(
    async (preferences: Record<string, boolean>) => {
      if (transactions.length === 0) return;

      setLoadingRecommendations(true);
      try {
        const ownedCardsTotalAnnualValue = ownedCards.reduce(
          (sum, card) => sum + (card.annualValue || 0),
          0,
        );

        const result = await getMultiCardRecommendations(
          transactions,
          preferences,
          ownedCards,
          ownedCardsTotalAnnualValue,
        );

        if (result.message) {
          showToast.info(result.message);
        }
        setRecommendations(result.cards as CreditCardWithValue[]);
      } catch (error) {
        console.error("Error calculating recommendations:", error);
      } finally {
        setLoadingRecommendations(false);
      }
    },
    [transactions, ownedCards],
  );

  useEffect(() => {
    if (
      transactions.length > 0 &&
      recommendations.length === 0 &&
      !loadingRecommendations &&
      !loading
    ) {
      const prefsToUse = cardPreferences || DEFAULT_CARD_PREFERENCES;
      calculateRecommendations({ ...prefsToUse });
    }
  }, [
    transactions.length,
    recommendations.length,
    loadingRecommendations,
    loading,
    cardPreferences,
    calculateRecommendations,
  ]);

  return { recommendations, loadingRecommendations, calculateRecommendations };
}
