"use client";

import { useEffect, useState } from "react";
import { usePvPStore } from "@/store/usePvPStore";

interface PvPResultModalProps {
  onClose: () => void;
  onViewEventScene?: () => void;
}

export default function PvPResultModal({
  onClose,
  onViewEventScene,
}: PvPResultModalProps) {
  const { pvpResult, reset } = usePvPStore();
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (pvpResult?.status === "win") {
      setShowConfetti(true);
      // 3초 후 효과 제거
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [pvpResult]);

  if (!pvpResult) return null;

  const isWin = pvpResult.status === "win";
  const characterStolen = pvpResult.characterStolen;

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleViewEventScene = () => {
    if (onViewEventScene) {
      onViewEventScene();
    }
    handleClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      {/* 승리 시 Confetti 효과 */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-fall"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-20px`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            >
              <div
                className="w-3 h-3 rounded-sm"
                style={{
                  backgroundColor: ["#ec4899", "#8b5cf6", "#fbbf24", "#34d399"][
                    Math.floor(Math.random() * 4)
                  ],
                  transform: `rotate(${Math.random() * 360}deg)`,
                }}
              />
            </div>
          ))}
        </div>
      )}

      <div
        className={`relative rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border ${
          isWin
            ? "bg-gradient-to-b from-yellow-900 to-orange-900 border-yellow-500/50"
            : "bg-gradient-to-b from-gray-800 to-gray-900 border-gray-600/50"
        }`}
      >
        {/* 결과 아이콘 */}
        <div className="text-center mb-6">
          {isWin ? (
            <>
              <div className="text-6xl mb-4">🏆</div>
              <h2 className="text-3xl font-bold text-yellow-300">승리!</h2>
            </>
          ) : (
            <>
              <div className="text-6xl mb-4">😢</div>
              <h2 className="text-3xl font-bold text-gray-300">패배...</h2>
            </>
          )}
        </div>

        {/* 결과 상세 */}
        <div className="bg-black/30 rounded-xl p-4 mb-6 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-300">최종 배팅</span>
            <span className="text-white font-bold">{pvpResult.finalBet}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-300">호감도 변화</span>
            <span
              className={`font-bold ${
                isWin ? "text-green-400" : "text-red-400"
              }`}
            >
              {isWin ? "+" : "-"}
              {pvpResult.finalBet}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-300">현재 호감도</span>
            <span className="text-white font-bold">{pvpResult.newAffection}</span>
          </div>
        </div>

        {/* 캐릭터 뺏기 알림 */}
        {characterStolen && (
          <div
            className={`rounded-xl p-4 mb-6 ${
              isWin
                ? "bg-gradient-to-r from-pink-600 to-purple-600"
                : "bg-gradient-to-r from-red-800 to-red-900"
            }`}
          >
            {isWin ? (
              <div className="text-center">
                <p className="text-2xl mb-2">💕</p>
                <p className="text-white font-bold text-lg">
                  상대방의 애인을 뺏어왔습니다!
                </p>
                <p className="text-pink-200 text-sm mt-1">
                  마이페이지에서 확인하세요
                </p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-2xl mb-2">💔</p>
                <p className="text-white font-bold text-lg">
                  캐릭터를 뺏겼습니다...
                </p>
                <p className="text-red-200 text-sm mt-1">
                  새로운 캐릭터를 만들어보세요
                </p>
              </div>
            )}
          </div>
        )}

        {/* 버튼 */}
        <div className="flex flex-col gap-3">
          {isWin && pvpResult.showEventScene && (
            <button
              onClick={handleViewEventScene}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 text-white font-semibold transition-colors"
            >
              특별 이벤트 보기 ✨
            </button>
          )}
          <button
            onClick={handleClose}
            className="w-full py-3 rounded-xl bg-gray-600 hover:bg-gray-500 text-white font-semibold transition-colors"
          >
            확인
          </button>
        </div>
      </div>

      {/* Confetti 애니메이션 스타일 */}
      <style jsx>{`
        @keyframes fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-fall {
          animation: fall linear forwards;
        }
      `}</style>
    </div>
  );
}
