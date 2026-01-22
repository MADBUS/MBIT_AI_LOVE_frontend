"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface SpecialEventModalProps {
  isOpen: boolean;
  imageUrl: string;
  eventDescription: string;
  affectionChange: number;
  onClose: () => void;
  isBlurred?: boolean;
}

export default function SpecialEventModal({
  isOpen,
  imageUrl,
  eventDescription,
  affectionChange,
  onClose,
  isBlurred = false,
}: SpecialEventModalProps) {
  if (!isOpen) return null;

  // 이미지 URL이 상대경로인 경우 백엔드 URL 추가
  const fullImageUrl = imageUrl.startsWith("http")
    ? imageUrl
    : `${process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:8000"}${imageUrl}`;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-white rounded-3xl overflow-hidden max-w-lg w-full shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 이미지 영역 */}
          <div className="relative aspect-[4/3] bg-gradient-to-b from-pink-100 to-purple-100">
            {imageUrl && (
              <Image
                src={fullImageUrl}
                alt={eventDescription}
                fill
                className={`object-cover ${isBlurred ? "blur-xl" : ""}`}
                unoptimized
              />
            )}

            {/* 블러 시 잠금 표시 */}
            {isBlurred && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <div className="text-center text-white">
                  <div className="text-4xl mb-2">🔒</div>
                  <p className="text-sm">프리미엄 회원 전용</p>
                </div>
              </div>
            )}

            {/* 호감도 변화 배지 */}
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="absolute top-4 right-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 py-2 rounded-full font-bold shadow-lg"
            >
              {affectionChange > 0 ? `+${affectionChange}` : affectionChange} 💕
            </motion.div>
          </div>

          {/* 텍스트 영역 */}
          <div className="p-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-xl font-bold text-pink-500 mb-2">
                특별 이벤트!
              </h2>
              <p className="text-gray-600 mb-4">{eventDescription}</p>

              {affectionChange > 0 ? (
                <p className="text-sm text-pink-400">
                  호감도가 {affectionChange} 상승했습니다!
                </p>
              ) : (
                <p className="text-sm text-gray-400">
                  아쉽지만 다음 기회가 있어요...
                </p>
              )}
            </motion.div>

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="mt-6 bg-gradient-to-r from-pink-500 to-rose-500 text-white px-8 py-3 rounded-full font-bold shadow-lg"
            >
              계속하기
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
