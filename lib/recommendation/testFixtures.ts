import { CreditCardData, Transaction } from "./types";

export function makeCard(overrides: Partial<CreditCardData> = {}): CreditCardData {
  return {
    id: "test_card",
    name: "Test Card",
    institution_name: "Test Bank",
    annual_fee: 0,
    tags: [],
    rewards: {},
    credits: [],
    benefits: [],
    image: { src: "", alt: "" },
    ...overrides,
  };
}

export function makeTx(
  overrides: Partial<Transaction> & { transaction_id: string; amount: number },
): Transaction {
  return {
    account_id: "acc1",
    date: "2025-01-01",
    name: "Test",
    ...overrides,
  };
}
