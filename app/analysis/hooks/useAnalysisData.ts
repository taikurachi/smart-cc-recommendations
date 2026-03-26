"use client";
import { useState, useEffect, useCallback } from "react";

import { Connection, SpendingAnalysis, Transaction } from "@/lib/types";
import { calculateCardAnnualValue, CreditCardWithValue } from "@/lib/recommendation";
import {
  groupTransactionsByCreditCard,
  removeDuplicateTransactions,
} from "@/lib/data/transactionHelpers";
import { analyzeSpending } from "@/lib/data/spendingAnalyzer";
import { mapCardNameToOfficialCard } from "@/lib/data/cardMatcher";
import { TRANSACTION_MONTHS_ANALYSIS } from "@/lib/constants";

export interface AnalysisData {
  connections: Connection[];
  transactions: Transaction[];
  analysis: SpendingAnalysis | null;
  ownedCards: CreditCardWithValue[];
  loading: boolean;
  error: string;
}

export function useAnalysisData(): AnalysisData {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [analysis, setAnalysis] = useState<SpendingAnalysis | null>(null);
  const [ownedCards, setOwnedCards] = useState<CreditCardWithValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadUserDataAndAnalysis = useCallback(async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem("userId");

      if (!userId) {
        setError("No user found. Please connect your bank account first.");
        return;
      }

      const userResponse = await fetch(`/api/users?userId=${userId}`);
      if (!userResponse.ok) {
        throw new Error("Failed to load user data");
      }

      const userData = await userResponse.json();
      const userConnections: Connection[] = userData.connections || [];
      setConnections(userConnections);

      if (userConnections.length === 0) {
        setError(
          "No bank connections found. Please connect your bank account first.",
        );
        return;
      }

      const allTransactions: Transaction[] = [];
      const collectedOwnedCards: CreditCardWithValue[] = [];

      const connectionResults = await Promise.allSettled(
        userConnections.map(async (connection) => {
          const creditCardAccountFound = connection.accounts.find(
            (acc) => acc.type === "credit",
          );

          const validatedAccounts = creditCardAccountFound
            ? connection.accounts.filter((acc) => acc.type === "credit")
            : connection.accounts;

          const validatedAccountIds = validatedAccounts.map(
            (acc) => acc.account_id,
          );

          const currentlyOwnedCards = validatedAccounts.map((acc) => ({
            account_id: acc.account_id,
            name: acc.name,
          }));

          const transactionResponse = await fetch("/api/plaid/transactions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId,
              itemId: connection.item_id,
              account_ids: validatedAccountIds,
              months: TRANSACTION_MONTHS_ANALYSIS,
            }),
          });

          if (!transactionResponse.ok) return { transactions: [], cards: [] };

          const transactionData = await transactionResponse.json();
          const fetchedTransactions: Transaction[] =
            transactionData.transactions || [];

          const transactionsByCard = groupTransactionsByCreditCard(
            fetchedTransactions,
            currentlyOwnedCards,
          );

          const cards: CreditCardWithValue[] = [];
          for (const [cardName, cardTransactions] of Object.entries(
            transactionsByCard,
          )) {
            const officialCard = await mapCardNameToOfficialCard(
              cardName,
              connection.institution_name,
            );
            if (!officialCard) continue;
            const value = calculateCardAnnualValue(
              officialCard,
              cardTransactions,
            );
            cards.push({ ...officialCard, ...value });
          }

          return { transactions: fetchedTransactions, cards };
        }),
      );

      for (const result of connectionResults) {
        if (result.status === "fulfilled") {
          allTransactions.push(...result.value.transactions);
          collectedOwnedCards.push(...result.value.cards);
        } else {
          console.error("Error loading transactions:", result.reason);
        }
      }

      setOwnedCards(collectedOwnedCards);

      const deduplicatedTransactions =
        removeDuplicateTransactions(allTransactions);
      setTransactions(deduplicatedTransactions);

      if (deduplicatedTransactions.length > 0) {
        const analysisResult = analyzeSpending(deduplicatedTransactions);
        setAnalysis(analysisResult);
      } else {
        setError("No transactions found. Please sync your transactions first.");
      }
    } catch (err) {
      console.error("Error loading analysis:", err);
      setError("Failed to load spending analysis. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserDataAndAnalysis();
  }, [loadUserDataAndAnalysis]);

  return { connections, transactions, analysis, ownedCards, loading, error };
}
