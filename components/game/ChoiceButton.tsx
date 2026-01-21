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
      className={`w-full p-4 text-left rounded-xl transition-all ${
        disabled
          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
          : "bg-white hover:bg-pink-50 text-gray-800 shadow-md hover:shadow-lg cursor-pointer"
      }`}
    >
      <span className="text-lg">{text}</span>
    </motion.button>
  );
}
