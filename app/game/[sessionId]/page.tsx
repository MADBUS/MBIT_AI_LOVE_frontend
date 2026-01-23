"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import AffectionGauge from "@/components/game/AffectionGauge";
import ChoiceButton from "@/components/game/ChoiceButton";
import EndingScreen from "@/components/game/EndingScreen";
import CharacterExpression from "@/components/game/CharacterExpression";
import CharacterVideoPlayer from "@/components/game/CharacterVideoPlayer";
import HeartMinigame from "@/components/game/HeartMinigame";
import SpecialEventModal from "@/components/game/SpecialEventModal";
import PvPMatchingModal from "@/components/game/PvPMatchingModal";

interface Scene {
  scene_number: number;
  image_url: string | null;
  dialogue: string;
  choices: { id: number; text: string; delta: number; expression: string }[];
  affection: number;
  status: string;
}

interface SelectResponse {
  new_affection: number;
  next_scene: number;
  status: string;
  expression_type: string;
  expression_image_url: string | null;
  expression_video_url: string | null;
}

interface ExpressionData {
  image_url: string;
  video_url: string | null;
}

interface SpecialEventResponse {
  is_special_event: boolean;
  special_image_url: string | null;
  event_description: string | null;
  show_minigame: boolean;
}

interface MinigameResultResponse {
  affection_change: number;
  new_affection: number;
  message: string;
  show_event_scene: boolean;  // true only when minigame success
}

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [scene, setScene] = useState<Scene | null>(null);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);
  const [affectionChange, setAffectionChange] = useState<number | null>(null);
  const [expressionImageUrl, setExpressionImageUrl] = useState<string | null>(null);
  const [currentExpression, setCurrentExpression] = useState<string>("neutral");
  const [expressions, setExpressions] = useState<Record<string, ExpressionData>>({});
  const [expressionsLoading, setExpressionsLoading] = useState(true);

  // 특별 이벤트 관련 상태
  const [showMinigame, setShowMinigame] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventData, setEventData] = useState<{
    imageUrl: string;
    description: string;
    affectionChange: number;
  } | null>(null);

  // PvP 매칭 관련 상태
  const [showPvPMatching, setShowPvPMatching] = useState(false);
  const [pendingEventData, setPendingEventData] = useState<{
    imageUrl: string;
    description: string;
  } | null>(null);

  // 씬 전환 중 상태 (로딩 화면 없이 부드러운 전환)
  const [isTransitioning, setIsTransitioning] = useState(false);

  // 세션의 모든 표정 데이터 로드
  const loadExpressions = useCallback(async () => {
    try {
      setExpressionsLoading(true);
      const response = await api.get(`/games/${sessionId}/expressions`);
      const expressionMap: Record<string, ExpressionData> = {};
      for (const expr of response.data.expressions || []) {
        expressionMap[expr.expression_type] = {
          image_url: expr.image_url,
          video_url: null,  // 비디오 비활성화
        };
      }
      setExpressions(expressionMap);
      console.log("[GamePage] Expressions loaded:", expressionMap);
    } catch (error) {
      console.error("Failed to load expressions:", error);
    } finally {
      setExpressionsLoading(false);
    }
  }, [sessionId]);

  const loadScene = async (showLoading = false) => {
    try {
      if (showLoading) {
        setLoading(true);
      } else {
        setIsTransitioning(true);
      }
      const response = await api.post(`/scenes/${sessionId}/generate`);
      console.log("[GamePage] Scene loaded:", response.data);
      console.log("[GamePage] image_url:", response.data.image_url);
      setScene(response.data);
      setExpressionImageUrl(null); // 새 씬에서는 기본 이미지 사용
      setCurrentExpression("neutral"); // 표정 초기화

      // 씬 로드 후 특별 이벤트 체크
      await checkSpecialEvent(response.data.scene_number);
    } catch (error) {
      console.error("Failed to load scene:", error);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
      setIsTransitioning(false);
    }
  };

  useEffect(() => {
    loadScene(true); // 최초 로드시에만 로딩 화면 표시
    loadExpressions(); // 표정 데이터 로드
  }, [sessionId, loadExpressions]);

  // 특별 이벤트 체크 - PvP 매칭 우선, 30초 타임아웃 시 솔로 미니게임
  const checkSpecialEvent = async (sceneNumber: number) => {
    try {
      const response = await api.post<SpecialEventResponse>(
        `/scenes/${sessionId}/check-event`
      );
      console.log("[GamePage] Special event check:", response.data);

      if (response.data.is_special_event && response.data.show_minigame) {
        // 이벤트 데이터 임시 저장 (PvP 매칭 또는 솔로 이벤트용)
        setPendingEventData({
          imageUrl: response.data.special_image_url || "",
          description: response.data.event_description || "특별 이벤트",
        });
        // PvP 매칭 모달 표시 (30초 타임아웃 시 솔로 미니게임으로 전환)
        setShowPvPMatching(true);
      }
    } catch (error) {
      console.error("Failed to check special event:", error);
    }
  };

  // PvP 매칭 성공 처리
  const handlePvPMatchSuccess = (opponentSessionId: string, finalBet: number) => {
    console.log("[GamePage] PvP Match success:", opponentSessionId, finalBet);
    setShowPvPMatching(false);
    // TODO: PvP 대전 로직 구현
    // 지금은 솔로 미니게임으로 전환
    if (pendingEventData) {
      setEventData({
        imageUrl: pendingEventData.imageUrl,
        description: "PvP 대전!",
        affectionChange: 0,
      });
      setShowMinigame(true);
    }
  };

  // PvP 매칭 타임아웃 처리 - 솔로 미니게임으로 전환
  const handlePvPTimeout = () => {
    console.log("[GamePage] PvP timeout - switching to solo minigame");
    setShowPvPMatching(false);
    if (pendingEventData) {
      setEventData({
        imageUrl: pendingEventData.imageUrl,
        description: pendingEventData.description,
        affectionChange: 0,
      });
      // 솔로 미니게임 표시
      setShowMinigame(true);
    }
    setPendingEventData(null);
  };

  // PvP 매칭 취소/닫기
  const handlePvPClose = () => {
    setShowPvPMatching(false);
    setPendingEventData(null);
  };

  // 미니게임 완료 처리
  const handleMinigameComplete = async (success: boolean) => {
    try {
      const response = await api.post<MinigameResultResponse>(
        `/scenes/${sessionId}/minigame-result`,
        { success }
      );
      console.log("[GamePage] Minigame result:", response.data);

      // 호감도 업데이트
      if (scene) {
        setScene({
          ...scene,
          affection: response.data.new_affection,
        });
      }

      // 이벤트 데이터 업데이트 (승리 시에만)
      if (eventData && response.data.show_event_scene) {
        setEventData({
          ...eventData,
          affectionChange: response.data.affection_change,
        });
      }

      // 미니게임 닫고 잠시 후 처리
      setTimeout(() => {
        setShowMinigame(false);
        // 승리 시에만 이벤트 모달 표시
        if (response.data.show_event_scene) {
          setShowEventModal(true);
        } else {
          // 패배 시 이벤트 데이터 초기화
          setEventData(null);
        }
      }, 2000);
    } catch (error) {
      console.error("Failed to submit minigame result:", error);
      setShowMinigame(false);
    }
  };

  // 이벤트 모달 닫기
  const handleEventModalClose = () => {
    setShowEventModal(false);
    setEventData(null);
  };

  const handleChoice = async (choiceIndex: number, delta: number, expression: string) => {
    if (selecting || !scene) return;

    setSelecting(true);
    setAffectionChange(delta);

    // 선택지에서 제공된 expression 사용
    const expressionType = expression || "neutral";
    setCurrentExpression(expressionType);

    // 해당 표정의 이미지 URL 설정
    const expressionData = expressions[expressionType];
    if (expressionData) {
      setExpressionImageUrl(expressionData.image_url);
    }

    try {
      const response = await api.post<SelectResponse>(`/games/${sessionId}/select`, {
        affection_delta: delta,
        expression_type: expressionType,
      });

      // API 응답에서 표정 이미지 업데이트 (fallback)
      if (response.data.expression_image_url) {
        setExpressionImageUrl(response.data.expression_image_url);
      }

      // 표정 변화 표시 후 다음 씬 로드
      setTimeout(() => {
        setAffectionChange(null);
        if (response.data.status === "playing") {
          loadScene(false); // 로딩 화면 없이 다음 씬 로드
        } else {
          setScene((prev) =>
            prev ? { ...prev, status: response.data.status, affection: response.data.new_affection } : null
          );
        }
        setSelecting(false);
      }, 1500); // 표정 변화 표시 시간
    } catch (error) {
      console.error("Failed to select choice:", error);
      setSelecting(false);
    }
  };

  if (loading || expressionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-pink-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">
            {expressionsLoading ? "캐릭터 표정 불러오는 중..." : "씬을 불러오는 중..."}
          </p>
        </div>
      </div>
    );
  }

  if (!scene) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>씬을 불러올 수 없습니다.</p>
      </div>
    );
  }

  // 엔딩 화면
  if (scene.status !== "playing") {
    return (
      <EndingScreen
        type={scene.status as "happy_ending" | "sad_ending"}
        affection={scene.affection}
        onRestart={() => router.push("/characters")}
      />
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-50 py-8 px-4">
      {/* PvP 매칭 모달 (30초 타임아웃 시 솔로 미니게임 전환) */}
      {showPvPMatching && (
        <PvPMatchingModal
          sessionId={sessionId}
          currentAffection={scene.affection}
          onMatchSuccess={handlePvPMatchSuccess}
          onTimeout={handlePvPTimeout}
          onClose={handlePvPClose}
        />
      )}

      {/* 미니게임 (기본값: 8초 내 7개 터치) */}
      {showMinigame && (
        <HeartMinigame
          onComplete={handleMinigameComplete}
          targetCount={7}
          timeLimit={8}
        />
      )}

      {/* 특별 이벤트 모달 */}
      {eventData && (
        <SpecialEventModal
          isOpen={showEventModal}
          imageUrl={eventData.imageUrl}
          eventDescription={eventData.description}
          affectionChange={eventData.affectionChange}
          onClose={handleEventModalClose}
        />
      )}

      <div className="max-w-2xl mx-auto">
        {/* 호감도 게이지 */}
        <AffectionGauge
          affection={scene.affection}
          change={affectionChange}
        />

        {/* 턴 카운트 */}
        <div className="text-center text-gray-500 mb-4">
          Turn {scene.scene_number}
          {isTransitioning && (
            <span className="ml-2 inline-block animate-pulse">...</span>
          )}
        </div>

        {/* 씬 전환 시 부드러운 페이드 효과 */}
        <motion.div
          animate={{ opacity: isTransitioning ? 0.6 : 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* 캐릭터 표정 이미지 */}
          <div className="mb-6 max-w-sm mx-auto">
            <CharacterVideoPlayer
              videoUrl={null}
              imageUrl={expressionImageUrl || expressions[currentExpression]?.image_url || scene.image_url}
              expressionType={currentExpression}
            />
          </div>

          {/* 캐릭터 대사 */}
          <motion.div
            key={scene.scene_number}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative bg-gradient-to-br from-white to-pink-50 rounded-2xl p-5 mb-6 shadow-md border-l-4 border-pink-400"
          >
            {/* 캐릭터 말풍선 표시 */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">💬</span>
              <span className="text-sm font-semibold text-pink-500">상대방</span>
            </div>
            <p className="text-lg text-gray-800 leading-relaxed pl-1">
              {scene.dialogue}
            </p>
            {/* 말풍선 꼬리 */}
            <div className="absolute -top-2 left-8 w-4 h-4 bg-gradient-to-br from-white to-pink-50 transform rotate-45 border-l border-t border-pink-100" />
          </motion.div>

          {/* 사용자 선택지 */}
          <div className="space-y-3">
            {/* 선택지 헤더 */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">👆</span>
              <span className="text-sm font-semibold text-purple-600">나의 반응 선택</span>
            </div>
            <AnimatePresence mode="sync">
              {scene.choices.map((choice, index) => (
                <motion.div
                  key={`${scene.scene_number}-${choice.id}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <ChoiceButton
                    text={choice.text}
                    onClick={() => handleChoice(index, choice.delta, choice.expression)}
                    disabled={selecting || isTransitioning}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
