"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

// 백엔드 API 기본 URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || "http://localhost:8000";

interface CharacterVideoPlayerProps {
  videoUrl: string | null;  // 미사용 (API 호환성 유지)
  imageUrl: string | null;
  expressionType: string;
  isPlaying?: boolean;  // 미사용 (API 호환성 유지)
  onVideoEnd?: () => void;  // 미사용 (API 호환성 유지)
  autoReturnToNeutral?: boolean;  // 미사용 (API 호환성 유지)
  neutralVideoUrl?: string | null;  // 미사용 (API 호환성 유지)
}

/**
 * 캐릭터 표정 이미지 표시 컴포넌트
 * Note: 비디오 기능은 API 부하로 인해 비활성화됨 (이미지만 표시)
 */
export default function CharacterVideoPlayer({
  imageUrl,
  expressionType,
}: CharacterVideoPlayerProps) {
  // URL에 백엔드 기본 URL 추가
  const fullImageUrl = useMemo(() => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http')) return imageUrl;
    if (imageUrl.startsWith('/static')) return `${API_BASE_URL}${imageUrl}`;
    return imageUrl;
  }, [imageUrl]);

  return (
    <div className="relative aspect-[3/4] bg-gradient-to-b from-pink-100 to-purple-100 rounded-2xl overflow-hidden shadow-lg">
      <motion.div
        key={`image-${expressionType}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full h-full"
      >
        {fullImageUrl ? (
          <img
            src={fullImageUrl}
            alt={`Character - ${expressionType}`}
            className="w-full h-full object-cover object-top"
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
    disgusted: "😖",
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
    disgusted: "극혐",
  };
  return labels[expression] || "평온";
}
