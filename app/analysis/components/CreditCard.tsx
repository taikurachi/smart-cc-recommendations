"use client";

import { CreditCardOwned, CreditCardRecommendation } from "@/lib/types";
import { useState } from "react";

interface CreditCardProps {
  cards: CreditCardOwned[] | CreditCardRecommendation[];

  status: string;
}

export default function CreditCardComponent({
  cards,
  status,
}: CreditCardProps) {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const currentCard = cards[currentCardIndex];
  return (
    <div className="bg-gray-light">
      <h3>{currentCard.institution_name || "Undefined"}</h3>
      <h2 className="font-bold">{currentCard.name}</h2>
    </div>
  );
}
