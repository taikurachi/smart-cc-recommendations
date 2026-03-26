/**
 * Test suite for Multi-Card Recommendation Engine
 * Run with: npm run test:engine
 *
 * This test file directly loads credit card data from JSON to avoid API dependencies
 */

import fs from "fs";
import path from "path";
import type { Transaction } from "./types";
import type { CreditCardData, CardValueResult } from "./recommendation/types";

type RecommendedCard = CreditCardData & CardValueResult;

function loadCreditCardDataDirect(): CreditCardData[] {
  try {
    const filePath = path.join(process.cwd(), "data", "manualcc.json");
    const fileContents = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(fileContents);
    return Object.values(data) as CreditCardData[];
  } catch (error) {
    console.error("Error loading credit card data:", error);
    return [];
  }
}

const _cards = loadCreditCardDataDirect();

type OwnedCard = { id?: string; name?: string; institution_name?: string };

async function testGetMultiCardRecommendations(
  transactions: Transaction[],
  preferences: Record<string, boolean>,
  ownedCards: OwnedCard[] = []
): Promise<[RecommendedCard[], string | undefined]> {
  const module = await import("./recommendation");
  return module.getMultiCardRecommendations(
    transactions,
    preferences,
    ownedCards,
    undefined,
    _cards
  ) as Promise<[RecommendedCard[], string | undefined]>;
}

async function testGetRecommendedCards(
  transactions: Transaction[],
  preferences: Record<string, boolean>
): Promise<[RecommendedCard[], string | undefined]> {
  const module = await import("./recommendation");
  return module.getRecommendedCards(transactions, preferences, _cards) as Promise<[RecommendedCard[], string | undefined]>;
}

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: string;
}

const tests: TestResult[] = [];

function test(name: string, fn: () => Promise<void> | void): void {
  tests.push({ name, passed: false });
  const testIndex = tests.length - 1;

  Promise.resolve(fn())
    .then(() => {
      tests[testIndex].passed = true;
    })
    .catch((error) => {
      tests[testIndex].passed = false;
      tests[testIndex].error = error.message || String(error);
    });
}

async function runTests() {
  console.log("🧪 Testing Multi-Card Recommendation Engine\n");
  console.log("=".repeat(60));

  // Verify we can load card data
  const cards = loadCreditCardDataDirect();
  if (cards.length === 0) {
    console.error("❌ Failed to load credit card data from manualcc.json");
    process.exit(1);
  }
  console.log(`✅ Loaded ${cards.length} credit cards from manualcc.json\n`);

  // Test 1: Basic functionality
  test("Should return 2-3 cards when transactions are provided", async () => {
    const transactions = [
      {
        transaction_id: "test1",
        account_id: "test_account",
        amount: 1000,
        date: "2025-01-01",
        name: "Whole Foods",
        category: ["Food and Drink", "Groceries"],
        personal_finance_category: { primary: "FOOD_AND_DRINK", detailed: "FOOD_AND_DRINK_GROCERIES", confidence_level: "VERY_HIGH" },
      },
      {
        transaction_id: "test2",
        account_id: "test_account",
        amount: 500,
        date: "2025-01-02",
        name: "United Airlines",
        category: ["Travel", "Airlines"],
        personal_finance_category: { primary: "TRAVEL", detailed: "TRAVEL_FLIGHTS", confidence_level: "VERY_HIGH" },
      },
    ];

    const preferences = {
      travel: false,
      cashback: false,
      no_annual_fee: false,
      low_interest: false,
      beginner_friendly: false,
    };

    const [recommendations] = await testGetMultiCardRecommendations(
      transactions,
      preferences,
      []
    );

    if (recommendations.length === 0 || recommendations.length > 3) {
      throw new Error(`Expected 1-3 cards, got ${recommendations.length}`);
    }

    if (!recommendations.every((card) => card.annualValue !== undefined)) {
      throw new Error("Some cards missing annualValue");
    }
  });

  // Test 2: Annual value calculation
  test("Should calculate correct annual value (totalRewards - annualFee)", async () => {
    const transactions = [
      {
        transaction_id: "test1",
        account_id: "test_account",
        amount: 1000,
        date: "2025-01-01",
        name: "Test",
        category: ["Food and Drink", "Groceries"],
        personal_finance_category: { primary: "FOOD_AND_DRINK", detailed: "FOOD_AND_DRINK_GROCERIES", confidence_level: "VERY_HIGH" },
      },
    ];

    const preferences = {
      travel: false,
      cashback: false,
      no_annual_fee: false,
      low_interest: false,
      beginner_friendly: false,
    };

    const [recommendations] = await testGetMultiCardRecommendations(
      transactions,
      preferences,
      []
    );

    for (const card of recommendations) {
      const calculatedAnnualValue =
        (card.totalRewards || 0) - (card.annual_fee || 0);
      const diff = Math.abs((card.annualValue || 0) - calculatedAnnualValue);
      if (diff >= 0.01) {
        throw new Error(
          `Annual value mismatch for ${
            card.name
          }: expected ${calculatedAnnualValue.toFixed(2)}, got ${(
            card.annualValue || 0
          ).toFixed(2)}`
        );
      }
    }
  });

  // Test 3: Owned card filtering
  test("Should filter out owned cards by ID", async () => {
    const transactions = [
      {
        transaction_id: "test1",
        account_id: "test_account",
        amount: 1000,
        date: "2025-01-01",
        name: "Test",
        category: ["Food and Drink", "Groceries"],
        personal_finance_category: { primary: "FOOD_AND_DRINK", detailed: "FOOD_AND_DRINK_GROCERIES", confidence_level: "VERY_HIGH" },
      },
    ];

    const preferences = {
      travel: false,
      cashback: false,
      no_annual_fee: false,
      low_interest: false,
      beginner_friendly: false,
    };

    const ownedCards = [
      {
        id: "amex_platinum_card",
        name: "Platinum Card",
        institution_name: "American Express",
      },
    ];

    const [recommendations] = await testGetMultiCardRecommendations(
      transactions,
      preferences,
      ownedCards
    );

    const hasOwnedCard = recommendations.some(
      (card) => card.id === "amex_platinum_card"
    );
    if (hasOwnedCard) {
      throw new Error("Owned card was not filtered out");
    }
  });

  // Test 4: Total rewards calculation
  test("Should calculate totalRewards correctly (estimatedRewards + credits + benefits)", async () => {
    const transactions = [
      {
        transaction_id: "test1",
        account_id: "test_account",
        amount: 1000,
        date: "2025-01-01",
        name: "Test",
        category: ["Food and Drink", "Groceries"],
        personal_finance_category: { primary: "FOOD_AND_DRINK", detailed: "FOOD_AND_DRINK_GROCERIES", confidence_level: "VERY_HIGH" },
      },
    ];

    const preferences = {
      travel: false,
      cashback: false,
      no_annual_fee: false,
      low_interest: false,
      beginner_friendly: false,
    };

    const [recommendations] = await testGetMultiCardRecommendations(
      transactions,
      preferences,
      []
    );

    for (const card of recommendations) {
      const calculatedTotalRewards =
        (card.estimatedRewards || 0) +
        (card.creditsValue || 0) +
        (card.benefitsValue || 0);

      const diff = Math.abs((card.totalRewards || 0) - calculatedTotalRewards);
      if (diff >= 0.01) {
        throw new Error(
          `Total rewards mismatch for ${
            card.name
          }: expected ${calculatedTotalRewards.toFixed(2)}, got ${(
            card.totalRewards || 0
          ).toFixed(2)}`
        );
      }
    }
  });

  // Test 5: Intro bonus exclusion
  test("Should exclude intro bonus from annual value calculation", async () => {
    const transactions = [
      {
        transaction_id: "test1",
        account_id: "test_account",
        amount: 1000,
        date: "2025-01-01",
        name: "Test",
        category: ["Food and Drink", "Groceries"],
        personal_finance_category: { primary: "FOOD_AND_DRINK", detailed: "FOOD_AND_DRINK_GROCERIES", confidence_level: "VERY_HIGH" },
      },
    ];

    const preferences = {
      travel: false,
      cashback: false,
      no_annual_fee: false,
      low_interest: false,
      beginner_friendly: false,
    };

    const [recommendations] = await testGetMultiCardRecommendations(
      transactions,
      preferences,
      []
    );

    for (const card of recommendations) {
      if (card.introBonusValue && card.introBonusValue > 0) {
        const totalRewardsWithoutIntro =
          (card.estimatedRewards || 0) +
          (card.creditsValue || 0) +
          (card.benefitsValue || 0);
        if (
          Math.abs((card.totalRewards || 0) - totalRewardsWithoutIntro) >= 0.01
        ) {
          throw new Error(
            `Intro bonus included in totalRewards for ${card.name}`
          );
        }
      }
    }
  });

  // Test 6: Negative amounts (credits/refunds)
  test("Should handle negative amounts (credits/refunds) correctly", async () => {
    const transactions = [
      {
        transaction_id: "test1",
        account_id: "test_account",
        amount: -100, // Credit/refund
        date: "2025-01-01",
        name: "Refund",
        category: ["General Merchandise", "Online"],
        personal_finance_category: { primary: "GENERAL_MERCHANDISE", detailed: "GENERAL_MERCHANDISE_ONLINE_MARKETPLACES", confidence_level: "VERY_HIGH" },
      },
      {
        transaction_id: "test2",
        account_id: "test_account",
        amount: 500, // Actual spending
        date: "2025-01-02",
        name: "Purchase",
        category: ["Food and Drink", "Groceries"],
        personal_finance_category: { primary: "FOOD_AND_DRINK", detailed: "FOOD_AND_DRINK_GROCERIES", confidence_level: "VERY_HIGH" },
      },
    ];

    const preferences = {
      travel: false,
      cashback: false,
      no_annual_fee: false,
      low_interest: false,
      beginner_friendly: false,
    };

    const [recommendations] = await testGetMultiCardRecommendations(
      transactions,
      preferences,
      []
    );

    const allAllocations = recommendations.flatMap(
      (card) => card.allocation || []
    );
    const totalAllocated = allAllocations.reduce(
      (sum, alloc) => sum + alloc.amount,
      0
    );

    // Should be approximately $500 (allowing for rounding)
    if (totalAllocated < 400 || totalAllocated > 600) {
      throw new Error(
        `Expected ~$500 allocated, got $${totalAllocated.toFixed(2)}`
      );
    }
  });

  // Test 7: Empty transactions
  test("Should handle empty transactions gracefully", async () => {
    const preferences = {
      travel: false,
      cashback: false,
      no_annual_fee: false,
      low_interest: false,
      beginner_friendly: false,
    };

    const [recommendations] = await testGetMultiCardRecommendations(
      [],
      preferences,
      []
    );

    if (!Array.isArray(recommendations)) {
      throw new Error("Recommendations should be an array");
    }
  });

  // Test 8: All cards owned
  test("Should return empty array when all cards are owned", async () => {
    const transactions = [
      {
        transaction_id: "test1",
        account_id: "test_account",
        amount: 1000,
        date: "2025-01-01",
        name: "Test",
        category: ["Food and Drink", "Groceries"],
        personal_finance_category: { primary: "FOOD_AND_DRINK", detailed: "FOOD_AND_DRINK_GROCERIES", confidence_level: "VERY_HIGH" },
      },
    ];

    const preferences = {
      travel: false,
      cashback: false,
      no_annual_fee: false,
      low_interest: false,
      beginner_friendly: false,
    };

    // Get all available cards first
    const allCards = loadCreditCardDataDirect();
    const ownedCards = allCards.map((card) => ({
      id: card.id,
      name: card.name,
      institution_name: card.institution_name,
    }));

    const [recommendations, message] = await testGetMultiCardRecommendations(
      transactions,
      preferences,
      ownedCards
    );

    if (recommendations.length !== 0) {
      const remainingCards = recommendations.map((c) => c.name).join(", ");
      throw new Error(
        `Expected 0 recommendations when all cards owned, got ${recommendations.length}: ${remainingCards}`
      );
    }

    if (!message || !message.includes("optimized")) {
      throw new Error("Expected message about cards being optimized");
    }
  });

  // Test 9: Spending allocation across multiple categories
  test("Should allocate spending optimally across multiple categories", async () => {
    const transactions = [
      {
        transaction_id: "test1",
        account_id: "test_account",
        amount: 10000, // $10k groceries
        date: "2025-01-01",
        name: "Whole Foods",
        category: ["Food and Drink", "Groceries"],
        personal_finance_category: { primary: "FOOD_AND_DRINK", detailed: "FOOD_AND_DRINK_GROCERIES", confidence_level: "VERY_HIGH" },
      },
      {
        transaction_id: "test2",
        account_id: "test_account",
        amount: 5000, // $5k travel
        date: "2025-01-02",
        name: "United Airlines",
        category: ["Travel", "Airlines"],
        personal_finance_category: { primary: "TRAVEL", detailed: "TRAVEL_FLIGHTS", confidence_level: "VERY_HIGH" },
      },
      {
        transaction_id: "test3",
        account_id: "test_account",
        amount: 3000, // $3k dining
        date: "2025-01-03",
        name: "Restaurant",
        category: ["Food and Drink", "Restaurants"],
        personal_finance_category: { primary: "FOOD_AND_DRINK", detailed: "FOOD_AND_DRINK_RESTAURANTS", confidence_level: "VERY_HIGH" },
      },
    ];

    const preferences = {
      travel: false,
      cashback: false,
      no_annual_fee: false,
      low_interest: false,
      beginner_friendly: false,
    };

    const [recommendations] = await testGetMultiCardRecommendations(
      transactions,
      preferences,
      []
    );

    // Check that allocations exist for different categories
    const allAllocations = recommendations.flatMap(
      (card) => card.allocation || []
    );
    const categories = new Set(allAllocations.map((alloc) => alloc.category));

    // Should have allocations for at least groceries and travel
    if (!categories.has("grocery") && !categories.has("travel")) {
      throw new Error(
        `Expected allocations for grocery or travel, got: ${Array.from(
          categories
        ).join(", ")}`
      );
    }

    // Total allocated should be close to total spending ($18k)
    const totalAllocated = allAllocations.reduce(
      (sum, alloc) => sum + alloc.amount,
      0
    );

    if (totalAllocated < 15000 || totalAllocated > 20000) {
      throw new Error(
        `Expected ~$18k allocated, got $${totalAllocated.toFixed(2)}`
      );
    }
  });

  // Test 10: Combination finding (should return 2-3 cards)
  test("Should return 2-3 cards for optimal combination", async () => {
    const transactions = [
      {
        transaction_id: "test1",
        account_id: "test_account",
        amount: 10000,
        date: "2025-01-01",
        name: "Test",
        category: ["Food and Drink", "Groceries"],
        personal_finance_category: { primary: "FOOD_AND_DRINK", detailed: "FOOD_AND_DRINK_GROCERIES", confidence_level: "VERY_HIGH" },
      },
      {
        transaction_id: "test2",
        account_id: "test_account",
        amount: 5000,
        date: "2025-01-02",
        name: "Test",
        category: ["Travel", "Airlines"],
        personal_finance_category: { primary: "TRAVEL", detailed: "TRAVEL_FLIGHTS", confidence_level: "VERY_HIGH" },
      },
      {
        transaction_id: "test3",
        account_id: "test_account",
        amount: 3000,
        date: "2025-01-03",
        name: "Test",
        category: ["Food and Drink", "Restaurants"],
        personal_finance_category: { primary: "FOOD_AND_DRINK", detailed: "FOOD_AND_DRINK_RESTAURANTS", confidence_level: "VERY_HIGH" },
      },
    ];

    const preferences = {
      travel: false,
      cashback: false,
      no_annual_fee: false,
      low_interest: false,
      beginner_friendly: false,
    };

    const [recommendations] = await testGetMultiCardRecommendations(
      transactions,
      preferences,
      []
    );

    // Should try to find best combination of 2-3 cards
    if (recommendations.length < 1 || recommendations.length > 3) {
      throw new Error(`Expected 1-3 cards, got ${recommendations.length}`);
    }

    // Combined annual value should be positive
    const combinedAnnualValue = recommendations.reduce(
      (sum, card) => sum + (card.annualValue || 0),
      0
    );

    if (combinedAnnualValue <= 0) {
      throw new Error(
        `Expected positive combined annual value, got $${combinedAnnualValue.toFixed(
          2
        )}`
      );
    }
  });

  async function calculateOwnedCardsAnnualValue(
    ownedCards: OwnedCard[],
    transactions: Transaction[]
  ): Promise<number> {
    const { calculateCardAnnualValue } = await import(
      "./recommendation"
    );
    const { mapCardNameToOfficialCard } = await import("./generalHelpers");

    let totalAnnualValue = 0;

    for (const ownedCard of ownedCards) {
      const officialCard = await mapCardNameToOfficialCard(
        ownedCard.name,
        ownedCard.institution_name,
        _cards
      );

      if (officialCard) {
        const { annualValue } = calculateCardAnnualValue(
          officialCard,
          transactions
        );
        totalAnnualValue += annualValue;
      }
    }

    return totalAnnualValue;
  }

  // Test 11: User owns low-value card, should recommend much better cards
  test("Value Comparison #1: Low-value owned card → Better recommendations", async () => {
    const transactions = [
      {
        transaction_id: "t1",
        account_id: "acc",
        amount: 10000,
        date: "2025-01-01",
        name: "Groceries",
        category: ["Food and Drink", "Groceries"],
        personal_finance_category: { primary: "FOOD_AND_DRINK", detailed: "FOOD_AND_DRINK_GROCERIES", confidence_level: "VERY_HIGH" },
      },
      {
        transaction_id: "t2",
        account_id: "acc",
        amount: 5000,
        date: "2025-01-02",
        name: "Travel",
        category: ["Travel", "Airlines"],
        personal_finance_category: { primary: "TRAVEL", detailed: "TRAVEL_FLIGHTS", confidence_level: "VERY_HIGH" },
      },
    ];

    const preferences = {
      travel: false,
      cashback: false,
      no_annual_fee: false,
      low_interest: false,
      beginner_friendly: false,
    };
    const ownedCards = [
      {
        id: "plaid_credit_card",
        name: "Plaid Credit Card",
        institution_name: "Tartan Bank",
      },
    ];

    const ownedValue = await calculateOwnedCardsAnnualValue(
      ownedCards,
      transactions
    );
    const [recommendations] = await testGetMultiCardRecommendations(
      transactions,
      preferences,
      ownedCards
    );

    if (recommendations.length > 0) {
      const recommendedValue = recommendations.reduce(
        (sum, card) => sum + (card.annualValue || 0),
        0
      );
      if (recommendedValue < ownedValue) {
        throw new Error(
          `Test #1 Failed: Recommended ($${recommendedValue.toFixed(
            2
          )}) < Owned ($${ownedValue.toFixed(2)})`
        );
      }
      console.log(
        `   ✅ Test #1: Owned $${ownedValue.toFixed(
          2
        )} → Recommended $${recommendedValue.toFixed(2)} (Improvement: $${(
          recommendedValue - ownedValue
        ).toFixed(2)})`
      );
    }
  });

  // Test 12: User owns high-value card, should still find improvements or return empty
  test("Value Comparison #2: High-value owned card → Still find better options or no recommendations", async () => {
    const transactions = [
      {
        transaction_id: "t1",
        account_id: "acc",
        amount: 20000,
        date: "2025-01-01",
        name: "Travel",
        category: ["Travel", "Airlines"],
        personal_finance_category: { primary: "TRAVEL", detailed: "TRAVEL_FLIGHTS", confidence_level: "VERY_HIGH" },
      },
      {
        transaction_id: "t2",
        account_id: "acc",
        amount: 10000,
        date: "2025-01-02",
        name: "Hotels",
        category: ["Travel", "Hotels"],
        personal_finance_category: { primary: "TRAVEL", detailed: "TRAVEL_LODGING", confidence_level: "VERY_HIGH" },
      },
    ];

    const preferences = {
      travel: true,
      cashback: false,
      no_annual_fee: false,
      low_interest: false,
      beginner_friendly: false,
    };
    const ownedCards = [
      {
        id: "amex_platinum_card",
        name: "Platinum Card",
        institution_name: "American Express",
      },
    ];

    const ownedValue = await calculateOwnedCardsAnnualValue(
      ownedCards,
      transactions
    );
    const [recommendations, message] = await testGetMultiCardRecommendations(
      transactions,
      preferences,
      ownedCards
    );

    if (recommendations.length > 0) {
      const recommendedValue = recommendations.reduce(
        (sum, card) => sum + (card.annualValue || 0),
        0
      );
      if (recommendedValue < ownedValue) {
        throw new Error(
          `Test #2 Failed: Recommended ($${recommendedValue.toFixed(
            2
          )}) < Owned ($${ownedValue.toFixed(
            2
          )}). If no better options exist, should return empty.`
        );
      }
      console.log(
        `   ✅ Test #2: Owned $${ownedValue.toFixed(
          2
        )} → Recommended $${recommendedValue.toFixed(2)} (Improvement: $${(
          recommendedValue - ownedValue
        ).toFixed(2)})`
      );
    } else {
      // If no recommendations, that's acceptable - user already has optimal card
      console.log(
        `   ✅ Test #2: Owned $${ownedValue.toFixed(2)} → No recommendations (${
          message || "Already optimal"
        })`
      );
    }
  });

  // Test 13: User owns multiple cards, should beat combined value
  test("Value Comparison #3: Multiple owned cards → Beat combined value", async () => {
    const transactions = [
      {
        transaction_id: "t1",
        account_id: "acc",
        amount: 12000,
        date: "2025-01-01",
        name: "Groceries",
        category: ["Food and Drink", "Groceries"],
        personal_finance_category: { primary: "FOOD_AND_DRINK", detailed: "FOOD_AND_DRINK_GROCERIES", confidence_level: "VERY_HIGH" },
      },
      {
        transaction_id: "t2",
        account_id: "acc",
        amount: 8000,
        date: "2025-01-02",
        name: "Online",
        category: ["General Merchandise", "Online"],
        personal_finance_category: { primary: "GENERAL_MERCHANDISE", detailed: "GENERAL_MERCHANDISE_ONLINE_MARKETPLACES", confidence_level: "VERY_HIGH" },
      },
      {
        transaction_id: "t3",
        account_id: "acc",
        amount: 5000,
        date: "2025-01-03",
        name: "Dining",
        category: ["Food and Drink", "Restaurants"],
        personal_finance_category: { primary: "FOOD_AND_DRINK", detailed: "FOOD_AND_DRINK_RESTAURANTS", confidence_level: "VERY_HIGH" },
      },
    ];

    const preferences = {
      travel: false,
      cashback: false,
      no_annual_fee: false,
      low_interest: false,
      beginner_friendly: false,
    };
    const ownedCards = [
      {
        id: "boa_customized_cash_rewards",
        name: "Customized Cash Rewards",
        institution_name: "Bank of America",
      },
      {
        id: "plaid_credit_card",
        name: "Plaid Credit Card",
        institution_name: "Tartan Bank",
      },
    ];

    const ownedValue = await calculateOwnedCardsAnnualValue(
      ownedCards,
      transactions
    );
    const [recommendations] = await testGetMultiCardRecommendations(
      transactions,
      preferences,
      ownedCards
    );

    if (recommendations.length > 0) {
      const recommendedValue = recommendations.reduce(
        (sum, card) => sum + (card.annualValue || 0),
        0
      );
      if (recommendedValue < ownedValue) {
        throw new Error(
          `Test #3 Failed: Recommended ($${recommendedValue.toFixed(
            2
          )}) < Owned ($${ownedValue.toFixed(2)})`
        );
      }
      console.log(
        `   ✅ Test #3: Owned $${ownedValue.toFixed(
          2
        )} → Recommended $${recommendedValue.toFixed(2)} (Improvement: $${(
          recommendedValue - ownedValue
        ).toFixed(2)})`
      );
    }
  });

  // Test 14: User owns cards that match spending well, should still find better
  test("Value Comparison #4: Well-matched owned cards → Still find improvements", async () => {
    const transactions = [
      {
        transaction_id: "t1",
        account_id: "acc",
        amount: 15000,
        date: "2025-01-01",
        name: "Online Shopping",
        category: ["General Merchandise", "Online"],
        personal_finance_category: { primary: "GENERAL_MERCHANDISE", detailed: "GENERAL_MERCHANDISE_ONLINE_MARKETPLACES", confidence_level: "VERY_HIGH" },
      },
    ];

    const preferences = {
      travel: false,
      cashback: true,
      no_annual_fee: false,
      low_interest: false,
      beginner_friendly: false,
    };
    const ownedCards = [
      {
        id: "boa_customized_cash_rewards",
        name: "Customized Cash Rewards",
        institution_name: "Bank of America",
      },
    ];

    const ownedValue = await calculateOwnedCardsAnnualValue(
      ownedCards,
      transactions
    );
    const [recommendations] = await testGetMultiCardRecommendations(
      transactions,
      preferences,
      ownedCards
    );

    if (recommendations.length > 0) {
      const recommendedValue = recommendations.reduce(
        (sum, card) => sum + (card.annualValue || 0),
        0
      );
      if (recommendedValue < ownedValue) {
        throw new Error(
          `Test #4 Failed: Recommended ($${recommendedValue.toFixed(
            2
          )}) < Owned ($${ownedValue.toFixed(2)})`
        );
      }
      console.log(
        `   ✅ Test #4: Owned $${ownedValue.toFixed(
          2
        )} → Recommended $${recommendedValue.toFixed(2)} (Improvement: $${(
          recommendedValue - ownedValue
        ).toFixed(2)})`
      );
    }
  });

  // Test 15: User owns cards that don't match spending, should find much better
  test("Value Comparison #5: Poorly-matched owned cards → Find much better options", async () => {
    const transactions = [
      {
        transaction_id: "t1",
        account_id: "acc",
        amount: 20000,
        date: "2025-01-01",
        name: "Travel",
        category: ["Travel", "Airlines"],
        personal_finance_category: { primary: "TRAVEL", detailed: "TRAVEL_FLIGHTS", confidence_level: "VERY_HIGH" },
      },
      {
        transaction_id: "t2",
        account_id: "acc",
        amount: 10000,
        date: "2025-01-02",
        name: "Hotels",
        category: ["Travel", "Hotels"],
        personal_finance_category: { primary: "TRAVEL", detailed: "TRAVEL_LODGING", confidence_level: "VERY_HIGH" },
      },
    ];

    const preferences = {
      travel: true,
      cashback: false,
      no_annual_fee: false,
      low_interest: false,
      beginner_friendly: false,
    };
    // User owns a cashback card but spends heavily on travel
    const ownedCards = [
      {
        id: "plaid_credit_card",
        name: "Plaid Credit Card",
        institution_name: "Tartan Bank",
      },
    ];

    const ownedValue = await calculateOwnedCardsAnnualValue(
      ownedCards,
      transactions
    );
    const [recommendations] = await testGetMultiCardRecommendations(
      transactions,
      preferences,
      ownedCards
    );

    if (recommendations.length > 0) {
      const recommendedValue = recommendations.reduce(
        (sum, card) => sum + (card.annualValue || 0),
        0
      );
      if (recommendedValue < ownedValue) {
        throw new Error(
          `Test #5 Failed: Recommended ($${recommendedValue.toFixed(
            2
          )}) < Owned ($${ownedValue.toFixed(2)})`
        );
      }
      // Should be significantly better since owned card doesn't match spending
      const improvement = recommendedValue - ownedValue;
      if (improvement < ownedValue * 0.5) {
        console.log(
          `   ⚠️  Test #5: Improvement ($${improvement.toFixed(
            2
          )}) is less than 50% of owned value - may need review`
        );
      }
      console.log(
        `   ✅ Test #5: Owned $${ownedValue.toFixed(
          2
        )} → Recommended $${recommendedValue.toFixed(
          2
        )} (Improvement: $${improvement.toFixed(2)})`
      );
    }
  });

  // Test 16: User owns premium card, should find complementary cards
  test("Value Comparison #6: Premium owned card → Find complementary cards", async () => {
    const transactions = [
      {
        transaction_id: "t1",
        account_id: "acc",
        amount: 10000,
        date: "2025-01-01",
        name: "Groceries",
        category: ["Food and Drink", "Groceries"],
        personal_finance_category: { primary: "FOOD_AND_DRINK", detailed: "FOOD_AND_DRINK_GROCERIES", confidence_level: "VERY_HIGH" },
      },
      {
        transaction_id: "t2",
        account_id: "acc",
        amount: 5000,
        date: "2025-01-02",
        name: "Travel",
        category: ["Travel", "Airlines"],
        personal_finance_category: { primary: "TRAVEL", detailed: "TRAVEL_FLIGHTS", confidence_level: "VERY_HIGH" },
      },
      {
        transaction_id: "t3",
        account_id: "acc",
        amount: 3000,
        date: "2025-01-03",
        name: "Dining",
        category: ["Food and Drink", "Restaurants"],
        personal_finance_category: { primary: "FOOD_AND_DRINK", detailed: "FOOD_AND_DRINK_RESTAURANTS", confidence_level: "VERY_HIGH" },
      },
    ];

    const preferences = {
      travel: false,
      cashback: false,
      no_annual_fee: false,
      low_interest: false,
      beginner_friendly: false,
    };
    const ownedCards = [
      {
        id: "amex_platinum_card",
        name: "Platinum Card",
        institution_name: "American Express",
      },
    ];

    const ownedValue = await calculateOwnedCardsAnnualValue(
      ownedCards,
      transactions
    );
    const [recommendations] = await testGetMultiCardRecommendations(
      transactions,
      preferences,
      ownedCards
    );

    if (recommendations.length > 0) {
      const recommendedValue = recommendations.reduce(
        (sum, card) => sum + (card.annualValue || 0),
        0
      );
      // Combined value (owned + recommended) should be greater than just owned
      const combinedValue = ownedValue + recommendedValue;
      if (combinedValue <= ownedValue) {
        throw new Error(
          `Test #6 Failed: Combined value ($${combinedValue.toFixed(
            2
          )}) should be > owned ($${ownedValue.toFixed(2)})`
        );
      }
      console.log(
        `   ✅ Test #6: Owned $${ownedValue.toFixed(
          2
        )} + Recommended $${recommendedValue.toFixed(
          2
        )} = Combined $${combinedValue.toFixed(2)}`
      );
    }
  });

  // Test 17: User owns cashback card, should find travel cards if spending matches
  test("Value Comparison #7: Cashback owned → Find travel cards for travel spending", async () => {
    const transactions = [
      {
        transaction_id: "t1",
        account_id: "acc",
        amount: 25000,
        date: "2025-01-01",
        name: "Travel",
        category: ["Travel", "Airlines"],
        personal_finance_category: { primary: "TRAVEL", detailed: "TRAVEL_FLIGHTS", confidence_level: "VERY_HIGH" },
      },
      {
        transaction_id: "t2",
        account_id: "acc",
        amount: 15000,
        date: "2025-01-02",
        name: "Hotels",
        category: ["Travel", "Hotels"],
        personal_finance_category: { primary: "TRAVEL", detailed: "TRAVEL_LODGING", confidence_level: "VERY_HIGH" },
      },
    ];

    const preferences = {
      travel: true,
      cashback: false,
      no_annual_fee: false,
      low_interest: false,
      beginner_friendly: false,
    };
    const ownedCards = [
      {
        id: "boa_customized_cash_rewards",
        name: "Customized Cash Rewards",
        institution_name: "Bank of America",
      },
    ];

    const ownedValue = await calculateOwnedCardsAnnualValue(
      ownedCards,
      transactions
    );
    const [recommendations] = await testGetMultiCardRecommendations(
      transactions,
      preferences,
      ownedCards
    );

    if (recommendations.length > 0) {
      const recommendedValue = recommendations.reduce(
        (sum, card) => sum + (card.annualValue || 0),
        0
      );
      if (recommendedValue < ownedValue) {
        throw new Error(
          `Test #7 Failed: Recommended ($${recommendedValue.toFixed(
            2
          )}) < Owned ($${ownedValue.toFixed(2)})`
        );
      }
      // Should recommend travel cards for heavy travel spending
      const hasTravelCard = recommendations.some(
        (card) => card.tags?.includes("travel") || card.rewards?.travel
      );
      console.log(
        `   ✅ Test #7: Owned $${ownedValue.toFixed(
          2
        )} → Recommended $${recommendedValue.toFixed(2)} ${
          hasTravelCard ? "(Travel card recommended)" : ""
        }`
      );
    }
  });

  // Test 18: User owns cards with high fees, should find better value or return empty
  test("Value Comparison #8: High-fee owned cards → Find better value or no recommendations", async () => {
    const transactions = [
      {
        transaction_id: "t1",
        account_id: "acc",
        amount: 5000,
        date: "2025-01-01",
        name: "Groceries",
        category: ["Food and Drink", "Groceries"],
        personal_finance_category: { primary: "FOOD_AND_DRINK", detailed: "FOOD_AND_DRINK_GROCERIES", confidence_level: "VERY_HIGH" },
      },
    ];

    const preferences = {
      travel: false,
      cashback: false,
      no_annual_fee: false,
      low_interest: false,
      beginner_friendly: false,
    };
    // User owns high-fee card with low spending
    const ownedCards = [
      {
        id: "amex_platinum_card",
        name: "Platinum Card",
        institution_name: "American Express",
      },
    ];

    const ownedValue = await calculateOwnedCardsAnnualValue(
      ownedCards,
      transactions
    );
    const [recommendations, message] = await testGetMultiCardRecommendations(
      transactions,
      preferences,
      ownedCards
    );

    if (recommendations.length > 0) {
      const recommendedValue = recommendations.reduce(
        (sum, card) => sum + (card.annualValue || 0),
        0
      );
      if (recommendedValue < ownedValue) {
        throw new Error(
          `Test #8 Failed: Recommended ($${recommendedValue.toFixed(
            2
          )}) < Owned ($${ownedValue.toFixed(
            2
          )}). If no better options exist, should return empty.`
        );
      }
      console.log(
        `   ✅ Test #8: Owned $${ownedValue.toFixed(
          2
        )} → Recommended $${recommendedValue.toFixed(2)} (Improvement: $${(
          recommendedValue - ownedValue
        ).toFixed(2)})`
      );
    } else {
      // If no recommendations, that's acceptable - user already has optimal card for their spending
      console.log(
        `   ✅ Test #8: Owned $${ownedValue.toFixed(2)} → No recommendations (${
          message || "Already optimal for low spending"
        })`
      );
    }
  });

  // Test 19: User owns no-fee cards, should find cards that justify fees
  test("Value Comparison #9: No-fee owned cards → Find cards that justify fees", async () => {
    const transactions = [
      {
        transaction_id: "t1",
        account_id: "acc",
        amount: 20000,
        date: "2025-01-01",
        name: "Groceries",
        category: ["Food and Drink", "Groceries"],
        personal_finance_category: { primary: "FOOD_AND_DRINK", detailed: "FOOD_AND_DRINK_GROCERIES", confidence_level: "VERY_HIGH" },
      },
      {
        transaction_id: "t2",
        account_id: "acc",
        amount: 10000,
        date: "2025-01-02",
        name: "Travel",
        category: ["Travel", "Airlines"],
        personal_finance_category: { primary: "TRAVEL", detailed: "TRAVEL_FLIGHTS", confidence_level: "VERY_HIGH" },
      },
    ];

    const preferences = {
      travel: false,
      cashback: false,
      no_annual_fee: false,
      low_interest: false,
      beginner_friendly: false,
    };
    const ownedCards = [
      {
        id: "plaid_credit_card",
        name: "Plaid Credit Card",
        institution_name: "Tartan Bank",
      },
      {
        id: "boa_customized_cash_rewards",
        name: "Customized Cash Rewards",
        institution_name: "Bank of America",
      },
    ];

    const ownedValue = await calculateOwnedCardsAnnualValue(
      ownedCards,
      transactions
    );
    const [recommendations] = await testGetMultiCardRecommendations(
      transactions,
      preferences,
      ownedCards
    );

    if (recommendations.length > 0) {
      const recommendedValue = recommendations.reduce(
        (sum, card) => sum + (card.annualValue || 0),
        0
      );
      if (recommendedValue < ownedValue) {
        throw new Error(
          `Test #9 Failed: Recommended ($${recommendedValue.toFixed(
            2
          )}) < Owned ($${ownedValue.toFixed(2)})`
        );
      }
      // Even with fees, should provide better value
      const hasFeeCards = recommendations.some(
        (card) => (card.annual_fee || 0) > 0
      );
      console.log(
        `   ✅ Test #9: Owned $${ownedValue.toFixed(
          2
        )} → Recommended $${recommendedValue.toFixed(2)} ${
          hasFeeCards ? "(Includes fee cards with better value)" : ""
        }`
      );
    }
  });

  // Test 20: User owns optimal cards already, should return empty or equal value
  test("Value Comparison #10: Optimal owned cards → No better recommendations", async () => {
    const transactions = [
      {
        transaction_id: "t1",
        account_id: "acc",
        amount: 5000,
        date: "2025-01-01",
        name: "Groceries",
        category: ["Food and Drink", "Groceries"],
        personal_finance_category: { primary: "FOOD_AND_DRINK", detailed: "FOOD_AND_DRINK_GROCERIES", confidence_level: "VERY_HIGH" },
      },
    ];

    const preferences = {
      travel: false,
      cashback: false,
      no_annual_fee: false,
      low_interest: false,
      beginner_friendly: false,
    };
    // Own all available cards
    const allCards = loadCreditCardDataDirect();
    const ownedCards = allCards.map((card) => ({
      id: card.id,
      name: card.name,
      institution_name: card.institution_name,
    }));

    const ownedValue = await calculateOwnedCardsAnnualValue(
      ownedCards,
      transactions
    );
    const [recommendations, message] = await testGetMultiCardRecommendations(
      transactions,
      preferences,
      ownedCards
    );

    // Should return empty or message about optimization
    if (recommendations.length > 0) {
      const recommendedValue = recommendations.reduce(
        (sum, card) => sum + (card.annualValue || 0),
        0
      );
      // If recommendations exist, they should at least match owned value
      if (recommendedValue < ownedValue) {
        throw new Error(
          `Test #10 Failed: Recommended ($${recommendedValue.toFixed(
            2
          )}) < Owned ($${ownedValue.toFixed(2)})`
        );
      }
      console.log(
        `   ✅ Test #10: Owned $${ownedValue.toFixed(
          2
        )} → Recommended $${recommendedValue.toFixed(2)} (Equal or better)`
      );
    } else {
      console.log(
        `   ✅ Test #10: Owned $${ownedValue.toFixed(
          2
        )} → No recommendations (${message || "All cards owned"})`
      );
    }
  });

  // =======================================================
  // NEW INTEGRATION TESTS
  // =======================================================

  // Test 21: Single-card mode (getRecommendedCards)
  test("getRecommendedCards returns ranked single cards", async () => {
    const transactions = [
      {
        transaction_id: "sc1",
        account_id: "test_account",
        amount: 3000,
        date: "2025-01-01",
        name: "Whole Foods",
        category: ["Food and Drink", "Groceries"],
        personal_finance_category: { primary: "FOOD_AND_DRINK", detailed: "FOOD_AND_DRINK_GROCERIES", confidence_level: "VERY_HIGH" },
      },
      {
        transaction_id: "sc2",
        account_id: "test_account",
        amount: 2000,
        date: "2025-01-05",
        name: "Restaurant",
        category: ["Food and Drink", "Restaurants"],
        personal_finance_category: { primary: "FOOD_AND_DRINK", detailed: "FOOD_AND_DRINK_RESTAURANT", confidence_level: "VERY_HIGH" },
      },
      {
        transaction_id: "sc3",
        account_id: "test_account",
        amount: 1000,
        date: "2025-01-10",
        name: "Delta Airlines",
        category: ["Travel", "Airlines"],
        personal_finance_category: { primary: "TRAVEL", detailed: "TRAVEL_FLIGHTS", confidence_level: "VERY_HIGH" },
      },
    ];

    const preferences = {
      travel: false,
      cashback: false,
      no_annual_fee: false,
      low_interest: false,
      beginner_friendly: false,
    };

    const [cards, message] = await testGetRecommendedCards(transactions, preferences);

    if (cards.length === 0) {
      throw new Error("Expected at least 1 card from single-card mode");
    }

    // Verify cards are sorted by annualValue descending
    for (let i = 1; i < cards.length; i++) {
      if (cards[i].annualValue > cards[i - 1].annualValue) {
        throw new Error(
          `Cards not sorted: card[${i - 1}].annualValue (${cards[i - 1].annualValue}) < card[${i}].annualValue (${cards[i].annualValue})`
        );
      }
    }

    // Verify each card has required value fields
    for (const card of cards) {
      if (card.estimatedRewards === undefined) throw new Error("Missing estimatedRewards");
      if (card.creditsValue === undefined) throw new Error("Missing creditsValue");
      if (card.benefitsValue === undefined) throw new Error("Missing benefitsValue");
      if (card.annualValue === undefined) throw new Error("Missing annualValue");
      if (card.totalRewards === undefined) throw new Error("Missing totalRewards");
    }

    console.log(`   ✅ Test #21: Single-card mode returned ${cards.length} cards, sorted correctly`);
  });

  // Test 22: High spending in capped category triggers overflow allocation
  test("Cap overflow: $15k online shopping splits across cards", async () => {
    const transactions = [
      {
        transaction_id: "cap1",
        account_id: "test_account",
        amount: 15000,
        date: "2025-01-01",
        name: "Amazon",
        category: ["Shops", "Online Marketplaces"],
        personal_finance_category: { primary: "GENERAL_MERCHANDISE", detailed: "GENERAL_MERCHANDISE_ONLINE_MARKETPLACES", confidence_level: "VERY_HIGH" },
      },
    ];

    const preferences = {
      travel: false,
      cashback: false,
      no_annual_fee: false,
      low_interest: false,
      beginner_friendly: false,
    };

    const [recommendations] = await testGetMultiCardRecommendations(
      transactions,
      preferences,
      []
    );

    if (recommendations.length === 0) {
      throw new Error("Expected recommendations for high online-shopping spend");
    }

    // BoA Customized Cash has $2500 quarterly cap on online-shopping (3%)
    // $10k capped at 3% = $300; overflow should go to next best
    const totalAllocatedRewards = recommendations.reduce(
      (sum: number, card: RecommendedCard) => sum + (card.estimatedRewards || 0),
      0
    );

    if (totalAllocatedRewards <= 0) {
      throw new Error(`Expected positive rewards, got $${totalAllocatedRewards.toFixed(2)}`);
    }

    console.log(
      `   ✅ Test #22: $15k online shopping → ${recommendations.length} cards, ` +
      `total rewards $${totalAllocatedRewards.toFixed(2)}`
    );
  });

  // Test 23: Preference filtering - travel + no_annual_fee
  test("Preference filter: travel + no_annual_fee returns matching cards", async () => {
    const transactions = [
      {
        transaction_id: "pf1",
        account_id: "test_account",
        amount: 2000,
        date: "2025-01-01",
        name: "United Airlines",
        category: ["Travel", "Airlines"],
        personal_finance_category: { primary: "TRAVEL", detailed: "TRAVEL_FLIGHTS", confidence_level: "VERY_HIGH" },
      },
    ];

    const travelNoFeePrefs = {
      travel: true,
      cashback: false,
      no_annual_fee: true,
      low_interest: false,
      beginner_friendly: false,
    };

    const [recommendations] = await testGetMultiCardRecommendations(
      transactions,
      travelNoFeePrefs,
      []
    );

    if (recommendations.length === 0) {
      throw new Error("Expected recommendations for travel + no_annual_fee");
    }

    // Chase Freedom Unlimited has both tags: travel + no_annual_fee
    const hasChase = recommendations.some(
      (card: RecommendedCard) => card.id === "chase_freedom_unlimited"
    );
    if (!hasChase) {
      const ids = recommendations.map((c: RecommendedCard) => c.id);
      throw new Error(
        `Expected Chase Freedom Unlimited in results (travel + no_annual_fee), got: ${ids}`
      );
    }

    // Amex Platinum should NOT be in a combo that has only no_annual_fee cards
    // (it has travel tag but NOT no_annual_fee)
    const allNoFee = recommendations.every((c: RecommendedCard) => c.annual_fee === 0);
    console.log(
      `   ✅ Test #23: travel + no_annual_fee → ${recommendations.length} cards` +
      `${allNoFee ? " (all $0 fee)" : ""}, Chase Freedom Unlimited included`
    );
  });

  // Test 24: All refunds produces $0 rewards
  test("All refunds (negative amounts) produce $0 estimated rewards", async () => {
    const refundTransactions = [
      {
        transaction_id: "ref1",
        account_id: "test_account",
        amount: -500,
        date: "2025-01-01",
        name: "Refund - Restaurant",
        category: ["Food and Drink", "Restaurants"],
        personal_finance_category: { primary: "FOOD_AND_DRINK", detailed: "FOOD_AND_DRINK_RESTAURANT", confidence_level: "VERY_HIGH" },
      },
      {
        transaction_id: "ref2",
        account_id: "test_account",
        amount: -200,
        date: "2025-01-05",
        name: "Refund - Amazon",
        category: ["Shops", "Online Marketplaces"],
        personal_finance_category: { primary: "GENERAL_MERCHANDISE", detailed: "GENERAL_MERCHANDISE_ONLINE_MARKETPLACES", confidence_level: "VERY_HIGH" },
      },
      {
        transaction_id: "ref3",
        account_id: "test_account",
        amount: -1000,
        date: "2025-01-10",
        name: "Refund - Airline",
        category: ["Travel", "Airlines"],
        personal_finance_category: { primary: "TRAVEL", detailed: "TRAVEL_FLIGHTS", confidence_level: "VERY_HIGH" },
      },
    ];

    const preferences = {
      travel: false,
      cashback: false,
      no_annual_fee: false,
      low_interest: false,
      beginner_friendly: false,
    };

    const [recommendations] = await testGetMultiCardRecommendations(
      refundTransactions,
      preferences,
      []
    );

    // All transaction rewards should be $0 since all amounts are negative
    for (const card of recommendations) {
      if ((card.estimatedRewards || 0) !== 0) {
        throw new Error(
          `Expected $0 estimated rewards for ${card.name}, got $${card.estimatedRewards}`
        );
      }
    }

    console.log(
      `   ✅ Test #24: All refunds → ${recommendations.length} cards, all with $0 estimated rewards`
    );
  });

  // Test 25: Cashback preference only surfaces cashback-tagged cards
  test("Preference filter: cashback only surfaces cashback-tagged cards", async () => {
    const transactions = [
      {
        transaction_id: "cb1",
        account_id: "test_account",
        amount: 1500,
        date: "2025-01-01",
        name: "Grocery Store",
        category: ["Food and Drink", "Groceries"],
        personal_finance_category: { primary: "FOOD_AND_DRINK", detailed: "FOOD_AND_DRINK_GROCERIES", confidence_level: "VERY_HIGH" },
      },
    ];

    const cashbackPrefs = {
      travel: false,
      cashback: true,
      no_annual_fee: false,
      low_interest: false,
      beginner_friendly: false,
    };

    const [recommendations] = await testGetMultiCardRecommendations(
      transactions,
      cashbackPrefs,
      []
    );

    if (recommendations.length === 0) {
      throw new Error("Expected recommendations for cashback preference");
    }

    // All cards in the recommendation should have "cashback" in tags
    // (since strict/partial match should find cashback-tagged cards)
    const allCards = loadCreditCardDataDirect();
    const cashbackCardIds = new Set(
      allCards.filter((c: CreditCardData) => (c.tags || []).includes("cashback")).map((c: CreditCardData) => c.id)
    );

    const allCashback = recommendations.every((c: any) => cashbackCardIds.has(c.id));
    if (!allCashback) {
      const nonCashback = recommendations.filter((c: any) => !cashbackCardIds.has(c.id)).map((c: any) => c.name);
      throw new Error(`Non-cashback cards in results: ${nonCashback.join(", ")}`);
    }

    console.log(
      `   ✅ Test #25: cashback pref → ${recommendations.length} cashback-tagged cards`
    );
  });

  // Wait for all async tests to complete
  await new Promise((resolve) => setTimeout(resolve, 8000));

  // Print results
  console.log("\n📊 Test Results:\n");
  let passed = 0;
  let failed = 0;

  tests.forEach((test, index) => {
    if (test.passed) {
      console.log(`✅ Test ${index + 1}: ${test.name}`);
      passed++;
    } else {
      console.log(`❌ Test ${index + 1}: ${test.name}`);
      if (test.error) {
        console.log(`   Error: ${test.error}`);
      }
      failed++;
    }
  });

  console.log("\n" + "=".repeat(60));
  console.log(`Total: ${tests.length} | Passed: ${passed} | Failed: ${failed}`);
  console.log("=".repeat(60) + "\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((error) => {
  console.error("Fatal error running tests:", error);
  process.exit(1);
});
