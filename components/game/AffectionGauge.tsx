"use client";

import { motion, AnimatePresence } from "framer-motion";

interface AffectionGaugeProps {
  affection: number;
  change: number | null;
}

export default function AffectionGauge({
  affection,
  change,
}: AffectionGaugeProps) {
  const hearts = Math.floor(affection / 20);
  const emptyHearts = 5 - hearts;

  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      <div className="flex gap-1">
        {Array.from({ length: hearts }).map((_, i) => (
          <motion.span
            key={`filled-${i}`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-2xl"
          >
            ❤️
          </motion.span>
        ))}
        {Array.from({ length: emptyHearts }).map((_, i) => (
          <span key={`empty-${i}`} className="text-2xl opacity-30">
            🤍
          </span>
        ))}
      </div>

      <span className="text-gray-600 font-medium ml-2">({affection})</span>

      <AnimatePresence>
        {change !== null && (
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`font-bold ml-2 ${
              change > 0 ? "text-green-500" : "text-red-500"
            }`}
          >
            {change > 0 ? `+${change}` : change}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
