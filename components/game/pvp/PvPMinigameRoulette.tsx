"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type PvPMinigameType = "shell" | "chase" | "mashing";

interface PvPMinigameRouletteProps {
  targetGame: PvPMinigameType; // 서버에서 결정된 게임 타입
  onGameSelected: (gameType: PvPMinigameType) => void;
}

const MINIGAMES: { type: PvPMinigameType; name: string; icon: string; description: string }[] = [
  {
    type: "shell",
    name: "야바위",
    icon: "🎩",
    description: "3개의 컵 중 하트가 숨겨진 컵을 찾아라!",
  },
  {
    type: "chase",
    name: "나잡아봐라",
    icon: "🏃",
    description: "장애물을 피해 파트너를 쫓아가라!",
  },
  {
    type: "mashing",
    name: "심장 두근두근",
    icon: "💓",
    description: "스페이스바를 눌러 심장을 뛰게 하라!",
  },
];

export default function PvPMinigameRoulette({ targetGame, onGameSelected }: PvPMinigameRouletteProps) {
  const [spinning, setSpinning] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const spinCountRef = useRef(0);
  const hasCalledCallback = useRef(false);

  // 콜백을 ref로 저장하여 의존성에서 제거
  const onGameSelectedRef = useRef(onGameSelected);
  onGameSelectedRef.current = onGameSelected;

  // 서버에서 결정된 게임의 인덱스 찾기 (찾지 못하면 0)
  const targetIndex = Math.max(0, MINIGAMES.findIndex((g) => g.type === targetGame));

  // 룰렛 회전 효과
  useEffect(() => {
    if (!spinning) return;

    // 최소 15번 회전 후 targetIndex에서 멈춤
    const totalSpins = 15 + targetIndex;
    let delay = 80;

    const spin = () => {
      setCurrentIndex((prev) => (prev + 1) % MINIGAMES.length);
      spinCountRef.current++;

      // 점점 느려지다가 멈춤
      if (spinCountRef.current >= totalSpins) {
        setSpinning(false);
        setCurrentIndex(targetIndex);

        // 잠시 후 결과 표시
        setTimeout(() => {
          setShowResult(true);
          // 게임 선택 콜백 호출 (한 번만)
          setTimeout(() => {
            if (!hasCalledCallback.current) {
              hasCalledCallback.current = true;
              onGameSelectedRef.current(targetGame);
            }
          }, 1500);
        }, 500);
        return;
      }

      // 점점 느려지는 효과
      if (spinCountRef.current > 10) {
        delay = 80 + (spinCountRef.current - 10) * 40;
      }

      intervalRef.current = setTimeout(spin, delay);
    };

    intervalRef.current = setTimeout(spin, delay);

    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
    };
  }, [spinning, targetGame, targetIndex]);

  // currentIndex가 유효한지 확인
  const currentGame = MINIGAMES[currentIndex] || MINIGAMES[0];

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gradient-to-b from-purple-900 to-indigo-900 rounded-3xl p-8 max-w-md w-full mx-4 text-center border-4 border-yellow-400 shadow-2xl"
      >
        {/* 헤더 */}
        <motion.div
          animate={{ rotate: spinning ? [0, 10, -10, 0] : 0 }}
          transition={{ duration: 0.5, repeat: spinning ? Infinity : 0 }}
          className="text-4xl mb-4"
        >
          🎰
        </motion.div>
        <h2 className="text-2xl font-bold text-yellow-400 mb-6">
          {spinning ? "미니게임 선택 중..." : "게임 결정!"}
        </h2>

        {/* 룰렛 디스플레이 */}
        <div className="relative bg-black/50 rounded-2xl p-6 mb-6 overflow-hidden">
          {/* 선택 인디케이터 */}
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent" />

          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              transition={{ duration: 0.08 }}
              className="text-center"
            >
              <div className="text-6xl mb-3">{currentGame.icon}</div>
              <h3 className="text-2xl font-bold text-white mb-2">{currentGame.name}</h3>
              <p className="text-purple-200 text-sm">{currentGame.description}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 게임 아이콘들 (작은 표시) */}
        <div className="flex justify-center gap-4 mb-4">
          {MINIGAMES.map((game, idx) => (
            <motion.div
              key={game.type}
              animate={{
                scale: currentIndex === idx ? 1.3 : 1,
                opacity: currentIndex === idx ? 1 : 0.4,
              }}
              className={`text-2xl p-2 rounded-full ${
                currentIndex === idx ? "bg-yellow-400/30" : ""
              }`}
            >
              {game.icon}
            </motion.div>
          ))}
        </div>

        {/* 결과 메시지 */}
        <AnimatePresence>
          {showResult && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mt-4"
            >
              <p className="text-yellow-300 text-lg font-semibold">
                게임 시작합니다!
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
