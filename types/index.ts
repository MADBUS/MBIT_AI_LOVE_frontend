// User types
export interface User {
  id: string;
  google_id: string;
  email: string;
  name: string;
  mbti: string | null;
  is_premium: boolean;
  created_at: string;
}

// Character Setting types
export interface CharacterSetting {
  id: string;
  gender: "male" | "female";
  style: "tsundere" | "cool" | "cute" | "sexy" | "pure";
  mbti: string;
  art_style: "anime" | "realistic" | "watercolor";
  created_at?: string;
}

export interface CharacterSettingCreate {
  user_id: string;
  gender: "male" | "female";
  style: "tsundere" | "cool" | "cute" | "sexy" | "pure";
  mbti: string;
  art_style: "anime" | "realistic" | "watercolor";
}

// Game Session types
export interface GameSession {
  id: string;
  user_id: string;
  affection: number;
  current_scene: number;
  status: "playing" | "happy_ending" | "sad_ending";
  save_slot: number;
  created_at: string;
  character_setting?: CharacterSetting;
}

// MBTI types
export const MBTI_TYPES = [
  "INTJ", "INTP", "ENTJ", "ENTP",
  "INFJ", "INFP", "ENFJ", "ENFP",
  "ISTJ", "ISFJ", "ESTJ", "ESFJ",
  "ISTP", "ISFP", "ESTP", "ESFP",
] as const;

export type MBTIType = typeof MBTI_TYPES[number];

// Character customization options
export const GENDER_OPTIONS = [
  { value: "male", label: "남성", emoji: "👨" },
  { value: "female", label: "여성", emoji: "👩" },
] as const;

export const STYLE_OPTIONS = [
  { value: "tsundere", label: "츤데레", description: "겉으로는 차갑지만 속은 다정한" },
  { value: "cool", label: "쿨뷰티", description: "냉정하고 이성적인" },
  { value: "cute", label: "귀여움", description: "밝고 활발한" },
  { value: "sexy", label: "섹시", description: "성숙하고 매력적인" },
  { value: "pure", label: "청순", description: "순수하고 깨끗한" },
] as const;

export const ART_STYLE_OPTIONS = [
  { value: "anime", label: "애니메이션", description: "일본 애니메이션 스타일" },
  { value: "realistic", label: "실사", description: "사실적인 스타일" },
  { value: "watercolor", label: "수채화", description: "부드러운 수채화 스타일" },
] as const;
