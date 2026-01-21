"use client";

import { motion, AnimatePresence } from "framer-motion";

interface CharacterExpressionProps {
  imageUrl: string | null;
  expressionType: string;
  isTransitioning?: boolean;
}

export default function CharacterExpression({
  imageUrl,
  expressionType,
  isTransitioning = false,
}: CharacterExpressionProps) {
  return (
    <div className="relative aspect-[4/3] bg-gradient-to-b from-pink-100 to-purple-100 rounded-2xl overflow-hidden shadow-lg">
      <AnimatePresence mode="wait">
        <motion.div
          key={imageUrl || "placeholder"}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="w-full h-full"
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={`Character - ${expressionType}`}
              className={`w-full h-full object-cover transition-all duration-300 ${
                isTransitioning ? "blur-sm" : ""
              }`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-6xl animate-pulse">💕</div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Expression indicator */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute bottom-3 right-3 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm"
      >
        <span className="text-sm font-medium text-gray-700">
          {getExpressionEmoji(expressionType)} {getExpressionLabel(expressionType)}
        </span>
      </motion.div>
    </div>
  );
}

function getExpressionEmoji(expression: string): string {
  const emojis: Record<string, string> = {
    neutral: "😊",
    happy: "😄",
    sad: "😢",
    jealous: "😤",
    shy: "😳",
    excited: "🥰",
  };
  return emojis[expression] || "😊";
}

function getExpressionLabel(expression: string): string {
  const labels: Record<string, string> = {
    neutral: "평온",
    happy: "기쁨",
    sad: "슬픔",
    jealous: "질투",
    shy: "수줍음",
    excited: "설렘",
  };
  return labels[expression] || "평온";
}

// Utility function to determine expression from delta
export function getExpressionFromDelta(delta: number): string {
  if (delta >= 8) return "excited";
  if (delta >= 4) return "happy";
  if (delta >= 0) return "neutral";
  if (delta >= -4) return "sad";
  return "jealous";
}
