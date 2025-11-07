import { CardPreferences, Transaction } from "./types";

export interface CreditCardRecommendation {
  name: string;
  issuer: string;
  rating: string;
  annualFee: string;
  rewards: string;
  introOffer?: string;
  matchScore: number;
  matchReasons: string[];
  estimatedValue?: number;
}

interface SpendingCategory {
  category: string;
  amount: number;
  percentage: number;
}

/**
 * Calculate match score for a credit card based on user preferences and spending
 * @param card - Credit card data from scraping
 * @param preferences - User's card preferences
 * @param spendingCategories - User's spending breakdown by category
 * @returns Match score (0-100) and reasons
 */
export function calculateCardMatchScore(
  card: any, // Will be replaced with actual card type from scraping
  preferences: CardPreferences,
  spendingCategories: SpendingCategory[]
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];
  const maxScore = 100;

  // Base score distribution:
  // - Preferences match: 40 points
  // - Spending alignment: 40 points
  // - Card features: 20 points

  // 1. Preference Matching (40 points max)
  const preferenceCount = Object.values(preferences).filter(Boolean).length;
  const preferenceWeight = preferenceCount > 0 ? 40 / preferenceCount : 0;

  if (preferences.travel) {
    const cardName = card.name?.toLowerCase() || "";
    const rewards = card.rewards?.toLowerCase() || "";
    
    if (
      cardName.includes("travel") ||
      rewards.includes("travel") ||
      rewards.includes("miles") ||
      rewards.includes("airline")
    ) {
      score += preferenceWeight;
      reasons.push("Strong travel rewards program");
    }
  }

  if (preferences.cashback) {
    const rewards = card.rewards?.toLowerCase() || "";
    
    if (
      rewards.includes("cash back") ||
      rewards.includes("cashback") ||
      rewards.includes("%")
    ) {
      score += preferenceWeight;
      reasons.push("Generous cashback rewards");
    }
  }

  if (preferences.no_annual_fee) {
    const annualFee = card.annualFee?.toLowerCase() || "";
    
    if (annualFee.includes("$0") || annualFee === "0" || annualFee.includes("none")) {
      score += preferenceWeight;
      reasons.push("No annual fee");
    } else {
      score -= 10; // Penalty for having annual fee when preference is set
    }
  }

  if (preferences.low_interest) {
    const intro = card.introOffer?.toLowerCase() || "";
    const cardName = card.name?.toLowerCase() || "";
    
    if (
      intro.includes("0% apr") ||
      intro.includes("low apr") ||
      cardName.includes("low interest")
    ) {
      score += preferenceWeight;
      reasons.push("Low interest rate or 0% intro APR");
    }
  }

  if (preferences.beginner_friendly) {
    const cardName = card.name?.toLowerCase() || "";
    const annualFee = card.annualFee?.toLowerCase() || "";
    
    if (
      cardName.includes("starter") ||
      cardName.includes("student") ||
      cardName.includes("secured") ||
      (annualFee.includes("$0") || annualFee === "0")
    ) {
      score += preferenceWeight;
      reasons.push("Beginner-friendly with easy approval");
    }
  }

  // 2. Spending Category Alignment (40 points max)
  const topCategories = spendingCategories.slice(0, 3); // Top 3 spending categories
  const categoryWeight = topCategories.length > 0 ? 40 / topCategories.length : 0;

  topCategories.forEach((category) => {
    const rewards = card.rewards?.toLowerCase() || "";
    const categoryName = category.category.toLowerCase();

    // Map spending categories to reward categories
    const categoryMatches: Record<string, string[]> = {
      dining: ["dining", "restaurant", "food"],
      groceries: ["grocery", "groceries", "supermarket"],
      travel: ["travel", "airline", "hotel"],
      gas: ["gas", "fuel"],
      entertainment: ["entertainment", "streaming"],
      shopping: ["shopping", "retail"],
    };

    let matched = false;
    Object.entries(categoryMatches).forEach(([key, keywords]) => {
      if (keywords.some((kw) => categoryName.includes(kw))) {
        if (keywords.some((kw) => rewards.includes(kw))) {
          score += categoryWeight;
          reasons.push(`Rewards align with your ${key} spending (${category.percentage.toFixed(0)}%)`);
          matched = true;
        }
      }
    });
  });

  // 3. Card Features (20 points max)
  const rating = parseFloat(card.rating || "0");
  if (rating >= 4.5) {
    score += 10;
    reasons.push("Highly rated card");
  } else if (rating >= 4.0) {
    score += 5;
  }

  if (card.introOffer) {
    score += 10;
    reasons.push("Welcome bonus available");
  }

  // Normalize score to 0-100
  score = Math.min(Math.max(score, 0), maxScore);

  return { score, reasons };
}

/**
 * Get recommended credit cards based on user preferences and spending
 * @param allCards - All available credit cards from scraping
 * @param preferences - User's card preferences
 * @param spendingCategories - User's spending breakdown
 * @returns Sorted array of recommended cards with match scores
 */
export function getRecommendedCards(
  allCards: any[],
  preferences: CardPreferences,
  spendingCategories: SpendingCategory[]
): CreditCardRecommendation[] {
  const recommendations: CreditCardRecommendation[] = allCards
    .map((card) => {
      const { score, reasons } = calculateCardMatchScore(
        card,
        preferences,
        spendingCategories
      );

      return {
        name: card.name,
        issuer: card.issuer || "Unknown",
        rating: card.rating,
        annualFee: card.annualFee,
        rewards: card.rewards,
        introOffer: card.introOffer,
        matchScore: score,
        matchReasons: reasons,
      };
    })
    .filter((card) => card.matchScore > 30) // Only show cards with >30% match
    .sort((a, b) => b.matchScore - a.matchScore); // Sort by match score

  return recommendations.slice(0, 10); // Return top 10
}

/**
 * Calculate spending categories from transactions
 * @param transactions - User's transaction history
 * @returns Breakdown of spending by category
 */
export function analyzeSpendingCategories(
  transactions: Transaction[]
): SpendingCategory[] {
  const categoryTotals: Record<string, number> = {};
  let totalSpending = 0;

  // Aggregate spending by category
  transactions.forEach((transaction) => {
    const amount = Math.abs(transaction.amount); // Use absolute value for spending
    totalSpending += amount;

    const category = transaction.category?.[0] || "Other";
    categoryTotals[category] = (categoryTotals[category] || 0) + amount;
  });

  // Convert to array and calculate percentages
  const categories: SpendingCategory[] = Object.entries(categoryTotals)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: (amount / totalSpending) * 100,
    }))
    .sort((a, b) => b.amount - a.amount);

  return categories;
}

