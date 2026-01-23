"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { usePvPStore, PvPGameType } from "@/store/usePvPStore";
import PvPMinigameRoulette from "./PvPMinigameRoulette";
import ShellGame from "./ShellGame";
import ChaseGame from "./ChaseGame";
import MashingGame from "./MashingGame";

interface PvPGameManagerProps {
  partnerGender: "male" | "female";
  onGameEnd: (won: boolean) => void;
}

export default function PvPGameManager({
  partnerGender,
  onGameEnd,
}: PvPGameManagerProps) {
  const {
    status,
    gameType,
    isHost,
    correctCup,
    gameState,
    pvpResult,
    sendGameAction,
    startGame,
  } = usePvPStore();

  const [showRoulette, setShowRoulette] = useState(true);
  const [currentGame, setCurrentGame] = useState<PvPGameType | null>(null);
  const hasHandledResult = useRef(false);

  // 매칭 성공 시 룰렛 표시
  useEffect(() => {
    if (status === "matched" && gameType) {
      setShowRoulette(true);
      hasHandledResult.current = false;
    }
  }, [status, gameType]);

  // PvP 결과 감시 (상대방 연결 끊김 등)
  useEffect(() => {
    if (pvpResult && !hasHandledResult.current) {
      hasHandledResult.current = true;
      console.log("[PvPGameManager] PvP result received:", pvpResult);
      onGameEnd(pvpResult.status === "win");
    }
  }, [pvpResult, onGameEnd]);

  // WebSocket 연결 끊김 감시
  useEffect(() => {
    if ((status === "disconnected" || status === "error") && currentGame && !hasHandledResult.current) {
      console.log("[PvPGameManager] WebSocket disconnected during game, treating as loss");
      hasHandledResult.current = true;
      onGameEnd(false);
    }
  }, [status, currentGame, onGameEnd]);

  // 룰렛 완료 시 게임 시작
  const handleRouletteComplete = useCallback((selectedGame: PvPGameType) => {
    setShowRoulette(false);
    setCurrentGame(selectedGame);
    startGame();
  }, [startGame]);

  // 야바위 게임 이벤트 핸들러
  const handleShellHover = useCallback((cupIndex: number | null) => {
    sendGameAction("hover", { cup_index: cupIndex });
  }, [sendGameAction]);

  const handleShellSelect = useCallback((cupIndex: number) => {
    sendGameAction("select", { cup_index: cupIndex });
  }, [sendGameAction]);

  // 나잡아봐라 게임 이벤트 핸들러
  const handleChasePosition = useCallback((position: number) => {
    sendGameAction("position", { position });
  }, [sendGameAction]);

  const handleChaseHit = useCallback(() => {
    sendGameAction("hit", {});
  }, [sendGameAction]);

  // 스페이스바 광클 게임 이벤트 핸들러
  const handleMashingScore = useCallback((score: number) => {
    sendGameAction("score", { score });
  }, [sendGameAction]);

  // 게임 결과 처리
  const handleGameResult = useCallback((won: boolean) => {
    onGameEnd(won);
  }, [onGameEnd]);

  // 룰렛 표시
  if (showRoulette && gameType) {
    return (
      <PvPMinigameRoulette
        targetGame={gameType}
        onGameSelected={handleRouletteComplete}
      />
    );
  }

  // 게임 렌더링
  if (currentGame === "shell" && correctCup !== null) {
    return (
      <ShellGame
        isHost={isHost}
        opponentSelection={gameState.opponentHover}
        opponentLocked={gameState.opponentSelected}
        onHover={handleShellHover}
        onSelect={handleShellSelect}
        onResult={handleGameResult}
        correctCup={correctCup}
      />
    );
  }

  if (currentGame === "chase") {
    return (
      <ChaseGame
        isHost={isHost}
        partnerGender={partnerGender}
        opponentPosition={gameState.opponentPosition}
        opponentHits={gameState.opponentHits}
        onPositionChange={handleChasePosition}
        onHit={handleChaseHit}
        onResult={handleGameResult}
        obstacles={[]} // 장애물은 컴포넌트 내부에서 생성
      />
    );
  }

  if (currentGame === "mashing") {
    return (
      <MashingGame
        isHost={isHost}
        opponentScore={gameState.opponentScore}
        onScoreChange={handleMashingScore}
        onResult={handleGameResult}
      />
    );
  }

  return null;
}
