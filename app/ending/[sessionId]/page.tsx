"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { api } from "@/lib/api";

interface GameData {
  id: string;
  affection: number;
  status: string;
  character_settings?: {
    gender: string;
    style: string;
    mbti: string;
  };
}

export default function EndingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const endingType = searchParams.get("type") || "sad_ending";

  const [gameData, setGameData] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGameData = async () => {
      try {
        const response = await api.get(`/games/${sessionId}`);
        setGameData(response.data);
      } catch (error) {
        console.error("Failed to load game data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadGameData();
  }, [sessionId]);

  const isHappy = endingType === "happy_ending";

  const handleRestart = () => {
    router.push("/characters");
  };

  const handleGoHome = () => {
    router.push("/mypage");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <main
      className={`min-h-screen flex items-center justify-center ${
        isHappy
          ? "bg-gradient-to-b from-pink-200 via-pink-300 to-red-200"
          : "bg-gradient-to-b from-gray-300 via-gray-400 to-blue-300"
      }`}
    >
      {/* 배경 파티클 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute text-3xl ${isHappy ? "opacity-30" : "opacity-20"}`}
            initial={{
              x: `${Math.random() * 100}%`,
              y: "110%",
            }}
            animate={{
              y: "-10%",
            }}
            transition={{
              duration: 5 + Math.random() * 5,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
          >
            {isHappy ? ["💕", "💗", "💖", "✨", "🌸"][i % 5] : ["💔", "🥀", "💧", "🍂", "🌧️"][i % 5]}
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center p-8 z-10"
      >
        {/* 메인 이모지 */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          className="text-9xl mb-8"
        >
          {isHappy ? "💕" : "💔"}
        </motion.div>

        {/* 엔딩 타이틀 */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className={`text-5xl font-bold mb-4 ${
            isHappy ? "text-pink-600" : "text-gray-600"
          }`}
        >
          {isHappy ? "HAPPY ENDING" : "SAD ENDING"}
        </motion.h1>

        {/* 서브 메시지 */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-xl text-gray-700 mb-3"
        >
          {isHappy
            ? "축하합니다! 사랑이 이루어졌습니다!"
            : "아쉽게도 인연이 닿지 않았습니다..."}
        </motion.p>

        {/* 캐릭터 정보 */}
        {gameData?.character_settings && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-gray-500 mb-2"
          >
            {gameData.character_settings.style} ({gameData.character_settings.mbti})
          </motion.p>
        )}

        {/* 최종 호감도 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.9 }}
          className={`inline-block px-6 py-3 rounded-full mb-8 ${
            isHappy ? "bg-pink-100 text-pink-700" : "bg-gray-200 text-gray-700"
          }`}
        >
          <span className="text-lg font-semibold">
            최종 호감도: {gameData?.affection ?? 0}%
          </span>
        </motion.div>

        {/* 버튼들 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRestart}
            className={`px-8 py-3 rounded-full font-semibold shadow-lg transition-colors ${
              isHappy
                ? "bg-pink-500 text-white hover:bg-pink-600"
                : "bg-gray-500 text-white hover:bg-gray-600"
            }`}
          >
            새 게임 시작
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleGoHome}
            className="px-8 py-3 bg-white text-gray-700 rounded-full font-semibold shadow-lg hover:bg-gray-100 transition-colors"
          >
            마이페이지
          </motion.button>
        </motion.div>
      </motion.div>
    </main>
  );
}
