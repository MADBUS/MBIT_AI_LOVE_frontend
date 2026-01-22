"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

// 백엔드 API 기본 URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || "http://localhost:8000";

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
  const [imageError, setImageError] = useState(false);

  // 이미지 URL에 백엔드 기본 URL 추가
  const fullImageUrl = useMemo(() => {
    if (!imageUrl) return null;
    // 이미 http로 시작하면 그대로 사용
    if (imageUrl.startsWith('http')) return imageUrl;
    // /static으로 시작하면 백엔드 URL 추가
    if (imageUrl.startsWith('/static')) return `${API_BASE_URL}${imageUrl}`;
    return imageUrl;
  }, [imageUrl]);

  // Reset error state when imageUrl changes
  useEffect(() => {
    setImageError(false);
    console.log("[CharacterExpression] imageUrl:", imageUrl);
    console.log("[CharacterExpression] fullImageUrl:", fullImageUrl);
  }, [imageUrl, fullImageUrl]);

  return (
    <div className="relative aspect-[4/3] bg-gradient-to-b from-pink-100 to-purple-100 rounded-2xl overflow-hidden shadow-lg">
      <AnimatePresence mode="wait">
        <motion.div
          key={fullImageUrl || "placeholder"}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="w-full h-full"
        >
          {fullImageUrl && !imageError ? (
            <img
              src={fullImageUrl}
              alt={`Character - ${expressionType}`}
              className={`w-full h-full object-cover transition-all duration-300 ${
                isTransitioning ? "blur-sm" : ""
              }`}
              onError={(e) => {
                console.error("[CharacterExpression] Image load error:", imageUrl, e);
                setImageError(true);
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-200 to-purple-200">
              <div className="text-center">
                <div className="text-8xl mb-4">💕</div>
                <p className="text-gray-600 text-sm">캐릭터 이미지</p>
              </div>
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
