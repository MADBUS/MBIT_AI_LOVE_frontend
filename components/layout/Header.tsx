"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useUserStore } from "@/store/useUserStore";

export default function Header() {
  const { data: session } = useSession();
  const router = useRouter();
  const { user, clearUser } = useUserStore();

  const handleLogout = async () => {
    clearUser();
    await signOut({ redirect: false });
    router.push("/");
  };

  if (!session) return null;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-primary">
          MBTI 연애 시뮬레이션
        </Link>

        <nav className="flex items-center gap-4">
          <Link
            href="/mypage"
            className="text-gray-600 hover:text-primary transition-colors"
          >
            마이페이지
          </Link>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            로그아웃
          </motion.button>
        </nav>
      </div>
    </header>
  );
}
