import { MapPin, Clock, Wifi, Bath, Bed, Heart, Navigation, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { CrowdingLevel, CROWDING_LEVELS } from "@/types/crowding";
import { crowdingManager } from "@/utils/crowdingManager";
import { favoriteManager } from "@/utils/favoriteManager";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/**
 * 운영시간과 현재 운영 상태를 확인하는 헬퍼 함수
 */
const getOperatingStatus = (weekendOperation?: boolean, reverseSchedule?: boolean) => {
  const now = new Date();
  const currentHour = now.getHours();
  const currentDay = now.getDay(); // 0: 일요일, 1: 월요일, ..., 6: 토요일
  
  let openHour = 9;
  let closeHour = 18;
  let isOpen = false;
  let hours = "";
  
  // 주말 (토요일: 6, 일요일: 0)
  if (currentDay === 0 || currentDay === 6) {
    if (weekendOperation) {
      if (reverseSchedule) {
        // 역방향: 주말도 8시-22시
        hours = "오전 8시 - 오후 10시";
        openHour = 8;
        closeHour = 22;
      } else {
        // 일반: 주말 9시-18시
        hours = "오전 9시 - 오후 6시";
        openHour = 9;
        closeHour = 18;
      }
      isOpen = currentHour >= openHour && currentHour < closeHour;
    } else {
      hours = "운영안함";
      isOpen = false;
    }
  }
  // 평일
  else {
    if (reverseSchedule) {
      // 역방향 스케줄: 화목은 9-18시, 월수금은 8-22시
      if (currentDay === 2 || currentDay === 4) { // 화목
        hours = "오전 9시 - 오후 6시";
        openHour = 9;
        closeHour = 18;
      } else { // 월수금
        hours = "오전 8시 - 오후 10시";
        openHour = 8;
        closeHour = 22;
      }
    } else {
      // 일반 스케줄: 화목은 8-22시, 월수금은 9-18시
      if (currentDay === 2 || currentDay === 4) { // 화목
        hours = "오전 8시 - 오후 10시";
        openHour = 8;
        closeHour = 22;
      } else { // 월수금
        hours = "오전 9시 - 오후 6시";
        openHour = 9;
        closeHour = 18;
      }
    }
    isOpen = currentHour >= openHour && currentHour < closeHour;
  }
  
  return {
    hours,
    isOpen,
    status: isOpen ? "운영중" : "운영종료"
  };
};

/**
 * 쉼터 데이터 인터페이스
 */
export interface Shelter {
  id: string;
  name: string;
  address: string;
  distance: string;
  operatingHours: string;
  waitTime: string;
  facilities: {
    wifi: boolean;
    showers: boolean;
    beds: boolean;
    firstAid: boolean;
  };
  coordinates: {
    lat: number;
    lng: number;
  };
  // New fields from muduwi_real.json
  facilityType?: string;
  facilityArea?: string;
  capacity?: string;
  fanCount?: string;
  acCount?: string;
  nightOperation?: boolean;
  weekendOperation?: boolean;
  reverseSchedule?: boolean; // 역방향 운영시간 (월수금토일: 8-22시, 화목: 9-18시)
  accommodationAvailable?: boolean;
  specialNotes?: string;
  dataStandardDate?: string;
  // Legacy fields (optional for backward compatibility)
  use_prnb?: number;
  r_area_sqr?: string;
  rmrk?: string | null;
  facility_type1?: string;
  facility_type2?: string;
}

/**
 * ShelterCard 컴포넌트 props
 */
interface ShelterCardProps {
  shelter: Shelter;
  showMap?: boolean;
  onClick?: () => void;
}

/**
 * ShelterCard 컴포넌트 - 카드 형태로 쉼터 정보를 표시합니다
 * 쉼터 목록과 추천에서 사용됩니다
 */
const ShelterCard = ({ shelter, showMap = false, onClick }: ShelterCardProps) => {
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  const [crowdingLevel, setCrowdingLevel] = useState<CrowdingLevel>("여유");
  const [hourlyClicks, setHourlyClicks] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  // 운영 상태 계산 (useMemo로 최적화)
  const operatingStatus = useMemo(() => getOperatingStatus(shelter.weekendOperation, shelter.reverseSchedule), [shelter.weekendOperation, shelter.reverseSchedule]);

  // 혼잡도 정보 로드
  useEffect(() => {
    const crowdingData = crowdingManager.getCrowdingData(shelter.id, shelter.capacity);
    setCrowdingLevel(crowdingData.level);
    setHourlyClicks(crowdingData.hourlyClicks);
  }, [shelter.id, shelter.capacity]);

  // 즐겨찾기 상태 로드
  useEffect(() => {
    setIsFavorite(favoriteManager.isFavorite(shelter.id));
  }, [shelter.id]);

  // 즐겨찾기 토글 핸들러
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // 카드 클릭 이벤트 방지
    
    if (!isLoggedIn) {
      toast({
        title: "로그인이 필요합니다",
        description: "즐겨찾기 기능을 사용하려면 로그인해주세요.",
        action: (
          <Button variant="outline" size="sm" onClick={() => router.push('/login')}>
            로그인하기
          </Button>
        ),
      });
      return;
    }

    const newFavoriteStatus = favoriteManager.toggleFavorite(shelter.id);
    setIsFavorite(newFavoriteStatus);
    
    toast({
      title: newFavoriteStatus ? "즐겨찾기 추가" : "즐겨찾기 제거",
      description: newFavoriteStatus 
        ? `${shelter.name}이(가) 즐겨찾기에 추가되었습니다.`
        : `${shelter.name}이(가) 즐겨찾기에서 제거되었습니다.`,
    });
  };

  // 카드 클릭 핸들러
  const handleCardClick = () => {
    // 클릭 데이터 기록
    crowdingManager.recordClick(shelter.id);
    
    // 혼잡도 정보 업데이트
    const updatedData = crowdingManager.getCrowdingData(shelter.id, shelter.capacity);
    setCrowdingLevel(updatedData.level);
    setHourlyClicks(updatedData.hourlyClicks);
    
    // 부모 컴포넌트의 onClick 호출
    if (onClick) {
      onClick();
    }
  };

  // 혼잡도 정보 가져오기 (안전한 fallback 포함)
  const crowdingInfo = CROWDING_LEVELS?.[crowdingLevel] || {
    level: "여유",
    color: "text-green-600",
    bgColor: "bg-green-100",
    description: "여유로운 상태"
  };

  return (
    <Card 
      className={`hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary ${onClick ? 'cursor-pointer' : ''} relative`}
      onClick={handleCardClick}
    >
      {/* 즐겨찾기 버튼 */}
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 z-10 p-1 h-8 w-8 hover:bg-background/80"
        onClick={handleFavoriteClick}
      >
        <Heart 
          className={`w-4 h-4 transition-colors ${
            isFavorite 
              ? 'text-red-500 fill-current' 
              : 'text-muted-foreground hover:text-red-500'
          }`} 
        />
      </Button>

      <CardHeader className="pb-3 pr-12">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold text-foreground mb-1 truncate">
              {shelter.name}
            </CardTitle>
            <div className="flex items-center text-muted-foreground text-sm mb-2">
              <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
              <span className="font-paperlogy-light truncate">{shelter.address}</span>
            </div>
            <div className="flex items-center space-x-3 text-sm flex-wrap">
              <div className="flex items-center text-muted-foreground">
                <Navigation className="w-4 h-4 mr-1" />
                <span className="font-paperlogy-light whitespace-nowrap">{shelter.distance}</span>
              </div>
              <div className="flex items-center text-muted-foreground">
                <Clock className="w-4 h-4 mr-1" />
                <span className="font-paperlogy-light whitespace-nowrap">
                  {operatingStatus.hours}
                  <span className={`ml-2 px-1 py-0.5 rounded text-xs ${operatingStatus.isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {operatingStatus.status}
                  </span>
                </span>
              </div>
            </div>
          </div>
          
          {/* 혼잡도 상태 */}
          <div className="text-right">
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mb-2 ${crowdingInfo.bgColor} ${crowdingInfo.color}`}>
              <Users className="w-3 h-3 mr-1" />
              {crowdingInfo.level}
            </div>
            <div className="text-xs text-muted-foreground font-paperlogy-light">
              1시간: {hourlyClicks}회 클릭
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* 시설 정보 */}
        <div className="space-y-3 mb-4">
          {/* 기존 시설 아이콘 */}
          <div className="flex items-center space-x-2">
            {shelter.facilities.wifi && (
              <div className="flex items-center text-accent">
                <Wifi className="w-4 h-4" />
              </div>
            )}
            {shelter.facilities.showers && (
              <div className="flex items-center text-accent">
                <Bath className="w-4 h-4" />
              </div>
            )}
            {shelter.facilities.beds && (
              <div className="flex items-center text-accent">
                <Bed className="w-4 h-4" />
              </div>
            )}
            {shelter.facilities.firstAid && (
              <div className="flex items-center text-accent">
                <Heart className="w-4 h-4" />
              </div>
            )}
          </div>
          
          {/* 새로운 시설 정보 */}
          <div className="text-xs text-muted-foreground space-y-1">
            {shelter.facilityType && (
              <div className="flex justify-between">
                <span>시설유형:</span>
                <span className="font-medium">{shelter.facilityType}</span>
              </div>
            )}
            {shelter.capacity && (
              <div className="flex justify-between">
                <span>이용 가능 인원:</span>
                <span className="font-medium">{shelter.capacity}명</span>
              </div>
            )}
            {shelter.facilityArea && (
              <div className="flex justify-between">
                <span>시설 면적:</span>
                <span className="font-medium">{shelter.facilityArea}㎡</span>
              </div>
            )}
            {(shelter.fanCount || shelter.acCount) && (
              <div className="flex justify-between">
                <span>냉난방:</span>
                <span className="font-medium">
                  선풍기 {shelter.fanCount || 0}개, 에어컨 {shelter.acCount || 0}개
                </span>
              </div>
            )}
            {shelter.accommodationAvailable && (
              <div className="flex justify-between">
                <span>숙박:</span>
                <span className="font-medium text-green-600">가능</span>
              </div>
            )}
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex space-x-2">
          <Button size="sm" asChild className="flex-1">
            <Link href={`/shelter/${shelter.id}`}>
              상세보기
            </Link>
          </Button>
          <Button variant="outline" size="sm">
            길찾기
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ShelterCard;