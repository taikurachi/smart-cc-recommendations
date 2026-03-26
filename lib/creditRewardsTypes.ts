export const rewardCategories = [
  "travel",
  "hotels",
  "gas",
  "grocery",
  "drugstores",
  "online-shopping",
  "dining",
  "wholesale-clubs",
  "general",
  "streaming",
  "transit",
  "entertainment",
] as const;

export type RewardCategory = (typeof rewardCategories)[number];
