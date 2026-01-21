"use client";

import { motion } from "framer-motion";

interface EndingScreenProps {
  type: "happy_ending" | "sad_ending";
  affection: number;
  onRestart: () => void;
}

export default function EndingScreen({
  type,
  affection,
  onRestart,
}: EndingScreenProps) {
  const isHappy = type === "happy_ending";

  return (
    <main
      className={`min-h-screen flex items-center justify-center ${
        isHappy
          ? "bg-gradient-to-b from-pink-200 to-red-200"
          : "bg-gradient-to-b from-gray-200 to-blue-200"
      }`}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center p-8"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring" }}
          className="text-8xl mb-6"
        >
          {isHappy ? "💕" : "💔"}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className={`text-4xl font-bold mb-4 ${
            isHappy ? "text-pink-600" : "text-gray-600"
          }`}
        >
          {isHappy ? "HAPPY ENDING" : "SAD ENDING"}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-xl text-gray-700 mb-2"
        >
          {isHappy
            ? "축하합니다! 사랑이 이루어졌습니다!"
            : "아쉽게도 인연이 닿지 않았습니다..."}
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="text-gray-600 mb-8"
        >
          최종 호감도: {affection}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="space-x-4"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onRestart}
            className="px-8 py-3 bg-secondary text-white rounded-full font-semibold shadow-lg hover:bg-primary transition-colors"
          >
            다시 시작하기
          </motion.button>
        </motion.div>
      </motion.div>
    </main>
  );
}
