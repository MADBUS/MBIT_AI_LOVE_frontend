"use client";

import { motion } from "framer-motion";

interface ChoiceButtonProps {
  text: string;
  onClick: () => void;
  disabled?: boolean;
}

export default function ChoiceButton({
  text,
  onClick,
  disabled,
}: ChoiceButtonProps) {
  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.02, x: 5 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={`w-full p-4 text-left rounded-xl transition-all border-2 ${
        disabled
          ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
          : "bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 text-gray-800 shadow-md hover:shadow-lg cursor-pointer border-purple-200 hover:border-purple-400"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center text-sm font-bold">
          ▶
        </span>
        <span className="text-lg">{text}</span>
      </div>
    </motion.button>
  );
}
