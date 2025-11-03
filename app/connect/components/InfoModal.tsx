"use client";
import { AnimatePresence, motion } from "motion/react";
import { Check, X } from "lucide-react";

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InfoModal({ isOpen, onClose }: InfoModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="modal"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          className="absolute top-0 left-0 right-0 bottom-0 m-2 bg-gray-200 rounded-lg p-6 z-10"
        >
          <div className="flex items-center">
            <h4 className="font-bold text-2xl">CSV Parsing Info</h4>
            <X
              className="ml-auto hover:scale-110 cursor-pointer"
              onClick={onClose}
            />
          </div>

          <ul className="mt-6 space-y-2">
            <li className="flex gap-2 items-center">
              <Check className="text-green-600" size={15} />
              <p>Text format should be in &quot;.csv&quot;</p>
            </li>
            <li className="flex gap-2 items-center">
              <Check className="text-green-600" size={15} />
              <p>You can upload multiple files</p>
            </li>
            <li className="flex gap-2 items-center">
              <Check className="text-green-600" size={15} />
              <p>Manually select credit cards after</p>
            </li>
          </ul>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

