"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api";
import { useUserStore } from "@/store/useUserStore";
import { MBTI_TYPES } from "@/types";
import Header from "@/components/layout/Header";

const MBTI_DESCRIPTIONS: Record<string, string> = {
  INTJ: "전략가 - 상상력이 풍부하고 결단력 있는 사고형",
  INTP: "논리술사 - 지식에 대한 갈증이 있는 혁신적인 발명가",
  ENTJ: "통솔자 - 대담하고 상상력이 풍부하며 의지가 강한 지도자",
  ENTP: "변론가 - 지적 도전을 즐기는 영리하고 호기심 많은 사색가",
  INFJ: "옹호자 - 조용하고 신비로우며 영감을 주는 이상주의자",
  INFP: "중재자 - 친절하고 이타적이며 언제나 좋은 일을 위해 노력하는 시인",
  ENFJ: "선도자 - 카리스마 있고 영감을 주는 지도자",
  ENFP: "활동가 - 열정적이고 창의적이며 사교적인 자유로운 영혼",
  ISTJ: "현실주의자 - 사실에 근거하며 신뢰할 수 있는 실용주의자",
  ISFJ: "수호자 - 헌신적이고 따뜻한 마음을 가진 수호자",
  ESTJ: "경영자 - 훌륭한 관리자이자 사물과 사람을 관리하는 능력자",
  ESFJ: "집정관 - 배려심 깊고 사교적이며 인기 많은 사람",
  ISTP: "장인 - 대담하고 실용적인 실험자",
  ISFP: "모험가 - 유연하고 매력적인 예술가",
  ESTP: "사업가 - 영리하고 에너지 넘치며 위험을 즐기는 사람",
  ESFP: "연예인 - 자발적이고 에너지 넘치며 즐거움을 주는 연예인",
};

export default function OnboardingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { user, setUser, updateMbti } = useUserStore();
  const [selectedMbti, setSelectedMbti] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedMbti || !user?.id) return;

    setIsSubmitting(true);
    try {
      await api.patch(`/users/${user.id}/mbti`, { mbti: selectedMbti });
      updateMbti(selectedMbti);
      router.push("/characters");
    } catch (error) {
      console.error("Failed to update MBTI:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!session) {
    router.push("/");
    return null;
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-50 pt-20 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-primary mb-2">
            당신의 MBTI를 선택해주세요
          </h1>
          <p className="text-gray-600">
            MBTI에 맞는 맞춤형 대화 스타일을 제공해 드립니다
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {MBTI_TYPES.map((mbti, index) => (
            <motion.button
              key={mbti}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setSelectedMbti(mbti)}
              className={`p-4 rounded-xl border-2 transition-all ${
                selectedMbti === mbti
                  ? "border-primary bg-primary/10 shadow-lg"
                  : "border-gray-200 bg-white hover:border-primary/50"
              }`}
            >
              <div className="text-xl font-bold text-primary">{mbti}</div>
              <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                {MBTI_DESCRIPTIONS[mbti].split(" - ")[0]}
              </div>
            </motion.button>
          ))}
        </div>

        {selectedMbti && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-lg mb-8"
          >
            <h2 className="text-2xl font-bold text-primary mb-2">
              {selectedMbti}
            </h2>
            <p className="text-gray-600">{MBTI_DESCRIPTIONS[selectedMbti]}</p>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSubmit}
            disabled={!selectedMbti || isSubmitting}
            className={`px-8 py-4 rounded-full text-xl font-semibold shadow-lg transition-all ${
              selectedMbti && !isSubmitting
                ? "bg-primary text-white hover:bg-secondary"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {isSubmitting ? "저장 중..." : "다음으로"}
          </motion.button>
        </motion.div>
      </div>
    </main>
    </>
  );
}
