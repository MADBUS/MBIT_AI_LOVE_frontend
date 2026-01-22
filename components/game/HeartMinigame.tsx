"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface HeartMinigameProps {
  onComplete: (success: boolean) => void;
  targetCount?: number;
  timeLimit?: number;
}

interface Heart {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
}

export default function HeartMinigame({
  onComplete,
  targetCount = 10,
  timeLimit = 5,
}: HeartMinigameProps) {
  const [hearts, setHearts] = useState<Heart[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);

  // 하트 생성
  const spawnHeart = useCallback(() => {
    const newHeart: Heart = {
      id: Date.now() + Math.random(),
      x: Math.random() * 80 + 10, // 10% ~ 90%
      y: -10,
      size: Math.random() * 30 + 40, // 40px ~ 70px
      speed: Math.random() * 2 + 3, // 3 ~ 5 seconds
    };
    setHearts((prev) => [...prev, newHeart]);
  }, []);

  // 하트 클릭
  const handleHeartClick = (heartId: number) => {
    if (gameEnded) return;

    setHearts((prev) => prev.filter((h) => h.id !== heartId));
    setScore((prev) => {
      const newScore = prev + 1;
      if (newScore >= targetCount) {
        setGameEnded(true);
        onComplete(true);
      }
      return newScore;
    });
  };

  // 게임 시작
  const startGame = () => {
    setGameStarted(true);
    setScore(0);
    setTimeLeft(timeLimit);
    setHearts([]);
    setGameEnded(false);
  };

  // 타이머
  useEffect(() => {
    if (!gameStarted || gameEnded) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0.1) {
          setGameEnded(true);
          onComplete(score >= targetCount);
          return 0;
        }
        return prev - 0.1;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [gameStarted, gameEnded, score, targetCount, onComplete]);

  // 하트 스폰
  useEffect(() => {
    if (!gameStarted || gameEnded) return;

    const spawnInterval = setInterval(() => {
      spawnHeart();
    }, 400);

    return () => clearInterval(spawnInterval);
  }, [gameStarted, gameEnded, spawnHeart]);

  // 화면 밖으로 나간 하트 제거
  useEffect(() => {
    if (!gameStarted || gameEnded) return;

    const cleanupInterval = setInterval(() => {
      setHearts((prev) => prev.filter((h) => h.y < 120));
    }, 1000);

    return () => clearInterval(cleanupInterval);
  }, [gameStarted, gameEnded]);

  // 시작 화면
  if (!gameStarted) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl p-8 max-w-md mx-4 text-center"
        >
          <div className="text-6xl mb-4">💕</div>
          <h2 className="text-2xl font-bold text-pink-500 mb-4">
            특별 이벤트!
          </h2>
          <p className="text-gray-600 mb-2">
            {timeLimit}초 안에 하트를 {targetCount}개 터치하세요!
          </p>
          <p className="text-sm text-gray-400 mb-6">
            성공하면 호감도가 대폭 상승합니다!
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startGame}
            className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-8 py-3 rounded-full font-bold text-lg shadow-lg"
          >
            시작하기
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // 게임 화면
  return (
    <div className="fixed inset-0 bg-gradient-to-b from-pink-100 to-purple-200 z-50 overflow-hidden">
      {/* 상단 UI */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-white/80 backdrop-blur-sm">
        <div className="text-lg font-bold text-pink-500">
          💖 {score} / {targetCount}
        </div>
        <div className={`text-lg font-bold ${timeLeft <= 2 ? "text-red-500 animate-pulse" : "text-gray-700"}`}>
          ⏱️ {timeLeft.toFixed(1)}s
        </div>
      </div>

      {/* 진행 바 */}
      <div className="absolute top-16 left-4 right-4">
        <div className="h-3 bg-white/50 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-pink-500 to-rose-500"
            initial={{ width: "0%" }}
            animate={{ width: `${(score / targetCount) * 100}%` }}
            transition={{ type: "spring", stiffness: 300 }}
          />
        </div>
      </div>

      {/* 하트들 */}
      <AnimatePresence>
        {hearts.map((heart) => (
          <motion.button
            key={heart.id}
            initial={{ y: "-10%", x: `${heart.x}%`, opacity: 0, scale: 0 }}
            animate={{
              y: "110vh",
              opacity: 1,
              scale: 1,
              rotate: [0, 10, -10, 0],
            }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{
              y: { duration: heart.speed, ease: "linear" },
              opacity: { duration: 0.3 },
              scale: { duration: 0.3 },
              rotate: { duration: 1, repeat: Infinity },
            }}
            onClick={() => handleHeartClick(heart.id)}
            className="absolute cursor-pointer select-none"
            style={{
              fontSize: `${heart.size}px`,
              left: `${heart.x}%`,
              transform: "translateX(-50%)",
            }}
            whileTap={{ scale: 1.3 }}
          >
            💖
          </motion.button>
        ))}
      </AnimatePresence>

      {/* 게임 종료 오버레이 */}
      <AnimatePresence>
        {gameEnded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl p-8 text-center mx-4"
            >
              {score >= targetCount ? (
                <>
                  <div className="text-6xl mb-4">🎉</div>
                  <h2 className="text-2xl font-bold text-pink-500 mb-2">
                    성공!
                  </h2>
                  <p className="text-gray-600">
                    호감도가 대폭 상승합니다!
                  </p>
                </>
              ) : (
                <>
                  <div className="text-6xl mb-4">😢</div>
                  <h2 className="text-2xl font-bold text-gray-500 mb-2">
                    아쉬워요...
                  </h2>
                  <p className="text-gray-600">
                    다음 기회를 노려보세요!
                  </p>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
