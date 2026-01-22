"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import AffectionGauge from "@/components/game/AffectionGauge";
import ChoiceButton from "@/components/game/ChoiceButton";
import EndingScreen from "@/components/game/EndingScreen";
import CharacterExpression, { getExpressionFromDelta } from "@/components/game/CharacterExpression";
import HeartMinigame from "@/components/game/HeartMinigame";
import SpecialEventModal from "@/components/game/SpecialEventModal";

interface Scene {
  scene_number: number;
  image_url: string | null;
  dialogue: string;
  choices: { id: number; text: string; delta: number }[];
  affection: number;
  status: string;
}

interface SelectResponse {
  new_affection: number;
  next_scene: number;
  status: string;
  expression_type: string;
  expression_image_url: string | null;
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

  // 특별 이벤트 관련 상태
  const [showMinigame, setShowMinigame] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventData, setEventData] = useState<{
    imageUrl: string;
    description: string;
    affectionChange: number;
  } | null>(null);

  // 씬 전환 중 상태 (로딩 화면 없이 부드러운 전환)
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    loadScene(true); // 최초 로드시에만 로딩 화면 표시
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

  // 특별 이벤트 체크
  const checkSpecialEvent = async (sceneNumber: number) => {
    try {
      const response = await api.post<SpecialEventResponse>(
        `/scenes/${sessionId}/check-event`
      );
      console.log("[GamePage] Special event check:", response.data);

      if (response.data.is_special_event && response.data.show_minigame) {
        // 이벤트 데이터 저장
        setEventData({
          imageUrl: response.data.special_image_url || "",
          description: response.data.event_description || "특별 이벤트",
          affectionChange: 0,
        });
        // 미니게임 표시
        setShowMinigame(true);
      }
    } catch (error) {
      console.error("Failed to check special event:", error);
    }
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

      // 이벤트 데이터 업데이트
      if (eventData) {
        setEventData({
          ...eventData,
          affectionChange: response.data.affection_change,
        });
      }

      // 미니게임 닫고 잠시 후 이벤트 모달 표시
      setTimeout(() => {
        setShowMinigame(false);
        setShowEventModal(true);
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

  const handleChoice = async (choiceIndex: number, delta: number) => {
    if (selecting || !scene) return;

    setSelecting(true);
    setAffectionChange(delta);

    // delta에 따라 expression_type 결정
    const expressionType = getExpressionFromDelta(delta);
    setCurrentExpression(expressionType);

    try {
      const response = await api.post<SelectResponse>(`/games/${sessionId}/select`, {
        affection_delta: delta,
        expression_type: expressionType,
      });

      // 표정 이미지 업데이트
      if (response.data.expression_image_url) {
        setExpressionImageUrl(response.data.expression_image_url);
      }

      // 잠시 대기 후 다음 씬 로드 (로딩 화면 없이)
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
      }, 1500);
    } catch (error) {
      console.error("Failed to select choice:", error);
      setSelecting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-pink-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">씬을 불러오는 중...</p>
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
      {/* 미니게임 */}
      {showMinigame && (
        <HeartMinigame
          onComplete={handleMinigameComplete}
          targetCount={10}
          timeLimit={5}
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
          <div className="mb-6">
            <CharacterExpression
              imageUrl={expressionImageUrl || scene.image_url}
              expressionType={currentExpression}
              isTransitioning={selecting}
            />
          </div>

          {/* 대사 */}
          <motion.div
            key={scene.scene_number}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 mb-6 shadow-md"
          >
            <p className="text-lg text-gray-800 leading-relaxed">
              {scene.dialogue}
            </p>
          </motion.div>

          {/* 선택지 */}
          <div className="space-y-3">
            <AnimatePresence mode="wait">
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
                    onClick={() => handleChoice(index, choice.delta)}
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
