"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import LoginButton from "@/components/auth/LoginButton";
import { api } from "@/lib/api";
import { useUserStore } from "@/store/useUserStore";
import { type GameSession } from "@/types";

// Floating hearts decoration
const FloatingHearts = () => {
  const hearts = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: Math.random() * 5,
    duration: 3 + Math.random() * 4,
    size: 12 + Math.random() * 20,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {hearts.map((heart) => (
        <motion.div
          key={heart.id}
          className="absolute text-pink-300/40"
          style={{ left: heart.left, fontSize: heart.size }}
          initial={{ y: "100vh", opacity: 0 }}
          animate={{ y: "-100vh", opacity: [0, 1, 1, 0] }}
          transition={{
            duration: heart.duration,
            delay: heart.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          ♥
        </motion.div>
      ))}
    </div>
  );
};

// Character silhouettes
const CharacterDecorations = () => {
  return (
    <>
      {/* Left character silhouette */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1, delay: 0.3 }}
        className="absolute left-4 md:left-16 bottom-0 w-32 md:w-48 h-64 md:h-96"
      >
        <div className="relative w-full h-full">
          {/* Male character illustration */}
          <div className="absolute bottom-0 w-full">
            <svg viewBox="0 0 200 400" className="w-full h-auto opacity-20">
              <defs>
                <linearGradient id="maleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
              {/* Head */}
              <circle cx="100" cy="60" r="45" fill="url(#maleGrad)" />
              {/* Body */}
              <path d="M50 120 Q100 100 150 120 L160 350 Q100 360 40 350 Z" fill="url(#maleGrad)" />
              {/* Hair */}
              <path d="M55 50 Q100 10 145 50 Q140 70 100 65 Q60 70 55 50" fill="url(#maleGrad)" />
            </svg>
          </div>
        </div>
      </motion.div>

      {/* Right character silhouette */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="absolute right-4 md:right-16 bottom-0 w-32 md:w-48 h-64 md:h-96"
      >
        <div className="relative w-full h-full">
          {/* Female character illustration */}
          <div className="absolute bottom-0 w-full">
            <svg viewBox="0 0 200 400" className="w-full h-auto opacity-20">
              <defs>
                <linearGradient id="femaleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ec4899" />
                  <stop offset="100%" stopColor="#f472b6" />
                </linearGradient>
              </defs>
              {/* Head */}
              <circle cx="100" cy="60" r="42" fill="url(#femaleGrad)" />
              {/* Long hair */}
              <path d="M40 40 Q30 150 50 250 Q70 260 70 150 Q80 80 100 70 Q120 80 130 150 Q130 260 150 250 Q170 150 160 40 Q100 0 40 40" fill="url(#femaleGrad)" />
              {/* Body/Dress */}
              <path d="M60 110 Q100 95 140 110 L170 380 Q100 400 30 380 Z" fill="url(#femaleGrad)" />
            </svg>
          </div>
        </div>
      </motion.div>

      {/* Decorative circles */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-pink-200/30 rounded-full blur-2xl" />
      <div className="absolute top-40 right-20 w-32 h-32 bg-purple-200/30 rounded-full blur-3xl" />
      <div className="absolute bottom-40 left-1/4 w-24 h-24 bg-pink-300/20 rounded-full blur-2xl" />
    </>
  );
};

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { user, setUser, setLoading, isHydrated, clearUser } = useUserStore();
  const [isInitializing, setIsInitializing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeGame, setActiveGame] = useState<GameSession | null>(null);
  const [loadingGames, setLoadingGames] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const loadActiveGame = async () => {
      if (!user?.id) return;
      setLoadingGames(true);
      try {
        const response = await api.get(`/games?user_id=${user.id}`);
        const playingGame = response.data.find((g: GameSession) => g.status === "playing");
        setActiveGame(playingGame || null);
      } catch (error) {
        console.error("Failed to load games:", error);
      } finally {
        setLoadingGames(false);
      }
    };
    loadActiveGame();
  }, [user?.id]);

  useEffect(() => {
    const initializeUser = async () => {
      if (session?.user?.email && !user && !isInitializing && isHydrated) {
        setIsInitializing(true);
        setLoading(true);

        try {
          const response = await api.post("/auth/users", {
            google_id: (session.user as any).id || session.user.email,
            email: session.user.email,
            name: session.user.name || "User",
          });

          setUser(response.data);
        } catch (error) {
          console.error("Failed to initialize user:", error);
        } finally {
          setLoading(false);
          setIsInitializing(false);
        }
      }
    };

    initializeUser();
  }, [session, user, isInitializing, isHydrated, setUser, setLoading]);

  const handleStart = () => {
    if (user) {
      if (!user.mbti) {
        router.push("/onboarding");
      } else {
        router.push("/characters");
      }
    }
  };

  const handleContinue = () => {
    if (activeGame) {
      router.push(`/game/${activeGame.id}`);
    }
  };

  const handleLogout = async () => {
    clearUser();
    await signOut({ redirect: false });
    router.push("/");
  };

  if (!mounted) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-pink-100 to-purple-100">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-pink-100 via-purple-50 to-indigo-100 relative overflow-hidden">
      {/* Background decorations */}
      <FloatingHearts />
      <CharacterDecorations />

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center relative z-10"
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600 mb-4 drop-shadow-sm">
            MBTI 연애 시뮬레이션
          </h1>
        </motion.div>
        <p className="text-xl text-gray-600 mb-8">
          AI와 함께하는 새로운 연애 경험
        </p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="space-y-4 flex flex-col items-center"
        >
          {status === "loading" || isInitializing ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
            </div>
          ) : session ? (
            <div className="space-y-4">
              <p className="text-gray-700">
                환영합니다, {session.user?.name}님!
              </p>
              {loadingGames ? (
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
                </div>
              ) : activeGame ? (
                <div className="space-y-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleContinue}
                    className="px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full text-xl font-semibold shadow-lg hover:shadow-xl transition-all w-full"
                  >
                    이어하기 (Scene {activeGame.current_scene}/10)
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleStart}
                    disabled={!user}
                    className="px-6 py-3 bg-white text-primary border-2 border-primary rounded-full font-medium hover:bg-primary/5 transition-all w-full"
                  >
                    새 게임 시작
                  </motion.button>
                </div>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleStart}
                  disabled={!user}
                  className="px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full text-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed"
                >
                  {!user ? "로딩 중..." : user.mbti ? "게임 시작하기" : "시작하기"}
                </motion.button>
              )}
              <div className="flex justify-center gap-4 pt-2">
                <Link
                  href="/mypage"
                  className="text-gray-600 hover:text-primary transition-colors"
                >
                  마이페이지
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-primary transition-colors"
                >
                  로그아웃
                </button>
              </div>
            </div>
          ) : (
            <LoginButton />
          )}
        </motion.div>
      </motion.div>
    </main>
  );
}
