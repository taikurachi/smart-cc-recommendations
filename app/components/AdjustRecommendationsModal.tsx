"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, RotateCcw } from "lucide-react";
import Button from "./Button";
import { BenefitMultipliers } from "@/lib/types";
import {
  BENEFIT_CATEGORIES,
  BENEFIT_GROUP_LABELS,
  BenefitGroup,
  getDefaultBenefitMultipliers,
} from "@/lib/recommendation/benefitDefaults";
import {
  getStoredBenefitMultipliers,
  setStoredBenefitMultipliers,
} from "@/lib/clientStorage";

interface AdjustRecommendationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (multipliers: BenefitMultipliers) => void;
  initialMultipliers?: BenefitMultipliers;
}

const GROUP_ORDER: BenefitGroup[] = ["insurance", "travel", "credits", "other"];

const GROUP_DESCRIPTIONS: Record<BenefitGroup, string> = {
  insurance:
    "Rarely claimed protections like cell phone, luggage, and purchase insurance.",
  travel: "Travel-related perks and fee waivers.",
  credits: "Statement credits and subscription benefits.",
  other: "Points, cashback, and miscellaneous perks.",
};

function SliderRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="text-sm text-gray-700 w-52 shrink-0">{label}</span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1 h-1.5 accent-blue-600 cursor-pointer"
      />
      <span className="text-xs font-mono text-gray-500 w-10 text-right tabular-nums">
        {(value * 100).toFixed(0)}%
      </span>
    </div>
  );
}

export default function AdjustRecommendationsModal({
  isOpen,
  onClose,
  onSave,
  initialMultipliers,
}: AdjustRecommendationsModalProps) {
  const [multipliers, setMultipliers] = useState<BenefitMultipliers>(
    getDefaultBenefitMultipliers(),
  );

  useEffect(() => {
    if (isOpen) {
      if (initialMultipliers) {
        setMultipliers({
          ...getDefaultBenefitMultipliers(),
          ...initialMultipliers,
        });
      } else {
        const saved = getStoredBenefitMultipliers();
        if (saved) {
          setMultipliers({ ...getDefaultBenefitMultipliers(), ...saved });
        } else {
          setMultipliers(getDefaultBenefitMultipliers());
        }
      }
    }
  }, [isOpen, initialMultipliers]);

  const handleSliderChange = useCallback((id: string, value: number) => {
    setMultipliers((prev) => ({ ...prev, [id]: value }));
  }, []);

  const handleResetDefaults = () => {
    setMultipliers(getDefaultBenefitMultipliers());
  };

  const handleSave = () => {
    setStoredBenefitMultipliers(multipliers);
    onSave(multipliers);
    onClose();
  };

  const categoriesByGroup = GROUP_ORDER.map((group) => ({
    group,
    label: BENEFIT_GROUP_LABELS[group],
    description: GROUP_DESCRIPTIONS[group],
    items: BENEFIT_CATEGORIES.filter((c) => c.group === group),
  }));

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="adjust-modal-backdrop"
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
            <div className="relative p-6 border-b border-gray-200 bg-gradient-to-r from-amber-50 to-orange-50">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Adjust Benefit Values
              </h2>
              <p className="text-sm text-gray-600">
                Control how much each benefit type contributes to card
                recommendations. Set to 0% for benefits you&apos;d never use.
              </p>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(85vh-200px)]">
              {categoriesByGroup.map(({ group, label, description, items }) => (
                <div key={group} className="mb-6 last:mb-0">
                  <div className="mb-2">
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                      {label}
                    </h3>
                    <p className="text-xs text-gray-500">{description}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg px-4 py-1 divide-y divide-gray-200">
                    {items.map((cat) => (
                      <SliderRow
                        key={cat.id}
                        label={cat.label}
                        value={multipliers[cat.id] ?? cat.defaultMultiplier}
                        onChange={(v) => handleSliderChange(cat.id, v)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={handleResetDefaults}
                className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                <RotateCcw size={14} />
                Reset to Defaults
              </button>
              <div className="flex gap-3">
                <Button
                  onClick={onClose}
                  color="gray"
                  variant="outline"
                  className="px-6"
                >
                  Cancel
                </Button>
                <Button onClick={handleSave} color="green" className="px-6">
                  Save &amp; Recalculate
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
