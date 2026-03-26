"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Plane,
  DollarSign,
  ShieldCheck,
  TrendingDown,
  GraduationCap,
  CheckCircle,
} from "lucide-react";
import Button from "./Button";
import { CardPreferences } from "@/lib/types";
import { DEFAULT_CARD_PREFERENCES } from "@/lib/constants";
import {
  getStoredCardPreferences,
  setStoredCardPreferences,
} from "@/lib/clientStorage";

interface CardPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (preferences: CardPreferences) => void;
  initialPreferences?: CardPreferences;
}

const preferenceOptions = [
  {
    id: "travel" as const,
    icon: Plane,
    title: "Travel",
    description: "Experience higher quality travels",
    color: "blue" as const,
  },
  {
    id: "cashback" as const,
    icon: DollarSign,
    title: "Cashback",
    description: "Maximize money saving upon purchases",
    color: "green" as const,
  },
  {
    id: "no_annual_fee" as const,
    icon: ShieldCheck,
    title: "No Annual Fee",
    description: "No annual fees to worry about",
    color: "purple" as const,
  },
  {
    id: "low_interest" as const,
    icon: TrendingDown,
    title: "Low Interest Rate",
    description: "Save on interest charges",
    color: "yellow" as const,
  },
  {
    id: "beginner_friendly" as const,
    icon: GraduationCap,
    title: "Beginner Friendly",
    description: "Recommended for people with low to no credit scores",
    color: "pink" as const,
  },
];

const colorClasses = {
  blue: {
    bg: "bg-blue-50",
    hover: "hover:bg-blue-100",
    selected: "bg-blue-100 border-blue-500",
    icon: "text-blue-600",
  },
  green: {
    bg: "bg-green-50",
    hover: "hover:bg-green-100",
    selected: "bg-green-100 border-green-500",
    icon: "text-green-600",
  },
  purple: {
    bg: "bg-purple-50",
    hover: "hover:bg-purple-100",
    selected: "bg-purple-100 border-purple-500",
    icon: "text-purple-600",
  },
  yellow: {
    bg: "bg-yellow-50",
    hover: "hover:bg-yellow-100",
    selected: "bg-yellow-100 border-yellow-500",
    icon: "text-yellow-600",
  },
  pink: {
    bg: "bg-pink-50",
    hover: "hover:bg-pink-100",
    selected: "bg-pink-100 border-pink-500",
    icon: "text-pink-600",
  },
};

export default function CardPreferencesModal({
  isOpen,
  onClose,
  onSave,
  initialPreferences,
}: CardPreferencesModalProps) {
  const [preferences, setPreferences] = useState<CardPreferences>({
    ...DEFAULT_CARD_PREFERENCES,
  });

  // Initialize with saved preferences or defaults
  useEffect(() => {
    if (isOpen) {
      if (initialPreferences) {
        setPreferences(initialPreferences);
      } else {
        const saved = getStoredCardPreferences();
        if (saved) {
          setPreferences(saved);
        }
      }
    }
  }, [isOpen, initialPreferences]);

  const togglePreference = (key: keyof CardPreferences) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = () => {
    setStoredCardPreferences(preferences);
    onSave(preferences);
    onClose();
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 20 }}
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                What&apos;s Important to you in a Credit Card?
              </h2>
              <p className="text-sm text-gray-600">
                Select all that apply to get personalized recommendations
              </p>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(85vh-200px)]">
              <div className="grid md:grid-cols-2 gap-4">
                {preferenceOptions.map((option) => {
                  const isSelected = preferences[option.id];
                  const colors = colorClasses[option.color];
                  const IconComponent = option.icon;

                  return (
                    <motion.button
                      key={option.id}
                      onClick={() => togglePreference(option.id)}
                      className={`
                        relative text-left p-6 rounded-xl border-2 transition-all
                        ${
                          isSelected
                            ? colors.selected
                            : `${colors.bg} border-transparent ${colors.hover}`
                        }
                      `}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-3 right-3"
                        >
                          <CheckCircle size={24} className="text-green-600" />
                        </motion.div>
                      )}

                      <div className="mb-3">
                        <IconComponent size={32} className={colors.icon} />
                      </div>

                      <h3 className="font-semibold text-gray-900 mb-1">
                        {option.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {option.description}
                      </p>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <Button
                onClick={handleSkip}
                color="gray"
                variant="outline"
                className="px-6"
              >
                Skip for Now
              </Button>
              <Button onClick={handleSave} color="green" className="px-6">
                View Recommendations
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
