// 혼잡도 관련 타입 정의
export interface ClickData {
  timestamp: number;
  shelterId: string;
}

export interface CrowdingData {
  shelterId: string;
  hourlyClicks: number;
  lastUpdated: number;
  level: CrowdingLevel;
}

export type CrowdingLevel = "여유" | "보통" | "혼잡";

export interface CrowdingLevelInfo {
  level: CrowdingLevel;
  color: string;
  bgColor: string;
  description: string;
  emoji: string;
}

// 혼잡도 레벨별 정보
export const CROWDING_LEVELS: Record<CrowdingLevel, CrowdingLevelInfo> = {
  "여유": {
    level: "여유",
    color: "bg-green-500",
    bgColor: "bg-green-100",
    description: "여유로운 상태",
    emoji: "😌"
  },
  "보통": {
    level: "보통",
    color: "bg-yellow-500", 
    bgColor: "bg-yellow-100",
    description: "보통 상태",
    emoji: "😐"
  },
  "혼잡": {
    level: "혼잡",
    color: "bg-red-500",
    bgColor: "bg-red-100", 
    description: "혼잡한 상태",
    emoji: "😰"
  }
};

// 혼잡도 계산 기준
export const CROWDING_THRESHOLDS = {
  BUSY: 30,     // 30회 이상: 혼잡
  NORMAL: 15,   // 15-30회: 보통
  RELAXED: 0    // 0-15회: 여유
} as const;