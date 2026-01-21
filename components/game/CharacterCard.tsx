"use client";

import { motion } from "framer-motion";

interface Character {
  id: number;
  name: string;
  type: string;
  personality: string;
}

interface CharacterCardProps {
  character: Character;
  onSelect: () => void;
}

const typeEmoji: Record<string, string> = {
  tsundere: "😤",
  cool: "😎",
  cute: "🥰",
};

const typeLabel: Record<string, string> = {
  tsundere: "츤데레",
  cool: "쿨뷰티",
  cute: "귀여움",
};

export default function CharacterCard({
  character,
  onSelect,
}: CharacterCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -5 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className="bg-white rounded-2xl p-6 shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
    >
      <div className="text-center">
        <div className="text-6xl mb-4">{typeEmoji[character.type] || "💕"}</div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          {character.name}
        </h3>
        <span className="inline-block px-3 py-1 bg-pink-100 text-pink-600 rounded-full text-sm mb-3">
          {typeLabel[character.type] || character.type}
        </span>
        <p className="text-gray-600 text-sm leading-relaxed">
          {character.personality}
        </p>
      </div>
    </motion.div>
  );
}
