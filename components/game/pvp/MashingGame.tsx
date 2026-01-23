"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface MashingGameProps {
  isHost: boolean;
  opponentScore: number; // 상대방 스코어
  onScoreChange: (score: number) => void; // 내 스코어 전송
  onResult: (won: boolean) => void; // 결과 콜백
}

const TARGET_SCORE = 50; // 목표 점수
const GAME_DURATION = 10; // 10초

export default function MashingGame({
  isHost,
  opponentScore,
  onScoreChange,
  onResult,
}: MashingGameProps) {
  const [phase, setPhase] = useState<"intro" | "countdown" | "playing" | "result">("intro");
  const [myScore, setMyScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [countdown, setCountdown] = useState(3);
  const [heartScale, setHeartScale] = useState(1);
  const [showPressEffect, setShowPressEffect] = useState(false);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number }[]>([]);
  const particleIdRef = useRef(0);
  const lastScoreRef = useRef(0);

  // 인트로 후 카운트다운 시작
  useEffect(() => {
    const timer = setTimeout(() => {
      setPhase("countdown");
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // 카운트다운
  useEffect(() => {
    if (phase !== "countdown") return;

    if (countdown <= 0) {
      setPhase("playing");
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((c) => c - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [phase, countdown]);

  // 게임 타이머
  useEffect(() => {
    if (phase !== "playing") return;

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          // 시간 종료 - 점수 비교
          setPhase("result");
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase]);

  // 결과 판정
  useEffect(() => {
    if (phase !== "result") return;

    const timer = setTimeout(() => {
      // 점수 비교
      if (myScore > opponentScore) {
        onResult(true);
      } else if (myScore < opponentScore) {
        onResult(false);
      } else {
        // 동점 시 호스트 승리
        onResult(isHost);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [phase, myScore, opponentScore, isHost, onResult]);

  // 스코어 변경 시 서버 전송
  useEffect(() => {
    if (myScore !== lastScoreRef.current) {
      lastScoreRef.current = myScore;
      onScoreChange(myScore);
    }
  }, [myScore, onScoreChange]);

  // 키보드 이벤트
  useEffect(() => {
    if (phase !== "playing") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat) {
        e.preventDefault();

        // 점수 증가
        setMyScore((s) => Math.min(TARGET_SCORE, s + 1));

        // 하트 애니메이션
        setHeartScale(1.3);
        setTimeout(() => setHeartScale(1), 100);

        // 누름 효과
        setShowPressEffect(true);
        setTimeout(() => setShowPressEffect(false), 100);

        // 파티클 효과
        const newParticle = {
          id: particleIdRef.current++,
          x: 50 + (Math.random() - 0.5) * 30,
          y: 40 + (Math.random() - 0.5) * 20,
        };
        setParticles((p) => [...p, newParticle]);
        setTimeout(() => {
          setParticles((p) => p.filter((part) => part.id !== newParticle.id));
        }, 500);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [phase]);

  // 하트 펄스 애니메이션 (플레이 중)
  useEffect(() => {
    if (phase !== "playing") return;

    const interval = setInterval(() => {
      setHeartScale((s) => (s === 1 ? 1.05 : 1));
    }, 500);

    return () => clearInterval(interval);
  }, [phase]);

  // 진행도 계산
  const myProgress = (myScore / TARGET_SCORE) * 100;
  const opponentProgress = (opponentScore / TARGET_SCORE) * 100;

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-pink-900 via-red-900 to-pink-800 flex flex-col items-center justify-center z-50 overflow-hidden">
      {/* 배경 하트 파티클 */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-2xl opacity-20"
            initial={{
              x: `${Math.random() * 100}%`,
              y: "110%",
            }}
            animate={{
              y: "-10%",
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
          >
            💕
          </motion.div>
        ))}
      </div>

      {/* 상단 정보 */}
      <div className="absolute top-4 left-0 right-0 flex justify-between px-8 z-10">
        <div className="text-white text-lg font-bold">
          {phase === "playing" && `⏱️ ${timeLeft}초`}
        </div>
        <div className="text-pink-300 text-lg font-bold">
          💓 심장 두근두근
        </div>
        <div className="text-white text-lg font-bold">
          {phase === "playing" && `🎯 목표: ${TARGET_SCORE}`}
        </div>
      </div>

      {/* 인트로 */}
      <AnimatePresence>
        {phase === "intro" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.5 }}
            className="text-center z-20"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="text-6xl mb-4"
            >
              💓
            </motion.div>
            <h2 className="text-3xl font-bold text-white mb-2">심장 두근두근!</h2>
            <p className="text-pink-200">스페이스바를 연타해서 심장을 뛰게 하세요!</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 카운트다운 */}
      <AnimatePresence>
        {phase === "countdown" && (
          <motion.div
            key={countdown}
            initial={{ opacity: 0, scale: 2 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className="text-8xl font-bold text-white z-20"
          >
            {countdown === 0 ? "GO!" : countdown}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 게임 영역 */}
      {(phase === "playing" || phase === "result") && (
        <div className="relative flex flex-col items-center justify-center">
          {/* 중앙 하트 */}
          <motion.div
            animate={{ scale: heartScale }}
            className="relative mb-8"
          >
            <span className="text-[150px] select-none">💖</span>

            {/* 클릭 파티클 */}
            <AnimatePresence>
              {particles.map((p) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                  animate={{
                    opacity: 0,
                    scale: 0,
                    x: (Math.random() - 0.5) * 100,
                    y: -50 - Math.random() * 50,
                  }}
                  exit={{ opacity: 0 }}
                  className="absolute top-1/2 left-1/2 text-2xl pointer-events-none"
                >
                  {["💕", "💗", "💖", "✨"][Math.floor(Math.random() * 4)]}
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {/* 스코어 표시 */}
          <div className="flex gap-16 mb-8">
            {/* 내 스코어 */}
            <div className="text-center">
              <div className="text-blue-400 text-sm mb-2">나</div>
              <motion.div
                key={myScore}
                initial={{ scale: 1.5 }}
                animate={{ scale: 1 }}
                className="text-4xl font-bold text-white"
              >
                {myScore}
              </motion.div>
              {/* 프로그레스 바 */}
              <div className="w-32 h-4 bg-gray-700 rounded-full mt-2 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${myProgress}%` }}
                />
              </div>
            </div>

            {/* VS */}
            <div className="text-3xl font-bold text-yellow-400 self-center">VS</div>

            {/* 상대 스코어 */}
            <div className="text-center">
              <div className="text-red-400 text-sm mb-2">상대</div>
              <motion.div
                key={opponentScore}
                initial={{ scale: 1.5 }}
                animate={{ scale: 1 }}
                className="text-4xl font-bold text-white"
              >
                {opponentScore}
              </motion.div>
              {/* 프로그레스 바 */}
              <div className="w-32 h-4 bg-gray-700 rounded-full mt-2 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-red-500 to-red-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${opponentProgress}%` }}
                />
              </div>
            </div>
          </div>

          {/* 스페이스바 힌트 */}
          {phase === "playing" && (
            <motion.div
              animate={{
                scale: showPressEffect ? 0.95 : 1,
                backgroundColor: showPressEffect ? "#ec4899" : "#4b5563",
              }}
              className="px-12 py-4 rounded-xl text-white font-bold text-xl"
            >
              <span className="mr-2">⌨️</span>
              SPACE
            </motion.div>
          )}
        </div>
      )}

      {/* 조작 안내 */}
      {phase === "playing" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute bottom-8 text-center"
        >
          <p className="text-pink-200 text-lg">
            <span className="text-yellow-400 font-bold">SPACE</span>를 연타하세요!
          </p>
          <p className="text-pink-300/70 text-sm mt-1">
            더 빠르게! 더 강하게! 💓
          </p>
        </motion.div>
      )}

      {/* 결과 */}
      <AnimatePresence>
        {phase === "result" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/50 flex items-center justify-center z-30"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-center"
            >
              {myScore > opponentScore ? (
                <>
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    className="text-6xl mb-4"
                  >
                    🎉💖🎉
                  </motion.div>
                  <div className="text-green-400 text-3xl font-bold">
                    승리! 두근두근!
                  </div>
                  <p className="text-white/70 mt-2">
                    {myScore} vs {opponentScore}
                  </p>
                </>
              ) : myScore < opponentScore ? (
                <>
                  <div className="text-6xl mb-4">💔</div>
                  <div className="text-red-400 text-3xl font-bold">
                    패배... 심장이 멈췄어요
                  </div>
                  <p className="text-white/70 mt-2">
                    {myScore} vs {opponentScore}
                  </p>
                </>
              ) : (
                <>
                  <div className="text-6xl mb-4">🤝💕</div>
                  <div className="text-yellow-400 text-3xl font-bold">
                    무승부! 함께 뛴 심장!
                  </div>
                  <p className="text-white/70 mt-2">
                    {myScore} vs {opponentScore}
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
