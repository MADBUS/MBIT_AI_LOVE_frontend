"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api";
import { useUserStore } from "@/store/useUserStore";
import { MBTI_TYPES } from "@/types";
import Header from "@/components/layout/Header";

export default function MyPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { user, updateMbti } = useUserStore();
  const [selectedMbti, setSelectedMbti] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user?.mbti) {
      setSelectedMbti(user.mbti);
    }
  }, [user]);

  const handleSaveMbti = async () => {
    if (!selectedMbti || !user?.id) return;

    setIsSaving(true);
    try {
      await api.patch(`/users/${user.id}/mbti`, { mbti: selectedMbti });
      updateMbti(selectedMbti);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update MBTI:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-pink-50 to-purple-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!session) {
    router.push("/");
    return null;
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-50 pt-20 pb-8 px-4">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-lg"
          >
            <h1 className="text-2xl font-bold text-primary mb-6">마이페이지</h1>

            {/* Profile Section */}
            <div className="mb-8">
              <h2 className="text-lg font-medium text-gray-700 mb-4">프로필</h2>
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">이름</span>
                  <span className="font-medium">{session.user?.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">이메일</span>
                  <span className="font-medium">{session.user?.email}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">회원 등급</span>
                  <span className={`font-medium ${user?.is_premium ? "text-yellow-500" : "text-gray-600"}`}>
                    {user?.is_premium ? "프리미엄" : "일반"}
                  </span>
                </div>
              </div>
            </div>

            {/* MBTI Section */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-700">내 MBTI</h2>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-sm text-primary hover:underline"
                  >
                    수정
                  </button>
                )}
              </div>

              {isEditing ? (
                <div>
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {MBTI_TYPES.map((mbti) => (
                      <motion.button
                        key={mbti}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedMbti(mbti)}
                        className={`p-2 rounded-lg border-2 transition-all text-sm ${
                          selectedMbti === mbti
                            ? "border-primary bg-primary/10"
                            : "border-gray-200 hover:border-primary/50"
                        }`}
                      >
                        {mbti}
                      </motion.button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setIsEditing(false);
                        setSelectedMbti(user?.mbti || null);
                      }}
                      className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium"
                    >
                      취소
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSaveMbti}
                      disabled={isSaving || selectedMbti === user?.mbti}
                      className="flex-1 py-2 bg-primary text-white rounded-lg font-medium disabled:bg-gray-300"
                    >
                      {isSaving ? "저장 중..." : "저장"}
                    </motion.button>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <span className="text-2xl font-bold text-primary">
                    {user?.mbti || "미설정"}
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push("/characters")}
                className="w-full py-3 bg-primary text-white rounded-xl font-medium"
              >
                새 게임 시작
              </motion.button>
            </div>
          </motion.div>
        </div>
      </main>
    </>
  );
}
