"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import AffectionGauge from "@/components/game/AffectionGauge";
import ChoiceButton from "@/components/game/ChoiceButton";
import EndingScreen from "@/components/game/EndingScreen";
import CharacterExpression, { getExpressionFromDelta } from "@/components/game/CharacterExpression";

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

  useEffect(() => {
    loadScene();
  }, [sessionId]);

  const loadScene = async () => {
    try {
      setLoading(true);
      const response = await api.post(`/scenes/${sessionId}/generate`);
      setScene(response.data);
    } catch (error) {
      console.error("Failed to load scene:", error);
    } finally {
      setLoading(false);
    }
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

      // 잠시 대기 후 다음 씬 로드
      setTimeout(() => {
        setAffectionChange(null);
        if (response.data.status === "playing") {
          loadScene();
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
      <div className="max-w-2xl mx-auto">
        {/* 호감도 게이지 */}
        <AffectionGauge
          affection={scene.affection}
          change={affectionChange}
        />

        {/* 씬 번호 */}
        <div className="text-center text-gray-500 mb-4">
          Scene {scene.scene_number} / 10
        </div>

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
          <AnimatePresence>
            {scene.choices.map((choice, index) => (
              <motion.div
                key={choice.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <ChoiceButton
                  text={choice.text}
                  onClick={() => handleChoice(index, choice.delta)}
                  disabled={selecting}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
