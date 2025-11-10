import {
  CardPreferences,
  Transaction,
  CreditCardRecommendation,
} from "./types";

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
  // If no preferences selected, give base score to all cards
  const preferenceWeight = preferenceCount > 0 ? 40 / preferenceCount : 10;

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

    if (
      annualFee.includes("$0") ||
      annualFee === "0" ||
      annualFee.includes("none")
    ) {
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
      annualFee.includes("$0") ||
      annualFee === "0"
    ) {
      score += preferenceWeight;
      reasons.push("Beginner-friendly with easy approval");
    }
  }

  // 2. Spending Category Alignment (40 points max)
  const topCategories = spendingCategories.slice(0, 3); // Top 3 spending categories
  // If no categories, give base score
  const categoryWeight =
    topCategories.length > 0 ? 40 / topCategories.length : 10;

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
          reasons.push(
            `Rewards align with your ${key} spending (${category.percentage.toFixed(
              0
            )}%)`
          );
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
    reasons.push("Well-rated card");
  } else if (rating >= 3.5) {
    score += 3;
  }

  if (card.introOffer) {
    score += 10;
    reasons.push("Welcome bonus available");
  }

  // Base score for all cards (ensures we always have recommendations)
  if (score === 0) {
    score = 15; // Minimum base score
    reasons.push("Popular credit card option");
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

      // Format intro offer for display
      let introOfferText: string | undefined;
      if (card.introOffer) {
        if (typeof card.introOffer === "object" && card.introOffer.amount) {
          introOfferText = `$${card.introOffer.amount} bonus`;
        } else {
          introOfferText = String(card.introOffer);
        }
      }

      return {
        name: card.name,
        institution_name: card.institution_name,
        rating: card.rating || "N/A",
        annualFee: card.annualFee || "N/A",
        rewards: card.rewards || "See details",
        introOffer: introOfferText,
        matchScore: score,
        matchReasons: reasons,
        estimatedValue: calculateEstimatedValue(card, spendingCategories),
        image: card.image,
      };
    })
    .filter((card) => card.matchScore > 0) // Show all cards with any match
    .sort((a, b) => b.matchScore - a.matchScore); // Sort by match score

  // If no cards match preferences well, still return top cards by rating
  if (recommendations.length === 0) {
    console.log("No cards matched preferences, returning top rated cards");
    return allCards
      .map((card) => {
        const rating = parseFloat(card.rating || "0");
        return {
          name: card.name,
          institution_name: card.institution_name,
          rating: card.rating || "N/A",
          annualFee: card.annualFee || "N/A",
          rewards: card.rewards || "See details",
          introOffer: card.introOffer
            ? typeof card.introOffer === "object" && card.introOffer.amount
              ? `$${card.introOffer.amount} bonus`
              : String(card.introOffer)
            : undefined,
          matchScore: rating * 10, // Use rating as match score
          matchReasons: ["Highly rated card"],
          estimatedValue: calculateEstimatedValue(card, spendingCategories),
          image: {
            src: card.image,
            alt: `${card.image} image`,
          },
        };
      })
      .filter((card) => parseFloat(card.rating) >= 4.0)
      .sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating))
      .slice(0, 10);
  }

  return recommendations.slice(0, 3); // Return top 10
}

/**
 * Extract issuer name from card name (e.g., "Chase Freedom" -> "Chase")
 */
function extractIssuerFromName(cardName: string): string {
  const commonIssuers = [
    "Chase",
    "American Express",
    "Citi",
    "Capital One",
    "Discover",
    "Wells Fargo",
    "Bank of America",
    "US Bank",
  ];

  for (const issuer of commonIssuers) {
    if (cardName.includes(issuer)) {
      return issuer;
    }
  }

  return "Unknown";
}

/**
 * Calculate estimated annual value based on spending patterns
 */
function calculateEstimatedValue(
  card: any,
  spendingCategories: SpendingCategory[]
): number {
  // This is a simplified calculation
  // In a real app, you'd parse the rewards structure more carefully
  const rewards = card.rewards?.toLowerCase() || "";
  const annualFee = parseFloat(card.annualFee?.replace("$", "") || "0");

  // Estimate cashback percentage (simplified)
  let estimatedCashbackRate = 0;
  if (rewards.includes("2%")) {
    estimatedCashbackRate = 0.02;
  } else if (rewards.includes("1.5%")) {
    estimatedCashbackRate = 0.015;
  } else if (rewards.includes("1%")) {
    estimatedCashbackRate = 0.01;
  } else if (rewards.includes("5%")) {
    estimatedCashbackRate = 0.05;
  } else if (rewards.includes("3%")) {
    estimatedCashbackRate = 0.03;
  }

  // Estimate annual spending from top categories
  const totalSpending = spendingCategories.reduce(
    (sum, cat) => sum + cat.amount,
    0
  );
  const monthlySpending =
    totalSpending / Math.max(1, spendingCategories.length);
  const annualSpending = monthlySpending * 12;

  // Calculate estimated value
  const estimatedRewards = annualSpending * estimatedCashbackRate;
  const introBonus = card.introOffer?.amount || 0;

  return estimatedRewards + introBonus - annualFee;
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
