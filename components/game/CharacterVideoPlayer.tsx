"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// 백엔드 API 기본 URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || "http://localhost:8000";

interface CharacterVideoPlayerProps {
  videoUrl: string | null;
  imageUrl: string | null;  // 비디오 로딩/에러 시 폴백 이미지
  expressionType: string;
  isPlaying?: boolean;
  onVideoEnd?: () => void;
  autoReturnToNeutral?: boolean;  // 재생 후 neutral로 자동 복귀
  neutralVideoUrl?: string | null;  // neutral 표정 비디오 URL
}

export default function CharacterVideoPlayer({
  videoUrl,
  imageUrl,
  expressionType,
  isPlaying = true,
  onVideoEnd,
  autoReturnToNeutral = true,
  neutralVideoUrl,
}: CharacterVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoError, setVideoError] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [currentExpression, setCurrentExpression] = useState(expressionType);

  // URL에 백엔드 기본 URL 추가
  const fullVideoUrl = useMemo(() => {
    if (!videoUrl) return null;
    if (videoUrl.startsWith('http')) return videoUrl;
    if (videoUrl.startsWith('/static')) return `${API_BASE_URL}${videoUrl}`;
    return videoUrl;
  }, [videoUrl]);

  const fullImageUrl = useMemo(() => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http')) return imageUrl;
    if (imageUrl.startsWith('/static')) return `${API_BASE_URL}${imageUrl}`;
    return imageUrl;
  }, [imageUrl]);

  const fullNeutralVideoUrl = useMemo(() => {
    if (!neutralVideoUrl) return null;
    if (neutralVideoUrl.startsWith('http')) return neutralVideoUrl;
    if (neutralVideoUrl.startsWith('/static')) return `${API_BASE_URL}${neutralVideoUrl}`;
    return neutralVideoUrl;
  }, [neutralVideoUrl]);

  // Reset states when videoUrl changes
  useEffect(() => {
    setVideoError(false);
    setIsVideoLoading(true);
    setCurrentExpression(expressionType);
  }, [videoUrl, expressionType]);

  // Handle video playback
  useEffect(() => {
    if (videoRef.current && fullVideoUrl && isPlaying) {
      videoRef.current.play().catch((err) => {
        console.error("[CharacterVideoPlayer] Video play error:", err);
        setVideoError(true);
      });
    }
  }, [fullVideoUrl, isPlaying]);

  const handleVideoEnd = useCallback(() => {
    if (autoReturnToNeutral && fullNeutralVideoUrl && expressionType !== "neutral") {
      // 감정 애니메이션 재생 후 neutral로 복귀
      setCurrentExpression("neutral");
      if (videoRef.current) {
        videoRef.current.src = fullNeutralVideoUrl;
        videoRef.current.loop = true;
        videoRef.current.play().catch(console.error);
      }
    }
    onVideoEnd?.();
  }, [autoReturnToNeutral, fullNeutralVideoUrl, expressionType, onVideoEnd]);

  const handleVideoLoaded = () => {
    setIsVideoLoading(false);
  };

  const handleVideoError = () => {
    console.error("[CharacterVideoPlayer] Video load error:", videoUrl);
    setVideoError(true);
    setIsVideoLoading(false);
  };

  // 비디오를 사용할 수 없는 경우 이미지 폴백
  const shouldShowImage = !fullVideoUrl || videoError;

  return (
    <div className="relative aspect-[3/4] bg-gradient-to-b from-pink-100 to-purple-100 rounded-2xl overflow-hidden shadow-lg">
      <AnimatePresence mode="wait">
        {shouldShowImage ? (
          // 이미지 폴백
          <motion.div
            key="image-fallback"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full"
          >
            {fullImageUrl ? (
              <img
                src={fullImageUrl}
                alt={`Character - ${currentExpression}`}
                className="w-full h-full object-cover object-top"
                onError={() => setVideoError(true)}
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
        ) : (
          // 비디오 플레이어
          <motion.div
            key="video-player"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full"
          >
            {isVideoLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-pink-200 to-purple-200 z-10">
                <div className="text-center">
                  <div className="animate-pulse text-6xl mb-2">💫</div>
                  <p className="text-gray-600 text-sm">로딩 중...</p>
                </div>
              </div>
            )}
            <video
              ref={videoRef}
              src={fullVideoUrl}
              className="w-full h-full object-cover object-top"
              loop={expressionType === "neutral"}
              muted
              playsInline
              onLoadedData={handleVideoLoaded}
              onError={handleVideoError}
              onEnded={handleVideoEnd}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expression indicator */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute bottom-3 right-3 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm"
      >
        <span className="text-sm font-medium text-gray-700">
          {getExpressionEmoji(currentExpression)} {getExpressionLabel(currentExpression)}
        </span>
      </motion.div>

      {/* Video/Image indicator */}
      <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full">
        <span className="text-xs text-white">
          {shouldShowImage ? "🖼️" : "🎬"}
        </span>
      </div>
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
