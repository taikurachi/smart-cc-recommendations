"use client";

import { CreditCardWithValue } from "@/lib/recommendation/types";
import { Plus, ChevronDown, ChevronUp } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { motion } from "motion/react";

interface CreditCardProps {
  cards: CreditCardWithValue[];
  status: string;
}

export default function CreditCardComponent({
  cards,
  status,
}: CreditCardProps) {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const currentCard = cards[currentCardIndex];

  if (!currentCard) return <div>loading...</div>;

  const totalAnnualValue = cards.reduce(
    (sum, card) => sum + (card.annualValue || 0),
    0,
  );
  const totalRewards = cards.reduce(
    (sum, card) => sum + (card.totalRewards || 0),
    0,
  );
  const totalAnnualFees = cards.reduce(
    (sum, card) => sum + (card.annual_fee || 0),
    0,
  );

  const selectCard = (index: number) => {
    setCurrentCardIndex(index);
    setExpandedCards((prev) => {
      const newSet = new Set(prev);
      newSet.delete(index);
      return newSet;
    });
  };

  const toggleCard = (index: number) => {
    setExpandedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };
  return (
    <div className="bg-gray-light w-full p-6 rounded-lg flex flex-col">
      <div className="flex">
        <h3 className="text-lg">
          {currentCard.institution_name || "Undefined"}
        </h3>
        <span
          className={`ml-auto px-2 py-1 font-semibold rounded-lg ${
            status === "New" ? "bg-green-lighter" : "bg-red-light"
          }`}
        >
          {status}
        </span>
      </div>
      <h2 className="font-bold text-2xl">{currentCard.name}</h2>
      <div className="flex justify-between items-center">
        <div
          className="relative mt-4 flex-shrink-0"
          style={{ width: `${300 + (cards.length - 1) * 40}px` }}
        >
          <div style={{ height: "200px", width: "300px" }} aria-hidden="true" />
          {cards.map((card, index) => (
            <Image
              onClick={() => selectCard(index)}
              key={card.name}
              className="rounded-lg absolute cursor-pointer top-0 transition-all duration-300"
              style={{
                left: `${index * 40}px`,
                opacity: index === currentCardIndex ? 1 : Math.max(0.3, 1 - index * 0.2),
                zIndex: index === currentCardIndex ? cards.length + 1 : cards.length - index,
              }}
              src={card.image?.src || "/default-credit.svg"}
              alt={card.image?.alt || "Default value"}
              width={300}
              height={200}
            />
          ))}
        </div>
        {status === "Old" && (
          <motion.span>
            <Plus
              className="bg-gray rounded-full mr-4 p-2 cursor-pointer hover:scale-110 transition-transform"
              size={50}
            />
          </motion.span>
        )}
        {status === "New" && null}
      </div>
      <div className="bg-white mt-4 rounded-lg p-4 flex flex-col flex-1">
        <div className="flex items-center justify-between">
          <p className="font-bold text-2xl">
            {cards.length > 1 ? "Total " : ""}Annual Value
          </p>
          <span className="font-bold text-2xl text-green amount">
            ${Math.ceil(totalAnnualValue)}
          </span>
        </div>
        <div className="opacity-70 flex justify-between items-center mt-4">
          <p className="font-semibold">Est. Rewards</p>
          <span className="amount">${Math.ceil(totalRewards)}</span>
        </div>
        <div className="ml-4 mt-2 mb-4">
          {cards.map((card, index) => {
            const isExpanded = expandedCards.has(index);
            const cardTotalRewards = card.totalRewards || 0;

            const breakdownItems = [
              { name: "Benefits Bonus", key: "benefitsValue" as const },
              { name: "Credits Bonus", key: "creditsValue" as const },
              { name: "Rewards Value", key: "estimatedRewards" as const },
            ]
              .filter(({ key }) => card[key])
              .sort((a, b) => (card[b.key] || 0) - (card[a.key] || 0));

            return (
              <div key={index} className="mb-1">
                <button
                  onClick={() => toggleCard(index)}
                  className="flex items-center justify-between w-full text-left transition-opacity cursor-pointer"
                >
                  <div className="flex items-center gap-2 opacity-40">
                    <span className="font-semibold">{card.name}</span>
                    {isExpanded ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                  </div>

                  <span className="amount opacity-40">
                    ${Math.ceil(cardTotalRewards)}
                  </span>
                </button>
                {isExpanded && breakdownItems.length > 0 && (
                  <ul className="ml-6 mb-2">
                    {breakdownItems.map(({ name, key }) => (
                      <li
                        className="flex items-center justify-between opacity-20"
                        key={name}
                      >
                        <span className="font-semibold">{name}</span>
                        <span className="amount">
                          ${Math.ceil(card[key] || 0)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex justify-between items-center mt-auto">
          <p>Annual Fee</p>
          <span className="amount">${totalAnnualFees}</span>
        </div>
      </div>
    </div>
  );
}
