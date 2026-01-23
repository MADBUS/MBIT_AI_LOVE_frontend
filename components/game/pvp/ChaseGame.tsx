"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ChaseGameProps {
  isHost: boolean;
  partnerGender: "male" | "female";
  opponentPosition: number;
  opponentHits: number;
  onPositionChange: (position: number) => void;
  onHit: () => void;
  onResult: (won: boolean) => void;
  obstacles: { id: number; lane: number; x: number }[];
}

interface Obstacle {
  id: number;
  lane: number;
  x: number;
  type: string;
}

const LANES = [0, 1, 2];
const MAX_HITS = 3;
const OBSTACLE_TYPES = ["💣", "🪨", "📦", "🌵", "⚡", "🔥"];

export default function ChaseGame({
  isHost,
  partnerGender,
  opponentPosition,
  opponentHits,
  onPositionChange,
  onHit,
  onResult,
}: ChaseGameProps) {
  const [phase, setPhase] = useState<"intro" | "playing" | "result">("intro");
  const [myPosition, setMyPosition] = useState(1);
  const [myHits, setMyHits] = useState(0);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [hitCooldown, setHitCooldown] = useState(false);
  const [flashRed, setFlashRed] = useState(false);
  const obstacleIdRef = useRef(0);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const hitObstaclesRef = useRef<Set<number>>(new Set());

  // 난이도 계산
  const getDifficulty = useCallback(() => {
    const level = Math.min(5, Math.floor(elapsedTime / 8) + 1);
    return {
      level,
      obstacleSpeed: 3 + level * 0.8,
      spawnInterval: Math.max(350, 700 - level * 70),
      spawnChance: Math.min(0.95, 0.6 + level * 0.07),
    };
  }, [elapsedTime]);

  // 인트로 후 게임 시작
  useEffect(() => {
    const timer = setTimeout(() => {
      setPhase("playing");
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // 경과 시간
  useEffect(() => {
    if (phase !== "playing" || isGameOver) return;

    const timer = setInterval(() => {
      setElapsedTime((t) => t + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, isGameOver]);

  // 장애물 생성 - 양쪽 클라이언트 모두 생성
  useEffect(() => {
    if (phase !== "playing" || isGameOver) return;

    const difficulty = getDifficulty();

    const spawnObstacle = () => {
      const newObstacle: Obstacle = {
        id: obstacleIdRef.current++,
        lane: Math.floor(Math.random() * 3),
        x: 105,
        type: OBSTACLE_TYPES[Math.floor(Math.random() * OBSTACLE_TYPES.length)],
      };
      setObstacles((prev) => [...prev, newObstacle]);
    };

    const timer = setInterval(() => {
      if (Math.random() < difficulty.spawnChance) {
        spawnObstacle();
        // 고난이도에서 추가 장애물
        if (difficulty.level >= 3 && Math.random() > 0.5) {
          setTimeout(() => {
            const lane = Math.floor(Math.random() * 3);
            setObstacles((prev) => [
              ...prev,
              {
                id: obstacleIdRef.current++,
                lane,
                x: 105,
                type: OBSTACLE_TYPES[Math.floor(Math.random() * OBSTACLE_TYPES.length)],
              },
            ]);
          }, 150);
        }
      }
    }, difficulty.spawnInterval);

    return () => clearInterval(timer);
  }, [phase, isGameOver, getDifficulty]);

  // 장애물 이동 및 충돌
  useEffect(() => {
    if (phase !== "playing" || isGameOver) return;

    const difficulty = getDifficulty();

    const moveObstacles = () => {
      setObstacles((prev) => {
        const updated = prev
          .map((obs) => ({ ...obs, x: obs.x - difficulty.obstacleSpeed }))
          .filter((obs) => obs.x > -15);

        // 충돌 체크
        if (!hitCooldown) {
          for (const obs of updated) {
            if (
              obs.x >= 8 &&
              obs.x <= 22 &&
              obs.lane === myPosition &&
              !hitObstaclesRef.current.has(obs.id)
            ) {
              hitObstaclesRef.current.add(obs.id);
              setHitCooldown(true);
              setFlashRed(true);

              setMyHits((h) => {
                const newHits = h + 1;
                onHit();
                if (newHits >= MAX_HITS) {
                  setIsGameOver(true);
                  setPhase("result");
                  onResult(false);
                }
                return newHits;
              });

              setTimeout(() => setFlashRed(false), 200);
              setTimeout(() => setHitCooldown(false), 600);
              break;
            }
          }
        }

        return updated;
      });
    };

    gameLoopRef.current = setInterval(moveObstacles, 40);
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [phase, myPosition, isGameOver, hitCooldown, onHit, onResult, getDifficulty]);

  // 키보드
  useEffect(() => {
    if (phase !== "playing" || isGameOver) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "ArrowUp") {
        e.preventDefault();
        setMyPosition((p) => {
          const newPos = Math.max(0, p - 1);
          onPositionChange(newPos);
          return newPos;
        });
      }
      if (e.code === "ArrowDown") {
        e.preventDefault();
        setMyPosition((p) => {
          const newPos = Math.min(2, p + 1);
          onPositionChange(newPos);
          return newPos;
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [phase, isGameOver, onPositionChange]);

  // 상대방 패배 체크
  useEffect(() => {
    if (opponentHits >= MAX_HITS && !isGameOver) {
      setIsGameOver(true);
      setPhase("result");
      onResult(true);
    }
  }, [opponentHits, isGameOver, onResult]);

  const getLaneY = (lane: number) => {
    return 20 + lane * 30; // 20%, 50%, 80%
  };

  const difficulty = getDifficulty();
  const partnerEmoji = partnerGender === "female" ? "👧" : "👦";

  return (
    <div className={`fixed inset-0 overflow-hidden z-50 transition-colors duration-200 ${
      flashRed ? "bg-red-900" : "bg-gradient-to-b from-sky-400 via-sky-300 to-green-400"
    }`}>
      {/* 배경 - 구름과 풍경 */}
      <div className="absolute inset-0">
        {/* 구름 */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={`cloud-${i}`}
            className="absolute text-white text-4xl opacity-80"
            style={{ top: `${5 + i * 8}%` }}
            animate={{ x: ["-10%", "110%"] }}
            transition={{
              duration: 8 + i * 2,
              repeat: Infinity,
              ease: "linear",
              delay: i * 1.5,
            }}
          >
            ☁️
          </motion.div>
        ))}

        {/* 잔디/땅 */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-green-600 to-green-500" />

        {/* 달리는 도로 효과 */}
        <div className="absolute bottom-16 left-0 right-0 h-[60%]">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={`road-${i}`}
              className="absolute h-0.5 bg-green-600/40"
              style={{ top: `${10 + i * 12}%`, width: "100%" }}
              animate={{ x: [0, -50] }}
              transition={{
                duration: 0.3 / (difficulty.level * 0.3 + 0.5),
                repeat: Infinity,
                ease: "linear",
              }}
            />
          ))}
        </div>
      </div>

      {/* 상단 UI */}
      <div className="absolute top-4 left-0 right-0 flex justify-between items-center px-6 z-20">
        <div className="bg-black/40 backdrop-blur-sm rounded-xl px-4 py-2 text-white">
          <span className="text-yellow-400 font-bold">⚡ Lv.{difficulty.level}</span>
          <span className="text-white/70 ml-2 text-sm">{elapsedTime}초</span>
        </div>

        <div className="bg-black/40 backdrop-blur-sm rounded-xl px-4 py-2">
          <span className="text-2xl">🏃</span>
          <span className="text-white font-bold ml-2">나잡아봐라!</span>
        </div>

        <div className="flex gap-3">
          <div className={`bg-blue-500/80 backdrop-blur-sm rounded-xl px-3 py-2 ${hitCooldown ? "animate-pulse" : ""}`}>
            <span className="text-sm text-blue-100">나</span>
            <div className="flex gap-0.5 mt-1">
              {[...Array(MAX_HITS)].map((_, i) => (
                <span key={i} className="text-lg">
                  {i < MAX_HITS - myHits ? "❤️" : "🖤"}
                </span>
              ))}
            </div>
          </div>
          <div className="bg-red-500/80 backdrop-blur-sm rounded-xl px-3 py-2">
            <span className="text-sm text-red-100">상대</span>
            <div className="flex gap-0.5 mt-1">
              {[...Array(MAX_HITS)].map((_, i) => (
                <span key={i} className="text-lg">
                  {i < MAX_HITS - opponentHits ? "❤️" : "🖤"}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 인트로 */}
      <AnimatePresence>
        {phase === "intro" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.5 }}
            className="absolute inset-0 flex items-center justify-center z-30 bg-black/50"
          >
            <div className="text-center">
              <motion.div
                animate={{ x: [-20, 20, -20] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="text-8xl mb-6"
              >
                🏃💨
              </motion.div>
              <h2 className="text-4xl font-bold text-white mb-3 drop-shadow-lg">
                나잡아봐라!
              </h2>
              <p className="text-xl text-yellow-300 mb-2">
                ↑ ↓ 방향키로 장애물을 피하세요!
              </p>
              <p className="text-lg text-red-300">
                3번 맞으면 탈락!
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 게임 영역 */}
      {phase !== "intro" && (
        <div className="absolute inset-0 pt-24 pb-20">
          {/* 레인 표시 */}
          {LANES.map((lane) => (
            <div
              key={lane}
              className="absolute left-0 right-0 h-[28%] border-y border-white/20"
              style={{ top: `${8 + lane * 30}%` }}
            >
              {/* 레인 화살표 가이드 */}
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-2xl">
                {lane === 0 ? "⬆" : lane === 2 ? "⬇" : "●"}
              </div>
            </div>
          ))}

          {/* 파트너 캐릭터 (앞에서 뜀) */}
          <motion.div
            animate={{
              y: [0, -15, 0],
              x: [0, 5, 0, -5, 0],
            }}
            transition={{
              y: { duration: 0.35, repeat: Infinity },
              x: { duration: 0.7, repeat: Infinity },
            }}
            className="absolute right-[15%] text-6xl"
            style={{ top: "35%" }}
          >
            <div className="relative">
              <span className="transform scale-x-[-1] inline-block drop-shadow-lg">
                {partnerEmoji}
              </span>
              <motion.span
                animate={{ opacity: [1, 0.5, 1], x: [-10, -20, -10] }}
                transition={{ duration: 0.3, repeat: Infinity }}
                className="absolute -left-6 top-1/2 -translate-y-1/2 text-3xl"
              >
                💨
              </motion.span>
              <motion.div
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 0.4, repeat: Infinity }}
                className="absolute -left-12 top-0 text-2xl"
              >
                ✋
              </motion.div>
            </div>
          </motion.div>

          {/* 내 캐릭터 */}
          <motion.div
            animate={{
              top: `${getLaneY(myPosition)}%`,
              x: hitCooldown ? [-8, 8, -8, 0] : 0,
              opacity: hitCooldown ? [1, 0.4, 1, 0.4, 1] : 1,
            }}
            transition={{
              top: { type: "spring", stiffness: 400, damping: 25 },
              x: { duration: 0.3 },
              opacity: { duration: 0.4 },
            }}
            className="absolute left-[12%]"
          >
            <div className="relative">
              <motion.span
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 0.3, repeat: Infinity }}
                className="text-5xl inline-block drop-shadow-lg"
              >
                🏃
              </motion.span>
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs px-3 py-1 rounded-full font-bold shadow-lg">
                나
              </div>
            </div>
          </motion.div>

          {/* 상대방 캐릭터 */}
          <motion.div
            animate={{ top: `${getLaneY(opponentPosition)}%` }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="absolute left-[18%]"
          >
            <div className="relative">
              <motion.span
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 0.3, repeat: Infinity, delay: 0.1 }}
                className="text-5xl inline-block opacity-60 drop-shadow-lg"
              >
                🏃
              </motion.span>
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-red-500 text-white text-xs px-3 py-1 rounded-full font-bold shadow-lg">
                상대
              </div>
            </div>
          </motion.div>

          {/* 장애물 */}
          <AnimatePresence>
            {obstacles.map((obs) => (
              <motion.div
                key={obs.id}
                initial={{ opacity: 1, scale: 1, rotate: 0 }}
                animate={{ rotate: [0, 10, -10, 0] }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ rotate: { duration: 0.3, repeat: Infinity } }}
                className="absolute"
                style={{
                  left: `${obs.x}%`,
                  top: `${getLaneY(obs.lane) + 5}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <span className="text-4xl drop-shadow-lg">{obs.type}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* 하단 조작 안내 */}
      {phase === "playing" && !isGameOver && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-6 left-0 right-0 text-center"
        >
          <div className="inline-block bg-black/50 backdrop-blur-sm rounded-2xl px-6 py-3">
            <p className="text-white text-lg">
              <span className="text-yellow-400 font-bold text-xl">↑ ↓</span>
              <span className="ml-2">방향키로 피하세요!</span>
            </p>
            <p className="text-orange-300 text-sm mt-1">
              ⚠️ 난이도가 점점 올라갑니다!
            </p>
          </div>
        </motion.div>
      )}

      {/* 결과 */}
      <AnimatePresence>
        {phase === "result" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/70 flex items-center justify-center z-40"
          >
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              className="text-center bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl p-10 border-4 border-yellow-400 shadow-2xl"
            >
              {myHits >= MAX_HITS ? (
                <>
                  <motion.div
                    animate={{ rotate: [0, -20, 20, 0], y: [0, 10, 0] }}
                    transition={{ duration: 0.5 }}
                    className="text-8xl mb-6"
                  >
                    😵
                  </motion.div>
                  <div className="text-red-400 text-4xl font-bold mb-3">
                    넘어졌습니다...
                  </div>
                  <p className="text-white/70 text-xl">
                    {elapsedTime}초 동안 버텼습니다
                  </p>
                </>
              ) : (
                <>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    className="text-8xl mb-6"
                  >
                    🎉
                  </motion.div>
                  <div className="text-green-400 text-4xl font-bold mb-3">
                    승리!
                  </div>
                  <p className="text-white/70 text-xl">
                    상대가 넘어졌습니다!
                  </p>
                  <p className="text-yellow-400 mt-2">
                    Lv.{difficulty.level}까지 도달!
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
