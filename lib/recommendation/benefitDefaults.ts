import type { BenefitMultipliers } from "../types";

export type BenefitGroup = "insurance" | "travel" | "credits" | "other";

export interface BenefitCategory {
  id: string;
  label: string;
  group: BenefitGroup;
  defaultMultiplier: number;
  patterns: string[];
}

export const BENEFIT_GROUP_LABELS: Record<BenefitGroup, string> = {
  insurance: "Insurance & Protection",
  travel: "Travel Perks",
  credits: "Credits & Subscriptions",
  other: "Other Benefits",
};

export const BENEFIT_CATEGORIES: BenefitCategory[] = [
  // ── Insurance & Protection (default: 0) ──
  {
    id: "cell_phone_protection",
    label: "Cell Phone Protection",
    group: "insurance",
    defaultMultiplier: 0,
    patterns: ["cell-phone", "cell_phone"],
  },
  {
    id: "purchase_protection",
    label: "Purchase Protection",
    group: "insurance",
    defaultMultiplier: 0,
    patterns: ["purchase-protection", "purchase_protection"],
  },
  {
    id: "trip_cancellation",
    label: "Trip Cancellation Insurance",
    group: "insurance",
    defaultMultiplier: 0,
    patterns: ["trip-cancellation", "trip cancellation", "trip-cancel"],
  },
  {
    id: "lost_luggage",
    label: "Lost Luggage Reimbursement",
    group: "insurance",
    defaultMultiplier: 0,
    patterns: ["lost-luggage", "lost_luggage"],
  },
  {
    id: "baggage_delay",
    label: "Baggage Delay Insurance",
    group: "insurance",
    defaultMultiplier: 0,
    patterns: ["baggage-delay", "baggage delay"],
  },
  {
    id: "travel_insurance",
    label: "Travel Insurance",
    group: "insurance",
    defaultMultiplier: 0,
    patterns: [
      "travel-insurance",
      "travel_insurance",
      "travel-accident",
      "travel accident",
    ],
  },
  {
    id: "rental_car_insurance",
    label: "Rental Car / Auto Insurance",
    group: "insurance",
    defaultMultiplier: 0,
    patterns: [
      "rental-car",
      "rental_car",
      "auto-rental",
      "auto_rental",
      "car-rental",
      "collision",
    ],
  },
  {
    id: "extended_warranty",
    label: "Extended Warranty",
    group: "insurance",
    defaultMultiplier: 0,
    patterns: ["extended-warranty", "extended_warranty", "extended warranty"],
  },
  {
    id: "return_protection",
    label: "Return Protection",
    group: "insurance",
    defaultMultiplier: 0,
    patterns: ["return-protection", "return_protection"],
  },
  {
    id: "travel_emergency",
    label: "Travel Emergency Assistance",
    group: "insurance",
    defaultMultiplier: 0,
    patterns: [
      "travel-emergency",
      "travel assistance",
      "global-assist",
      "emergency-assistance",
    ],
  },
  {
    id: "fraud_protection",
    label: "Fraud / Liability Protection",
    group: "insurance",
    defaultMultiplier: 0,
    patterns: ["fraud", "liability", "identity theft"],
  },
  {
    id: "price_protection",
    label: "Price Protection",
    group: "insurance",
    defaultMultiplier: 0,
    patterns: ["price protection", "price-match"],
  },

  // ── Travel Perks (default: 0.3–0.5) ──
  {
    id: "lounge_access",
    label: "Lounge Access",
    group: "travel",
    defaultMultiplier: 0.5,
    patterns: ["lounge", "priority pass"],
  },
  {
    id: "hotel_benefits",
    label: "Hotel Benefits",
    group: "travel",
    defaultMultiplier: 0.4,
    patterns: [
      "fine-hotels",
      "hotel-collection",
      "luxury_hotel",
      "luxury hotel",
      "ihg",
      "hotel credit",
    ],
  },
  {
    id: "no_foreign_tx_fees",
    label: "No Foreign Transaction Fees",
    group: "travel",
    defaultMultiplier: 0.5,
    patterns: [
      "foreign-transaction",
      "foreign transaction",
      "no_foreign",
      "zero_foreign",
    ],
  },
  {
    id: "visa_travel_perks",
    label: "Visa / Travel Signature Perks",
    group: "travel",
    defaultMultiplier: 0.3,
    patterns: ["visa signature", "visa_signature", "reserve travel"],
  },

  // ── Credits & Subscriptions (default: 0.8–0.9) ──
  {
    id: "uber_credits",
    label: "Uber Credits",
    group: "credits",
    defaultMultiplier: 0.9,
    patterns: ["uber"],
  },
  {
    id: "doordash_credits",
    label: "DoorDash / DashPass Credits",
    group: "credits",
    defaultMultiplier: 0.8,
    patterns: ["doordash", "door-dash", "dashpass"],
  },
  {
    id: "streaming_credits",
    label: "Streaming Credits",
    group: "credits",
    defaultMultiplier: 0.8,
    patterns: ["streaming", "disney", "peloton"],
  },
  {
    id: "dining_credits",
    label: "Dining Credits",
    group: "credits",
    defaultMultiplier: 0.8,
    patterns: [
      "dining",
      "resy",
      "grubhub",
      "cheesecake",
      "goldbelly",
      "five guys",
      "dunkin",
      "home chef",
    ],
  },
  {
    id: "lyft_credits",
    label: "Lyft Credits",
    group: "credits",
    defaultMultiplier: 0.8,
    patterns: ["lyft"],
  },
  {
    id: "airline_fee_credit",
    label: "Airline Fee Credit",
    group: "credits",
    defaultMultiplier: 0.5,
    patterns: ["airline-fee", "airline_incidental", "airline fee"],
  },
  {
    id: "travel_credit",
    label: "Travel Credit",
    group: "credits",
    defaultMultiplier: 0.85,
    patterns: ["travel_credit", "travel credit", "capital one travel"],
  },
  {
    id: "phone_bill_credit",
    label: "Phone Bill Credit",
    group: "credits",
    defaultMultiplier: 0.85,
    patterns: ["phone-bill", "phone_bill"],
  },
  {
    id: "tsa_global_entry",
    label: "TSA PreCheck / Global Entry",
    group: "credits",
    defaultMultiplier: 0.5,
    patterns: ["tsa", "global entry", "nexus", "precheck"],
  },
  {
    id: "entertainment_credits",
    label: "Entertainment Credits",
    group: "credits",
    defaultMultiplier: 0.7,
    patterns: [
      "stubhub",
      "viagogo",
      "entertainment",
      "digital-entertainment",
    ],
  },
  {
    id: "wellness_retail_credits",
    label: "Wellness & Retail Credits",
    group: "credits",
    defaultMultiplier: 0.4,
    patterns: [
      "saks",
      "lululemon",
      "walmart",
      "clear",
      "office-supplies",
      "uber-one",
    ],
  },

  // ── Other (default: 0.7) ──
  {
    id: "point_transfer",
    label: "Point Transfer Partners",
    group: "other",
    defaultMultiplier: 0.7,
    patterns: ["point-transfer", "point_transfer"],
  },
  {
    id: "intro_apr",
    label: "Intro APR Benefit",
    group: "other",
    defaultMultiplier: 0.7,
    patterns: ["intro apr", "introductory apr", "0% intro"],
  },
  {
    id: "anniversary_bonus",
    label: "Anniversary Bonus",
    group: "other",
    defaultMultiplier: 0.9,
    patterns: ["anniversary"],
  },
  {
    id: "cashback_match",
    label: "Cashback Match",
    group: "other",
    defaultMultiplier: 1.0,
    patterns: ["cashback-match"],
  },
  {
    id: "expense_management",
    label: "Expense Management / Employee Cards",
    group: "other",
    defaultMultiplier: 0.5,
    patterns: ["expense-management", "employee-cards", "employee_cards"],
  },
  {
    id: "concierge",
    label: "Concierge Services",
    group: "other",
    defaultMultiplier: 0.3,
    patterns: ["concierge", "citi entertainment"],
  },
];

/**
 * Match a benefit or credit name to a canonical category id.
 * Returns the category id, or null if no pattern matches.
 */
export function matchBenefitCategory(name: string): string | null {
  const lower = name.toLowerCase();
  for (const cat of BENEFIT_CATEGORIES) {
    if (cat.patterns.some((p) => lower.includes(p))) {
      return cat.id;
    }
  }
  return null;
}

/**
 * Build a Record of all category ids → their default multiplier values.
 */
export function getDefaultBenefitMultipliers(): BenefitMultipliers {
  const defaults: BenefitMultipliers = {};
  for (const cat of BENEFIT_CATEGORIES) {
    defaults[cat.id] = cat.defaultMultiplier;
  }
  return defaults;
}

/**
 * Resolve the effective multiplier for a given benefit/credit name.
 * If `overrides` contains a value for the matching category, use it;
 * otherwise fall back to the original `usage_ease` from card data.
 */
export function resolveMultiplier(
  name: string,
  originalUsageEase: number,
  overrides?: BenefitMultipliers,
): number {
  if (!overrides) return originalUsageEase;
  const categoryId = matchBenefitCategory(name);
  if (categoryId && categoryId in overrides) {
    return overrides[categoryId];
  }
  return originalUsageEase;
}
