"use client";

import { CreditCardOwned, CreditCardRecommendation } from "@/lib/types";
import Image from "next/image";
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
    <div className="bg-gray-light w-full p-6 rounded-lg">
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
      <div>
        <Image
          className="rounded-lg"
          src={currentCard?.image?.src || "/default-credit.svg"}
          alt={currentCard?.image?.alt || "Default value"}
          width={300}
          height={200}
        />
      </div>
    </div>
  );
}
