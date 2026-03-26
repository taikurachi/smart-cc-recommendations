"use client";
import { useState } from "react";
import { usePlaidLink } from "react-plaid-link";

import Image from "next/image";
import Button from "@/app/components/Button";
import { AnimatePresence, motion } from "motion/react";
import { Check, Loader } from "lucide-react";
import { User } from "@/lib/types";
import {
  handleCreateLinkToken,
  handlePlaidSuccess,
  handlePlaidExit,
} from "@/lib/plaidHandlers";
import { useConfetti } from "../hooks/useConfetti";

interface PlaidConnectionCardProps {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  loadData: () => Promise<void>;
}

const buttonStates = [
  { title: "Connect", icon: null, bgColor: "purple" },
  {
    title: "Creating Token",
    icon: <Loader size={15} className="animate-spin" />,
    bgColor: "gray",
  },
  { title: "Success", icon: <Check size={15} />, bgColor: "green" },
];

export default function PlaidConnectionCard({
  user,
  setUser,
  loadData,
}: PlaidConnectionCardProps) {
  const [linkToken, setLinkToken] = useState("");
  const [plaidStateIndex, setPlaidStateIndex] = useState(0);
  const [buttonStateIndex, setButtonStateIndex] = useState(0);

  const { confettiCanvasRef, fireConfetti } = useConfetti();

  // Plaid Link hook
  const { open } = usePlaidLink({
    token: linkToken,
    onSuccess: async (public_token) => {
      await handlePlaidSuccess(
        public_token,
        user?.id,
        () => {}, // setLoading not needed here
        loadData
      );

      // Set connection method to 'plaid'
      localStorage.setItem("connectionMethod", "plaid");

      // Show success state and fire confetti
      setPlaidStateIndex(2);
      await fireConfetti(4000);

      // router.push("/analysis");
    },
    onExit: (err) => {
      handlePlaidExit(err);
    },
  });

  const plaidStates = [
    {
      title: "Connect with Plaid",
      description: (
        <div className="text-sm space-y-2">
          <div className="flex">
            <Check size={15} className="text-green-600" />
            <span className="font-semibold ml-2">Automatic sync</span> -
            Real-time transaction updates
          </div>
          <div className="flex">
            <Check size={15} className="text-green-600" />
            <span className="font-semibold ml-2">Bank-level security</span> -
            256-bit encryption
          </div>
          <div className="flex">
            <Check size={15} className="text-green-600" />
            <span className="font-semibold ml-2">Always up-to-date</span> - No
            manual imports needed
          </div>
          <div className="flex">
            <Check size={15} className="text-green-600" />
            <span className="font-semibold ml-2">Fast setup</span> - Connect in
            under 60 seconds
          </div>
        </div>
      ),
      action: (
        <Button
          onClick={async () => {
            setButtonStateIndex((prev) => prev + 1);
            const token = await handleCreateLinkToken(user, setUser);
            if (token) {
              setLinkToken(token);
              setButtonStateIndex((prev) => prev + 1);
            }

            await new Promise((resolve) => setTimeout(resolve, 1000));
            setPlaidStateIndex((prev) => prev + 1);
          }}
          color={buttonStates[buttonStateIndex].bgColor}
          className="overflow-hidden"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={buttonStateIndex}
              className="flex gap-2 items-center"
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -30, opacity: 0 }}
              transition={{ duration: 0.1, ease: "easeInOut" }}
            >
              {buttonStates[buttonStateIndex].title}{" "}
              {buttonStates[buttonStateIndex].icon}
            </motion.div>
          </AnimatePresence>
        </Button>
      ),
    },
    {
      title: "Connect Bank Account",
      description:
        "Click the button below to open Plaid's secure connection window. You'll select your bank and log in with your credentials.",
      action: <Button onClick={() => open()}>Connect Bank Account</Button>,
    },
    {
      title: "Success!🎉",
      description:
        "You've successfully connected your bank account! We're redirecting you to our dashboard now.",
      action: (
        <Image
          src={"/plaid-graphic.webp"}
          alt="plaid graphic image"
          width={180}
          height={180}
        />
      ),
    },
  ];

  return (
    <div
      className="bg-white border-2 rounded-xl p-8 transition-all duration-200 group relative overflow-hidden border-gray-200 hover:border-blue-400 hover:shadow-lg"
    >
      <canvas
        ref={confettiCanvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />
      <div className="flex flex-col gap-6 h-full relative z-10">
        <Image
          src="/plaid-logo.svg"
          height={100}
          width={100}
          alt="Plaid logo"
        />
        <AnimatePresence mode="wait">
          <motion.h3
            key={`title-${plaidStateIndex}`}
            className="text-xl font-bold"
            initial={{ filter: "blur(10px)", opacity: 0 }}
            animate={{ filter: "blur(0px)", opacity: 1 }}
            exit={{ filter: "blur(10px)", opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {plaidStates[plaidStateIndex].title}
          </motion.h3>
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div
            key={`description-${plaidStateIndex}`}
            initial={{ filter: "blur(10px)", opacity: 0 }}
            animate={{ filter: "blur(0px)", opacity: 1 }}
            exit={{ filter: "blur(10px)", opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            {plaidStates[plaidStateIndex].description}
          </motion.div>
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div
            className="mt-auto"
            key={`action-${plaidStateIndex}`}
            initial={{ filter: "blur(10px)", opacity: 0 }}
            animate={{ filter: "blur(0px)", opacity: 1 }}
            exit={{ filter: "blur(10px)", opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {plaidStates[plaidStateIndex].action}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
