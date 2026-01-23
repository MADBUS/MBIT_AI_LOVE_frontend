"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePvPStore } from "@/store/usePvPStore";

interface PvPMatchingModalProps {
  sessionId: string;
  currentAffection: number;
  onMatchSuccess: (opponentSessionId: string, finalBet: number) => void;
  onTimeout: () => void;
  onClose: () => void;
}

export default function PvPMatchingModal({
  sessionId,
  currentAffection,
  onMatchSuccess,
  onTimeout,
  onClose,
}: PvPMatchingModalProps) {
  // 초기 "특별 이벤트 발생!" 문구 표시 상태
  const [showEventAnnounce, setShowEventAnnounce] = useState(true);
  const {
    status,
    betAmount,
    remainingSeconds,
    opponentSessionId,
    opponentBet,
    connect,
    disconnect,
    joinQueue,
    leaveQueue,
    setBetAmount,
    setRemainingSeconds,
    reset,
  } = usePvPStore();

  const [isJoining, setIsJoining] = useState(false);

  // 초기 "특별 이벤트 발생!" 문구를 2초 후 숨김
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowEventAnnounce(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // WebSocket 연결
  useEffect(() => {
    connect(sessionId);

    return () => {
      disconnect();
    };
  }, [sessionId, connect, disconnect]);

  // 30초 카운트다운 및 타임아웃 처리
  useEffect(() => {
    if (status !== "queue_joined" && status !== "matching") {
      return;
    }

    const interval = setInterval(() => {
      const newSeconds = remainingSeconds - 1;
      setRemainingSeconds(newSeconds);

      // 타임아웃: 0초가 되면 솔로 미니게임으로 전환
      if (newSeconds <= 0) {
        clearInterval(interval);
        // 매칭 큐에서 나가고 타임아웃 처리
        leaveQueue();
        onTimeout();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [status, remainingSeconds, setRemainingSeconds, leaveQueue, onTimeout]);

  // 매칭 성공 처리
  useEffect(() => {
    if (status === "matched" && opponentSessionId && opponentBet !== null) {
      const finalBet = Math.max(betAmount, opponentBet);
      onMatchSuccess(opponentSessionId, finalBet);
    }
  }, [status, opponentSessionId, opponentBet, betAmount, onMatchSuccess]);

  // 타임아웃 처리
  useEffect(() => {
    if (status === "timeout") {
      onTimeout();
    }
  }, [status, onTimeout]);

  // 연결 에러 시 자동으로 솔로 미니게임으로 전환 (3초 후)
  useEffect(() => {
    if (status === "error" || status === "disconnected") {
      const timer = setTimeout(() => {
        onTimeout();
      }, 2000); // 2초 후 자동 전환
      return () => clearTimeout(timer);
    }
  }, [status, onTimeout]);

  // 매칭 큐 참가
  const handleJoinQueue = useCallback(() => {
    if (betAmount > currentAffection) {
      alert("보유 호감도보다 높은 금액을 배팅할 수 없습니다.");
      return;
    }
    setIsJoining(true);
    joinQueue(betAmount);
  }, [betAmount, currentAffection, joinQueue]);

  // 매칭 취소
  const handleCancel = useCallback(() => {
    leaveQueue();
    setIsJoining(false);
  }, [leaveQueue]);

  // 닫기
  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  // 배팅 금액 변경
  const handleBetChange = (delta: number) => {
    const newBet = Math.max(1, Math.min(currentAffection, betAmount + delta));
    setBetAmount(newBet);
  };

  const isMatching = status === "queue_joined" || status === "matching";

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      {/* 특별 이벤트 발생 문구 (초기 2초) */}
      <AnimatePresence>
        {showEventAnnounce && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center z-60"
          >
            <div className="text-center">
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, -3, 3, 0]
                }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  repeatDelay: 0.5
                }}
                className="text-5xl mb-4"
              >
                ✨💕✨
              </motion.div>
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-pink-400 animate-pulse">
                특별 이벤트 발생!
              </h1>
              <p className="text-white text-xl mt-2">PvP 매칭을 시작합니다...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: showEventAnnounce ? 0 : 1, y: showEventAnnounce ? 20 : 0 }}
        transition={{ delay: showEventAnnounce ? 0 : 0.3 }}
        className="bg-gradient-to-b from-purple-900 to-indigo-900 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl border border-purple-500/30"
      >
        {/* 헤더 */}
        <div className="text-center mb-6">
          <div className="text-3xl mb-2">⚔️</div>
          <h2 className="text-2xl font-bold text-white mb-2">PvP 대전</h2>
          <p className="text-purple-200 text-sm">
            다른 플레이어와 호감도를 걸고 대결하세요!
          </p>
        </div>

        {/* 상태에 따른 UI */}
        {status === "connecting" && (
          <div className="text-center py-8">
            <div className="animate-spin w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-white">서버에 연결 중...</p>
          </div>
        )}

        {(status === "connected" || status === "idle" || status === "connecting") && !isJoining && (
          <>
            {/* 연결 상태 표시 */}
            {(status === "idle" || status === "connecting") && (
              <div className="text-center py-4 mb-4">
                <div className="inline-flex items-center gap-2 bg-yellow-500/20 border border-yellow-400/50 rounded-full px-4 py-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                  <span className="text-yellow-300 text-sm">서버 연결 중...</span>
                </div>
              </div>
            )}

            {/* 배팅 금액 선택 */}
            <div className="bg-black/30 rounded-xl p-4 mb-6">
              <label className="block text-purple-200 text-sm mb-2">
                배팅할 호감도
              </label>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => handleBetChange(-5)}
                  disabled={status !== "connected"}
                  className="w-10 h-10 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  -5
                </button>
                <button
                  onClick={() => handleBetChange(-1)}
                  disabled={status !== "connected"}
                  className="w-10 h-10 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  -1
                </button>
                <div className="text-4xl font-bold text-white min-w-[80px] text-center">
                  {betAmount}
                </div>
                <button
                  onClick={() => handleBetChange(1)}
                  disabled={status !== "connected"}
                  className="w-10 h-10 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  +1
                </button>
                <button
                  onClick={() => handleBetChange(5)}
                  disabled={status !== "connected"}
                  className="w-10 h-10 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  +5
                </button>
              </div>
              <p className="text-center text-purple-300 text-xs mt-2">
                보유 호감도: {currentAffection}
              </p>
            </div>

            {/* 설명 */}
            <div className="text-purple-200 text-sm space-y-1 mb-6">
              <p>- 양쪽 배팅 중 높은 금액으로 대결합니다</p>
              <p>- 승리 시 배팅한 호감도만큼 획득!</p>
              <p>- 패배 시 호감도를 잃습니다</p>
              <p className="text-red-300">- 호감도 0이 되면 캐릭터를 뺏깁니다!</p>
            </div>

            {/* 버튼 */}
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 py-3 rounded-xl bg-gray-600 hover:bg-gray-500 text-white font-semibold transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleJoinQueue}
                disabled={status !== "connected"}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === "connected" ? "매칭 시작" : "연결 중..."}
              </button>
            </div>
          </>
        )}

        {isMatching && (
          <>
            {/* 매칭 중 UI */}
            <div className="text-center py-4">
              {/* 매칭 중 배지 */}
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-400/50 rounded-full px-4 py-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-pink-300 font-semibold">PvP 매칭 중</span>
              </div>

              {/* 카운트다운 */}
              <div className="relative w-32 h-32 mx-auto mb-6">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="rgba(139, 92, 246, 0.3)"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="url(#gradient)"
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${(remainingSeconds / 30) * 352} 352`}
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#ec4899" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-4xl font-bold text-white">
                    {remainingSeconds}
                  </span>
                </div>
              </div>

              <p className="text-white text-lg mb-2">🔍 상대를 찾는 중...</p>
              <p className="text-purple-300 text-sm mb-2">
                배팅 금액: <span className="font-bold text-white">{betAmount}</span>
              </p>
              <p className="text-yellow-300/70 text-xs mb-6">
                ⏰ {remainingSeconds}초 내 매칭 실패 시 솔로 이벤트로 전환됩니다
              </p>

              {/* 애니메이션 점 */}
              <div className="flex justify-center gap-2 mb-6">
                <div className="w-3 h-3 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-3 h-3 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-3 h-3 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>

              <button
                onClick={handleCancel}
                className="px-8 py-3 rounded-xl bg-gray-600 hover:bg-gray-500 text-white font-semibold transition-colors"
              >
                매칭 취소
              </button>
            </div>
          </>
        )}

        {(status === "error" || status === "disconnected") && (
          <div className="text-center py-8">
            <div className="text-5xl mb-4">🎮</div>
            <p className="text-purple-200 mb-2">
              PvP 서버에 연결할 수 없습니다
            </p>
            <p className="text-white text-lg mb-4">
              솔로 미니게임으로 자동 전환 중...
            </p>
            <div className="animate-spin w-8 h-8 border-4 border-pink-400 border-t-transparent rounded-full mx-auto mb-4" />
            <button
              onClick={onTimeout}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 text-white font-semibold transition-colors"
            >
              바로 시작하기
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
