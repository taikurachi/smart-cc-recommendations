"use client";

import { CreditCardOwned, CreditCardRecommendation } from "@/lib/types";
import { Plus } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { motion } from "motion/react";

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
      <div className="flex justify-between items-center">
        <div
          className="relative mt-4 flex-shrink-0"
          style={{ width: `${300 + (cards.length - 1) * 40}px` }}
        >
          {/* Spacer to maintain height based on image dimensions */}
          <div style={{ height: "200px", width: "300px" }} aria-hidden="true" />
          {cards.map((card, index) => (
            <Image
              onClick={() => setCurrentCardIndex(index)}
              key={card.name}
              className="rounded-lg absolute cursor-pointer top-0"
              style={{
                left: `${index * 40}px`,
                opacity: Math.max(0.3, 1 - index * 0.2),
                zIndex: cards.length - index,
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
        {/* Include table of contents here */}
        {status === "New" && null}
      </div>
      <div className="bg-white mt-4 rounded-lg p-4 flex flex-col">
        <div className="flex items-center justify-between">
          <p className="font-bold text-2xl">Annual Value</p>
          <span className="font-bold text-2xl text-green amount">$925</span>
        </div>
        <div className="opacity-70 flex justify-between items-center mt-4">
          <p>Estimated Rewards</p>
          <span className="amount">$1523</span>
        </div>
        <ul className="ml-4 opacity-40">
          {cards.map((card) => (
            <li className="flex items-center justify-between" key={card.name}>
              <span>{card.name}</span>
              <span className="amount ">$900</span>
            </li>
          ))}
        </ul>
        <div className="flex justify-between items-center mt-auto">
          <p>Annual Fee</p>
          <span className="amount">$95</span>
        </div>
      </div>
    </div>
  );
}
