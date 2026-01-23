"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ShellGameProps {
  isHost: boolean; // 호스트 여부 (컵 섞기 결정권)
  opponentSelection: number | null; // 상대방이 현재 호버 중인 컵 (-1: 없음)
  opponentLocked: number | null; // 상대방이 확정한 컵
  onHover: (cupIndex: number | null) => void; // 호버 상태 전송
  onSelect: (cupIndex: number) => void; // 선택 확정
  onResult: (won: boolean) => void; // 결과 콜백
  correctCup: number; // 정답 컵 (서버에서 결정)
}

export default function ShellGame({
  isHost,
  opponentSelection,
  opponentLocked,
  onHover,
  onSelect,
  onResult,
  correctCup,
}: ShellGameProps) {
  const [phase, setPhase] = useState<"intro" | "shuffle" | "select" | "reveal" | "result">("intro");
  const [cupPositions, setCupPositions] = useState([0, 1, 2]); // 컵 위치
  const [myHover, setMyHover] = useState<number | null>(null);
  const [myLocked, setMyLocked] = useState<number | null>(null);
  const [shuffleCount, setShuffleCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [showHeart, setShowHeart] = useState(false);

  // 인트로 후 셔플 시작
  useEffect(() => {
    const timer = setTimeout(() => {
      setPhase("shuffle");
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // 셔플 애니메이션
  useEffect(() => {
    if (phase !== "shuffle") return;

    if (shuffleCount >= 8) {
      // 셔플 완료, 선택 페이즈로
      setTimeout(() => setPhase("select"), 500);
      return;
    }

    const timer = setTimeout(() => {
      // 랜덤하게 두 컵 위치 교환
      setCupPositions((prev) => {
        const newPos = [...prev];
        const i = Math.floor(Math.random() * 3);
        const j = (i + 1 + Math.floor(Math.random() * 2)) % 3;
        [newPos[i], newPos[j]] = [newPos[j], newPos[i]];
        return newPos;
      });
      setShuffleCount((c) => c + 1);
    }, 400);

    return () => clearTimeout(timer);
  }, [phase, shuffleCount]);

  // 선택 타이머
  useEffect(() => {
    if (phase !== "select") return;

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          // 시간 초과 - 선택 안했으면 랜덤 선택
          if (myLocked === null) {
            const randomCup = Math.floor(Math.random() * 3);
            setMyLocked(randomCup);
            onSelect(randomCup);
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, myLocked, onSelect]);

  // 둘 다 선택 완료시 결과 공개
  useEffect(() => {
    if (phase !== "select") return;
    if (myLocked !== null && opponentLocked !== null) {
      setTimeout(() => {
        setPhase("reveal");
        setShowHeart(true);
      }, 1000);
    }
  }, [phase, myLocked, opponentLocked]);

  // 결과 판정
  useEffect(() => {
    if (phase !== "reveal") return;

    const timer = setTimeout(() => {
      setPhase("result");
      // 정답 컵을 선택했는지 확인
      const iWon = myLocked === correctCup;
      const opponentWon = opponentLocked === correctCup;

      // 나만 맞춤 -> 승리
      // 상대만 맞춤 -> 패배
      // 둘 다 맞춤 -> 먼저 선택한 사람 승리 (여기서는 동점 처리)
      // 둘 다 틀림 -> 재도전 (onResult에서 처리)
      if (iWon && !opponentWon) {
        onResult(true);
      } else if (!iWon && opponentWon) {
        onResult(false);
      } else if (iWon && opponentWon) {
        // 둘 다 맞춤 - 호스트 승리
        onResult(isHost);
      } else {
        // 둘 다 틀림 - 무승부/재도전
        onResult(false); // 일단 패배 처리, 상위에서 재도전 로직
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [phase, myLocked, opponentLocked, correctCup, isHost, onResult]);

  // 키보드 이벤트
  useEffect(() => {
    if (phase !== "select" || myLocked !== null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && myHover !== null) {
        // 상대가 이미 선택한 컵이 아닌 경우에만
        if (opponentLocked !== myHover) {
          setMyLocked(myHover);
          onSelect(myHover);
        }
      }
      // 방향키로 선택
      if (e.code === "ArrowLeft") {
        setMyHover((h) => (h === null ? 0 : Math.max(0, h - 1)));
      }
      if (e.code === "ArrowRight") {
        setMyHover((h) => (h === null ? 0 : Math.min(2, h + 1)));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [phase, myHover, myLocked, opponentLocked, onSelect]);

  // 호버 상태 전송
  useEffect(() => {
    onHover(myHover);
  }, [myHover, onHover]);

  // 컵 위치 계산
  const getCupStyle = (index: number) => {
    const position = cupPositions.indexOf(index);
    const xPositions = [-120, 0, 120];
    return {
      x: xPositions[position],
    };
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-amber-900 to-amber-950 flex flex-col items-center justify-center z-50">
      {/* 상단 정보 */}
      <div className="absolute top-4 left-0 right-0 flex justify-between px-8">
        <div className="text-white text-lg font-bold">
          {phase === "select" && `⏱️ ${timeLeft}초`}
        </div>
        <div className="text-yellow-400 text-lg font-bold">
          🎩 야바위
        </div>
      </div>

      {/* 인트로 */}
      <AnimatePresence>
        {phase === "intro" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.5 }}
            className="text-center"
          >
            <div className="text-6xl mb-4">💕</div>
            <h2 className="text-3xl font-bold text-white mb-2">하트를 찾아라!</h2>
            <p className="text-amber-200">3개의 컵 중 하트가 숨겨진 컵을 찾으세요</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 컵들 */}
      {phase !== "intro" && (
        <div className="relative h-48 flex items-center justify-center">
          {[0, 1, 2].map((cupIndex) => {
            const isMyHover = myHover === cupIndex;
            const isOpponentHover = opponentSelection === cupIndex;
            const isMyLocked = myLocked === cupIndex;
            const isOpponentLocked = opponentLocked === cupIndex;
            const isCorrect = cupIndex === correctCup;
            const isRevealed = phase === "reveal" || phase === "result";

            return (
              <motion.div
                key={cupIndex}
                animate={getCupStyle(cupIndex)}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="absolute"
              >
                {/* 컵 */}
                <motion.div
                  animate={{
                    y: isRevealed && isCorrect ? -60 : 0,
                    rotateY: isRevealed && isCorrect ? 180 : 0,
                  }}
                  transition={{ duration: 0.5 }}
                  onClick={() => {
                    if (phase === "select" && myLocked === null && opponentLocked !== cupIndex) {
                      setMyHover(cupIndex);
                    }
                  }}
                  onMouseEnter={() => {
                    if (phase === "select" && myLocked === null) {
                      setMyHover(cupIndex);
                    }
                  }}
                  className={`relative cursor-pointer transition-transform ${
                    phase === "select" && myLocked === null && opponentLocked !== cupIndex
                      ? "hover:scale-110"
                      : ""
                  }`}
                >
                  {/* 컵 이미지 */}
                  <div className={`text-8xl select-none ${
                    isOpponentLocked ? "opacity-50" : ""
                  }`}>
                    🎩
                  </div>

                  {/* 하트 (공개시) */}
                  {isRevealed && isCorrect && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-5xl"
                    >
                      💖
                    </motion.div>
                  )}

                  {/* 선택 표시 */}
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex gap-1">
                    {/* 내 호버 */}
                    {isMyHover && !isMyLocked && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full"
                      >
                        나
                      </motion.div>
                    )}
                    {/* 내 확정 */}
                    {isMyLocked && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-bold"
                      >
                        ✓ 나
                      </motion.div>
                    )}
                    {/* 상대 호버 */}
                    {isOpponentHover && !isOpponentLocked && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-500 text-white text-xs px-2 py-1 rounded-full"
                      >
                        상대
                      </motion.div>
                    )}
                    {/* 상대 확정 */}
                    {isOpponentLocked && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="bg-red-600 text-white text-xs px-2 py-1 rounded-full font-bold"
                      >
                        ✓ 상대
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* 조작 안내 */}
      {phase === "select" && myLocked === null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-8 text-center"
        >
          <p className="text-amber-200 mb-2">
            ← → 방향키로 선택, <span className="text-yellow-400 font-bold">SPACE</span>로 확정
          </p>
          <p className="text-amber-300/70 text-sm">
            상대가 확정한 컵은 선택할 수 없습니다!
          </p>
        </motion.div>
      )}

      {/* 대기 메시지 */}
      {phase === "select" && myLocked !== null && opponentLocked === null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-8 text-center"
        >
          <div className="animate-pulse text-yellow-400 text-lg">
            상대방의 선택을 기다리는 중...
          </div>
        </motion.div>
      )}

      {/* 결과 */}
      <AnimatePresence>
        {phase === "result" && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 text-center"
          >
            {myLocked === correctCup ? (
              <div className="text-green-400 text-2xl font-bold">
                🎉 정답! 하트를 찾았습니다!
              </div>
            ) : (
              <div className="text-red-400 text-2xl font-bold">
                😢 아쉽게도 틀렸습니다...
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
