export const rewardCategories = [
  "travel",
  "hotels",
  "gas",
  "groceries",
  "drugstore",
  "online-shopping",
  "online-groceries",
  "dining",
  "wholesale-clubs",
  "general",
  "streaming",
] as const;

export type RewardCategory = (typeof rewardCategories)[number];
