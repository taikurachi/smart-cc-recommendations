"use client";

import { CreditCardWithValue } from "@/lib/recommendation/types";
import { INTRO_BONUS_KEY } from "@/lib/recommendation/constants";

function formatCategory(category: string): string {
  return category
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDollar(value: number): string {
  return `$${Math.ceil(value).toLocaleString()}`;
}

function formatRate(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

function CardBreakdown({ card }: { card: CreditCardWithValue }) {
  const allocations = (card.allocation ?? [])
    .filter((a) => a.rewardValue > 0)
    .sort((a, b) => b.rewardValue - a.rewardValue);

  const credits = (card.credits ?? []).filter(
    (c) => c.value > 0 && c.usage_ease > 0,
  );

  const benefits = (card.benefits ?? []).filter(
    (b) => b.name !== INTRO_BONUS_KEY && b.value > 0 && b.usage_ease > 0,
  );

  return (
    <div className="bg-gray-light rounded-lg p-5">
      <h4 className="font-bold text-xl mb-1">{card.name}</h4>
      <p className="text-sm opacity-60 mb-4">{card.institution_name}</p>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-300 text-left">
            <th className="pb-2 font-semibold">Component</th>
            <th className="pb-2 font-semibold text-right">Details</th>
            <th className="pb-2 font-semibold text-right">Value</th>
          </tr>
        </thead>
        <tbody>
          {allocations.length > 0 && (
            <>
              <tr>
                <td
                  colSpan={3}
                  className="pt-3 pb-1 font-semibold text-xs uppercase tracking-wide opacity-50"
                >
                  Rewards by Category
                </td>
              </tr>
              {allocations.map((alloc) => (
                <tr key={alloc.category} className="border-b border-gray-200">
                  <td className="py-1.5 pl-3">
                    {formatCategory(alloc.category)}
                  </td>
                  <td className="py-1.5 text-right opacity-60">
                    {formatRate(alloc.rewardRate)} on{" "}
                    {formatDollar(alloc.amount)}
                  </td>
                  <td className="py-1.5 text-right amount">
                    {formatDollar(alloc.rewardValue)}
                  </td>
                </tr>
              ))}
              <tr className="border-b border-gray-300">
                <td className="py-2 font-semibold">Est. Rewards Subtotal</td>
                <td />
                <td className="py-2 text-right font-semibold amount">
                  {formatDollar(card.estimatedRewards)}
                </td>
              </tr>
            </>
          )}

          {credits.length > 0 && (
            <>
              <tr>
                <td
                  colSpan={3}
                  className="pt-3 pb-1 font-semibold text-xs uppercase tracking-wide opacity-50"
                >
                  Credits
                </td>
              </tr>
              {credits.map((credit) => (
                <tr key={credit.name} className="border-b border-gray-200">
                  <td className="py-1.5 pl-3">{formatCategory(credit.name)}</td>
                  <td className="py-1.5 text-right opacity-60">
                    {formatDollar(credit.value)} &times;{" "}
                    {Math.round(credit.usage_ease * 100)}% usability
                  </td>
                  <td className="py-1.5 text-right amount">
                    {formatDollar(credit.value * credit.usage_ease)}
                  </td>
                </tr>
              ))}
              <tr className="border-b border-gray-300">
                <td className="py-2 font-semibold">Credits Subtotal</td>
                <td />
                <td className="py-2 text-right font-semibold amount">
                  {formatDollar(card.creditsValue)}
                </td>
              </tr>
            </>
          )}

          {benefits.length > 0 && (
            <>
              <tr>
                <td
                  colSpan={3}
                  className="pt-3 pb-1 font-semibold text-xs uppercase tracking-wide opacity-50"
                >
                  Benefits
                </td>
              </tr>
              {benefits.map((benefit) => (
                <tr key={benefit.name} className="border-b border-gray-200">
                  <td className="py-1.5 pl-3">
                    {formatCategory(benefit.name)}
                  </td>
                  <td className="py-1.5 text-right opacity-60">
                    {formatDollar(benefit.value)} &times;{" "}
                    {Math.round(benefit.usage_ease * 100)}% usability
                  </td>
                  <td className="py-1.5 text-right amount">
                    {formatDollar(benefit.value * benefit.usage_ease)}
                  </td>
                </tr>
              ))}
              <tr className="border-b border-gray-300">
                <td className="py-2 font-semibold">Benefits Subtotal</td>
                <td />
                <td className="py-2 text-right font-semibold amount">
                  {formatDollar(card.benefitsValue)}
                </td>
              </tr>
            </>
          )}

          <tr className="border-b border-gray-300">
            <td className="py-2 font-bold">Total Rewards</td>
            <td />
            <td className="py-2 text-right font-bold amount">
              {formatDollar(card.totalRewards)}
            </td>
          </tr>
          <tr className="border-b border-gray-300">
            <td className="py-2">Annual Fee</td>
            <td />
            <td className="py-2 text-right amount text-red-500">
              &minus;{formatDollar(card.annual_fee)}
            </td>
          </tr>
          <tr>
            <td className="pt-3 font-bold text-base">Annual Value</td>
            <td />
            <td className="pt-3 text-right font-bold text-base text-green amount">
              {formatDollar(card.annualValue)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

interface CardAnalysisTableProps {
  cards: CreditCardWithValue[];
}

export default function CardAnalysisTable({ cards }: CardAnalysisTableProps) {
  if (cards.length === 0) return null;

  return (
    <div className="mt-8">
      <h3 className="text-2xl font-bold text-gray-900 mb-4">
        Deep Analysis
      </h3>
      <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${Math.min(cards.length, 3)}, 1fr)` }}>
        {cards.map((card) => (
          <CardBreakdown key={card.id} card={card} />
        ))}
      </div>
    </div>
  );
}
