import { ClickData, CrowdingData, CrowdingLevel, CROWDING_THRESHOLDS } from '@/types/crowding';

// 로컬 스토리지 키
const STORAGE_KEY = 'shelter-crowding-data';
const CLICKS_KEY = 'shelter-clicks';

// 혼잡도 관리 클래스
export class CrowdingManager {
  private static instance: CrowdingManager;
  
  static getInstance(): CrowdingManager {
    if (!CrowdingManager.instance) {
      CrowdingManager.instance = new CrowdingManager();
    }
    return CrowdingManager.instance;
  }

  // 클릭 데이터 저장
  recordClick(shelterId: string): void {
    try {
      const now = Date.now();
      const newClick: ClickData = {
        timestamp: now,
        shelterId
      };

      // 기존 클릭 데이터 가져오기
      const existingClicks = this.getStoredClicks();
      
      // 새 클릭 추가
      existingClicks.push(newClick);
      
      // 1시간 이전 데이터 정리
      const oneHourAgo = now - (60 * 60 * 1000);
      const recentClicks = existingClicks.filter(click => click.timestamp > oneHourAgo);
      
      // 로컬 스토리지에 저장 (브라우저 환경에서만)
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.setItem(CLICKS_KEY, JSON.stringify(recentClicks));
      }
      
      // 혼잡도 데이터 업데이트
      this.updateCrowdingData();
      
      console.log(`🔥 쉼터 클릭 기록: ${shelterId}, 현재 시간 기준 총 클릭: ${this.getHourlyClicks(shelterId)}회`);
    } catch (error) {
      console.error('클릭 데이터 저장 실패:', error);
    }
  }

  // 특정 쉼터의 1시간 클릭 수 계산
  getHourlyClicks(shelterId: string): number {
    const clicks = this.getStoredClicks();
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    return clicks.filter(click => 
      click.shelterId === shelterId && 
      click.timestamp > oneHourAgo
    ).length;
  }

  // 혼잡도 레벨 계산
  calculateCrowdingLevel(hourlyClicks: number): CrowdingLevel {
    if (hourlyClicks >= CROWDING_THRESHOLDS.BUSY) {
      return "혼잡";
    } else if (hourlyClicks >= CROWDING_THRESHOLDS.NORMAL) {
      return "보통";
    } else {
      return "여유";
    }
  }

  // 특정 쉼터의 혼잡도 정보 가져오기
  getCrowdingData(shelterId: string): CrowdingData {
    const hourlyClicks = this.getHourlyClicks(shelterId);
    const level = this.calculateCrowdingLevel(hourlyClicks);
    
    return {
      shelterId,
      hourlyClicks,
      lastUpdated: Date.now(),
      level
    };
  }

  // 모든 쉼터의 혼잡도 정보 가져오기
  getAllCrowdingData(): Record<string, CrowdingData> {
    const crowdingData: Record<string, CrowdingData> = {};
    const clicks = this.getStoredClicks();
    
    // 클릭된 쉼터들의 ID 추출
    const shelterIdsSet = new Set(clicks.map(click => click.shelterId));
    const shelterIds = Array.from(shelterIdsSet);
    
    shelterIds.forEach(shelterId => {
      crowdingData[shelterId] = this.getCrowdingData(shelterId);
    });
    
    return crowdingData;
  }

  // 혼잡도 데이터 업데이트 및 저장
  private updateCrowdingData(): void {
    try {
      // 브라우저 환경에서만 localStorage 사용
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        const allCrowdingData = this.getAllCrowdingData();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allCrowdingData));
      }
    } catch (error) {
      console.error('혼잡도 데이터 업데이트 실패:', error);
    }
  }

  // 저장된 클릭 데이터 가져오기
  private getStoredClicks(): ClickData[] {
    try {
      // 브라우저 환경에서만 localStorage 사용
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return [];
      }
      
      const stored = localStorage.getItem(CLICKS_KEY);
      if (!stored) return [];
      
      const clicks: ClickData[] = JSON.parse(stored);
      
      // 1시간 이전 데이터 자동 정리
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      return clicks.filter(click => click.timestamp > oneHourAgo);
    } catch (error) {
      console.error('클릭 데이터 로드 실패:', error);
      return [];
    }
  }

  // 저장된 혼잡도 데이터 가져오기
  getStoredCrowdingData(): Record<string, CrowdingData> {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return {};
      
      return JSON.parse(stored);
    } catch (error) {
      console.error('혼잡도 데이터 로드 실패:', error);
      return {};
    }
  }

  // 데이터 초기화 (개발/테스트용)
  clearAllData(): void {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CLICKS_KEY);
    console.log('🧹 혼잡도 데이터 초기화 완료');
  }

  // 혼잡도 통계 정보
  getStatistics(): {
    totalClicks: number;
    activeHour: number;
    crowdingLevels: Record<CrowdingLevel, number>;
  } {
    const clicks = this.getStoredClicks();
    const crowdingData = this.getAllCrowdingData();
    
    const stats = {
      totalClicks: clicks.length,
      activeHour: Object.keys(crowdingData).length,
      crowdingLevels: {
        "여유": 0,
        "보통": 0,
        "혼잡": 0
      } as Record<CrowdingLevel, number>
    };

    Object.values(crowdingData).forEach(data => {
      stats.crowdingLevels[data.level]++;
    });

    return stats;
  }
}

// 싱글톤 인스턴스 내보내기
export const crowdingManager = CrowdingManager.getInstance();