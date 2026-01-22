import { create } from "zustand";

// PvP 매칭 상태
type MatchingStatus =
  | "idle"           // 대기 중
  | "connecting"     // WebSocket 연결 중
  | "connected"      // 연결됨
  | "queue_joined"   // 매칭 큐 참가
  | "matching"       // 매칭 진행 중
  | "matched"        // 매칭 성공
  | "timeout"        // 타임아웃
  | "disconnected"   // 연결 끊김
  | "error";         // 에러

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
}

const WEBSOCKET_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

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
            });
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

    ws.onerror = (error) => {
      console.error("[PvP] WebSocket error:", error);
      set({ status: "error", error: "WebSocket 연결 오류가 발생했습니다." });
    };

    ws.onclose = () => {
      console.log("[PvP] WebSocket disconnected");
      set({ status: "disconnected", socket: null });
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
      pvpResult: null,
      triggerSoloMinigame: false,
      soloMinigameDifficulty: null,
      error: null,
    });
  },
}));
