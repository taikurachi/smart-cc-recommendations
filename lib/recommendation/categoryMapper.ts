import { PersonalFinanceCategory, RewardCategory } from "./types";
import { DEFAULT_REWARD_CATEGORY } from "./constants";

/**
 * Map a Plaid personal_finance_category to the single best-matching reward category.
 * Uses the newer personal_finance_category taxonomy (primary + detailed).
 * See: https://plaid.com/documents/transactions-personal-finance-category-taxonomy.csv
 */
export function mapTransactionCategoryToRewardCategory(
  pfc?: PersonalFinanceCategory,
): RewardCategory {
  if (!pfc) return DEFAULT_REWARD_CATEGORY;

  const { primary, detailed } = pfc;

  if (primary === "FOOD_AND_DRINK") {
    if (detailed === "FOOD_AND_DRINK_GROCERIES") return "grocery";
    return "dining";
  }

  if (primary === "TRAVEL") {
    if (detailed === "TRAVEL_LODGING") return "hotels";
    return "travel";
  }

  if (primary === "TRANSPORTATION") {
    if (detailed === "TRANSPORTATION_GAS") return "gas";
    if (
      detailed === "TRANSPORTATION_TAXIS_AND_RIDE_SHARES" ||
      detailed === "TRANSPORTATION_PUBLIC_TRANSIT" ||
      detailed === "TRANSPORTATION_PARKING" ||
      detailed === "TRANSPORTATION_TOLLS"
    ) {
      return "transit";
    }
    return DEFAULT_REWARD_CATEGORY;
  }

  if (primary === "GENERAL_MERCHANDISE") {
    if (detailed === "GENERAL_MERCHANDISE_ONLINE_MARKETPLACES")
      return "online-shopping";
    if (detailed === "GENERAL_MERCHANDISE_PHARMACIES") return "drugstores";
    if (
      detailed === "GENERAL_MERCHANDISE_SUPERSTORES" ||
      detailed === "GENERAL_MERCHANDISE_WAREHOUSE_CLUBS_AND_SUPERCENTERS"
    ) {
      return "wholesale-clubs";
    }
    return DEFAULT_REWARD_CATEGORY;
  }

  if (primary === "ENTERTAINMENT") {
    if (
      detailed === "ENTERTAINMENT_MUSIC_AND_AUDIO" ||
      detailed === "ENTERTAINMENT_TV_AND_MOVIES"
    ) {
      return "streaming";
    }
    return "entertainment";
  }

  if (primary === "RENT_AND_UTILITIES") {
    if (
      detailed === "RENT_AND_UTILITIES_INTERNET_AND_CABLE" ||
      detailed === "RENT_AND_UTILITIES_TELEPHONE"
    ) {
      return "streaming";
    }
    return DEFAULT_REWARD_CATEGORY;
  }

  return DEFAULT_REWARD_CATEGORY;
}
