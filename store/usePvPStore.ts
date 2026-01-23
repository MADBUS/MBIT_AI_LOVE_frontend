import { create } from "zustand";

// PvP 매칭 상태
type MatchingStatus =
  | "idle"           // 대기 중
  | "connecting"     // WebSocket 연결 중
  | "connected"      // 연결됨
  | "queue_joined"   // 매칭 큐 참가
  | "matching"       // 매칭 진행 중
  | "matched"        // 매칭 성공
  | "playing"        // 게임 진행 중
  | "timeout"        // 타임아웃
  | "disconnected"   // 연결 끊김
  | "error";         // 에러

// PvP 미니게임 타입
export type PvPGameType = "shell" | "chase" | "mashing";

// PvP 결과 타입
interface PvPResult {
  status: "win" | "lose";
  opponentSessionId: string;
  finalBet: number;
  newAffection: number;
  characterStolen: boolean;
  showEventScene: boolean;
}

// 솔로 미니게임 난이도
interface MinigameDifficulty {
  targetCount: number;
  timeSeconds: number;
  heartSizeMin: number;
  heartSizeMax: number;
  heartDurationMin: number;
  heartDurationMax: number;
}

// 게임 상태
interface GameState {
  // Shell Game (야바위)
  opponentHover: number | null;
  opponentSelected: number | null;

  // Chase Game (나잡아봐라)
  opponentPosition: number;
  opponentHits: number;

  // Mashing Game (스페이스바 광클)
  opponentScore: number;
}

interface PvPState {
  // WebSocket 연결 상태
  socket: WebSocket | null;
  status: MatchingStatus;
  sessionId: string | null;

  // 매칭 관련
  betAmount: number;
  matchingStartTime: number | null;
  remainingSeconds: number;

  // 상대방 정보
  opponentSessionId: string | null;
  opponentBet: number | null;

  // 게임 관련
  roomId: string | null;
  gameType: PvPGameType | null;
  isHost: boolean;
  correctCup: number | null;  // 야바위용
  gameState: GameState;

  // 결과
  pvpResult: PvPResult | null;

  // 솔로 미니게임 (매칭 실패 시)
  triggerSoloMinigame: boolean;
  soloMinigameDifficulty: MinigameDifficulty | null;

  // 에러
  error: string | null;

  // Actions
  connect: (sessionId: string) => void;
  disconnect: () => void;
  joinQueue: (betAmount: number) => void;
  leaveQueue: () => void;
  setBetAmount: (amount: number) => void;
  setRemainingSeconds: (seconds: number) => void;
  setPvPResult: (result: PvPResult | null) => void;
  setSoloMinigame: (trigger: boolean, difficulty?: MinigameDifficulty) => void;
  reset: () => void;

  // 게임 액션
  sendGameAction: (action: string, payload: Record<string, unknown>) => void;
  startGame: () => void;
}

const WEBSOCKET_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

const initialGameState: GameState = {
  opponentHover: null,
  opponentSelected: null,
  opponentPosition: 1,
  opponentHits: 0,
  opponentScore: 0,
};

export const usePvPStore = create<PvPState>((set, get) => ({
  // 초기 상태
  socket: null,
  status: "idle",
  sessionId: null,
  betAmount: 10,
  matchingStartTime: null,
  remainingSeconds: 30,
  opponentSessionId: null,
  opponentBet: null,
  roomId: null,
  gameType: null,
  isHost: false,
  correctCup: null,
  gameState: { ...initialGameState },
  pvpResult: null,
  triggerSoloMinigame: false,
  soloMinigameDifficulty: null,
  error: null,

  // WebSocket 연결
  connect: (sessionId: string) => {
    const { socket } = get();

    // 이미 연결된 경우 무시
    if (socket && socket.readyState === WebSocket.OPEN) {
      return;
    }

    set({ status: "connecting", sessionId, error: null });

    const ws = new WebSocket(`${WEBSOCKET_BASE_URL}/ws/pvp/match/${sessionId}`);

    ws.onopen = () => {
      console.log("[PvP] WebSocket connected");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("[PvP] Message received:", data);

        switch (data.type) {
          case "connected":
            set({ status: "connected" });
            break;

          case "queue_joined":
            set({
              status: "queue_joined",
              betAmount: data.bet_amount,
              matchingStartTime: Date.now(),
              remainingSeconds: 30,
            });
            break;

          case "queue_left":
            set({
              status: "connected",
              matchingStartTime: null,
              remainingSeconds: 30,
            });
            break;

          case "matched":
            set({
              status: "matched",
              opponentSessionId: data.opponent_session_id,
              opponentBet: data.opponent_bet,
              roomId: data.room_id,
              gameType: data.game_type,
              isHost: data.is_host,
              correctCup: data.correct_cup,
              gameState: { ...initialGameState },
            });
            break;

          case "game_update":
            // 상대방 게임 상태 업데이트
            const { gameState } = get();
            switch (data.game_action) {
              case "opponent_hover":
                set({ gameState: { ...gameState, opponentHover: data.cup_index } });
                break;
              case "opponent_select":
                set({ gameState: { ...gameState, opponentSelected: data.cup_index } });
                break;
              case "opponent_position":
                set({ gameState: { ...gameState, opponentPosition: data.position } });
                break;
              case "opponent_hit":
                set({ gameState: { ...gameState, opponentHits: data.hits } });
                break;
              case "opponent_score":
                set({ gameState: { ...gameState, opponentScore: data.score } });
                break;
            }
            break;

          case "timeout":
            set({
              status: "timeout",
              triggerSoloMinigame: true,
              soloMinigameDifficulty: data.solo_difficulty || {
                targetCount: 12,
                timeSeconds: 6,
                heartSizeMin: 40,
                heartSizeMax: 60,
                heartDurationMin: 2,
                heartDurationMax: 4,
              },
            });
            break;

          case "pvp_result":
            set({
              pvpResult: {
                status: data.winner ? "win" : "lose",
                opponentSessionId: data.opponent_session_id,
                finalBet: data.final_bet,
                newAffection: data.new_affection,
                characterStolen: data.character_stolen || false,
                showEventScene: data.show_event_scene || false,
              },
            });
            break;

          case "error":
            set({ status: "error", error: data.message });
            break;
        }
      } catch (err) {
        console.error("[PvP] Failed to parse message:", err);
      }
    };

    ws.onerror = () => {
      // WebSocket 에러 발생 시 조용히 처리 (콘솔 에러 출력 안함)
      // 솔로 미니게임으로 자동 전환됨
      set({ status: "error", error: "서버 연결 실패" });
    };

    ws.onclose = () => {
      // 연결 종료 시 조용히 처리
      const { status: currentStatus } = get();
      // 이미 에러 상태가 아닌 경우에만 disconnected로 설정
      if (currentStatus !== "error") {
        set({ status: "disconnected", socket: null });
      }
    };

    set({ socket: ws });
  },

  // WebSocket 연결 종료
  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.close();
      set({ socket: null, status: "idle" });
    }
  },

  // 매칭 큐 참가
  joinQueue: (betAmount: number) => {
    const { socket, status } = get();

    if (!socket || status !== "connected") {
      console.error("[PvP] Cannot join queue: not connected");
      return;
    }

    socket.send(JSON.stringify({
      action: "join_queue",
      bet_amount: betAmount,
    }));

    set({ status: "matching", betAmount });
  },

  // 매칭 큐 탈퇴
  leaveQueue: () => {
    const { socket } = get();

    if (!socket) {
      return;
    }

    socket.send(JSON.stringify({
      action: "leave_queue",
    }));
  },

  // 배팅 금액 설정
  setBetAmount: (amount: number) => {
    set({ betAmount: Math.max(1, Math.min(100, amount)) });
  },

  // 남은 시간 설정
  setRemainingSeconds: (seconds: number) => {
    set({ remainingSeconds: Math.max(0, seconds) });
  },

  // PvP 결과 설정
  setPvPResult: (result: PvPResult | null) => {
    set({ pvpResult: result });
  },

  // 솔로 미니게임 트리거 설정
  setSoloMinigame: (trigger: boolean, difficulty?: MinigameDifficulty) => {
    set({
      triggerSoloMinigame: trigger,
      soloMinigameDifficulty: difficulty || null,
    });
  },

  // 상태 초기화
  reset: () => {
    const { socket } = get();
    if (socket) {
      socket.close();
    }

    set({
      socket: null,
      status: "idle",
      sessionId: null,
      betAmount: 10,
      matchingStartTime: null,
      remainingSeconds: 30,
      opponentSessionId: null,
      opponentBet: null,
      roomId: null,
      gameType: null,
      isHost: false,
      correctCup: null,
      gameState: { ...initialGameState },
      pvpResult: null,
      triggerSoloMinigame: false,
      soloMinigameDifficulty: null,
      error: null,
    });
  },

  // 게임 액션 전송
  sendGameAction: (action: string, payload: Record<string, unknown>) => {
    const { socket, roomId } = get();

    if (!socket || !roomId) {
      console.error("[PvP] Cannot send game action: not in a game");
      return;
    }

    socket.send(JSON.stringify({
      action: "game_action",
      room_id: roomId,
      game_action: action,
      payload,
    }));
  },

  // 게임 시작
  startGame: () => {
    set({ status: "playing" });
  },
}));
