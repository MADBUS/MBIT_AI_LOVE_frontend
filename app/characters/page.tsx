"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api";
import { useUserStore } from "@/store/useUserStore";
import {
  GENDER_OPTIONS,
  STYLE_OPTIONS,
  ART_STYLE_OPTIONS,
  MBTI_TYPES,
  type CharacterSettingCreate,
} from "@/types";
import Header from "@/components/layout/Header";

type Step = "gender" | "style" | "mbti" | "art_style" | "confirm";

const STEPS: Step[] = ["gender", "style", "mbti", "art_style", "confirm"];

const STEP_TITLES: Record<Step, string> = {
  gender: "성별 선택",
  style: "성격 스타일",
  mbti: "캐릭터 MBTI",
  art_style: "그림체 선택",
  confirm: "설정 확인",
};

export default function CharactersPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { user } = useUserStore();

  const [currentStep, setCurrentStep] = useState<Step>("gender");
  const [settings, setSettings] = useState<Partial<CharacterSettingCreate>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentStepIndex = STEPS.indexOf(currentStep);

  const handleSelect = (key: keyof CharacterSettingCreate, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex]);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex]);
    }
  };

  const handleSubmit = async () => {
    if (!user?.id) return;

    setIsSubmitting(true);
    try {
      const payload: CharacterSettingCreate = {
        user_id: user.id,
        gender: settings.gender as "male" | "female",
        style: settings.style as "tsundere" | "cool" | "cute" | "sexy" | "pure",
        mbti: settings.mbti as string,
        art_style: settings.art_style as "anime" | "realistic" | "watercolor",
      };

      // 1. Create character settings and game session
      const response = await api.post("/character_settings/", payload);
      const sessionId = response.data.id;

      // 2. Generate 6 expression images
      await api.post(`/games/${sessionId}/generate-expressions`);

      // 3. Navigate to game
      router.push(`/game/${sessionId}`);
    } catch (error) {
      console.error("Failed to create game:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case "gender":
        return !!settings.gender;
      case "style":
        return !!settings.style;
      case "mbti":
        return !!settings.mbti;
      case "art_style":
        return !!settings.art_style;
      case "confirm":
        return true;
      default:
        return false;
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
        <div className="max-w-2xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {STEPS.map((step, index) => (
              <div
                key={step}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  index <= currentStepIndex
                    ? "bg-primary text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {index + 1}
              </div>
            ))}
          </div>
          <div className="h-2 bg-gray-200 rounded-full">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${((currentStepIndex + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-white rounded-2xl p-6 shadow-lg"
        >
          <h1 className="text-2xl font-bold text-primary mb-6 text-center">
            {STEP_TITLES[currentStep]}
          </h1>

          {/* Gender Selection */}
          {currentStep === "gender" && (
            <div className="grid grid-cols-2 gap-4">
              {GENDER_OPTIONS.map((option) => (
                <motion.button
                  key={option.value}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelect("gender", option.value)}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    settings.gender === option.value
                      ? "border-primary bg-primary/10"
                      : "border-gray-200 hover:border-primary/50"
                  }`}
                >
                  <div className="text-4xl mb-2">{option.emoji}</div>
                  <div className="text-lg font-medium">{option.label}</div>
                </motion.button>
              ))}
            </div>
          )}

          {/* Style Selection */}
          {currentStep === "style" && (
            <div className="space-y-3">
              {STYLE_OPTIONS.map((option) => (
                <motion.button
                  key={option.value}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleSelect("style", option.value)}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    settings.style === option.value
                      ? "border-primary bg-primary/10"
                      : "border-gray-200 hover:border-primary/50"
                  }`}
                >
                  <div className="font-medium text-lg">{option.label}</div>
                  <div className="text-sm text-gray-500">{option.description}</div>
                </motion.button>
              ))}
            </div>
          )}

          {/* MBTI Selection */}
          {currentStep === "mbti" && (
            <div className="grid grid-cols-4 gap-2">
              {MBTI_TYPES.map((mbti) => (
                <motion.button
                  key={mbti}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSelect("mbti", mbti)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    settings.mbti === mbti
                      ? "border-primary bg-primary/10"
                      : "border-gray-200 hover:border-primary/50"
                  }`}
                >
                  <div className="font-medium">{mbti}</div>
                </motion.button>
              ))}
            </div>
          )}

          {/* Art Style Selection */}
          {currentStep === "art_style" && (
            <div className="space-y-3">
              {ART_STYLE_OPTIONS.map((option) => (
                <motion.button
                  key={option.value}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleSelect("art_style", option.value)}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    settings.art_style === option.value
                      ? "border-primary bg-primary/10"
                      : "border-gray-200 hover:border-primary/50"
                  }`}
                >
                  <div className="font-medium text-lg">{option.label}</div>
                  <div className="text-sm text-gray-500">{option.description}</div>
                </motion.button>
              ))}
            </div>
          )}

          {/* Confirmation */}
          {currentStep === "confirm" && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">성별</span>
                  <span className="font-medium">
                    {GENDER_OPTIONS.find((o) => o.value === settings.gender)?.label}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">성격</span>
                  <span className="font-medium">
                    {STYLE_OPTIONS.find((o) => o.value === settings.style)?.label}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">MBTI</span>
                  <span className="font-medium">{settings.mbti}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">그림체</span>
                  <span className="font-medium">
                    {ART_STYLE_OPTIONS.find((o) => o.value === settings.art_style)?.label}
                  </span>
                </div>
              </div>
              <p className="text-center text-gray-600 text-sm">
                위 설정으로 AI 파트너가 생성됩니다
              </p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleBack}
              disabled={currentStepIndex === 0}
              className={`px-6 py-3 rounded-full font-medium ${
                currentStepIndex === 0
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              이전
            </motion.button>

            {currentStep === "confirm" ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-8 py-3 rounded-full font-medium bg-primary text-white hover:bg-secondary disabled:bg-gray-300"
              >
                {isSubmitting ? "생성 중..." : "게임 시작"}
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNext}
                disabled={!canProceed()}
                className={`px-8 py-3 rounded-full font-medium ${
                  canProceed()
                    ? "bg-primary text-white hover:bg-secondary"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                다음
              </motion.button>
            )}
          </div>
        </motion.div>
      </div>
    </main>
    </>
  );
}
