"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { MapPin, Clock, Wifi, Bath, Bed, Heart, Navigation, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { CrowdingLevel, CROWDING_LEVELS } from "@/types/crowding";
import { crowdingManager } from "@/utils/crowdingManager";
import { favoriteManager } from "@/utils/favoriteManager";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
  facilityType?: string;
  facilityArea?: string;
  capacity?: string;
  fanCount?: string;
  acCount?: string;
  nightOperation?: boolean;
  weekendOperation?: boolean;
  reverseSchedule?: boolean;
  accommodationAvailable?: boolean;
  specialNotes?: string;
  dataStandardDate?: string;
  use_prnb?: number;
  r_area_sqr?: string;
  rmrk?: string | null;
  facility_type1?: string;
  facility_type2?: string;
  latitude?: number;
  longitude?: number;
  type?: string;
}

interface ShelterCardProps {
  shelter: Shelter;
  showMap?: boolean;
  showFavoriteButton?: boolean;
  isDetailView?: boolean;
  onClick?: () => void;
}

const ShelterCard: React.FC<ShelterCardProps> = ({ 
  shelter, 
  showMap = false, 
  showFavoriteButton = true,
  isDetailView = false,
  onClick 
}) => {
  // Always call hooks at top level
  const { user, isLoggedIn } = useAuth();
  const router = useRouter();
  
  const [crowdingLevel, setCrowdingLevel] = useState<CrowdingLevel>("여유");
  const [hourlyClicks, setHourlyClicks] = useState<number>(0);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [isLoadingFavorite, setIsLoadingFavorite] = useState<boolean>(false);

  // Memoized operating status
  const operatingStatus = useMemo(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay();
    
    let isOpen = true;
    let hours = "오전 9시 - 오후 6시";
    
    if (currentDay === 0 || currentDay === 6) {
      isOpen = false;
      hours = "주말 휴무";
    } else if (currentHour < 9 || currentHour >= 18) {
      isOpen = false;
    }
    
    return {
      hours,
      isOpen,
      status: isOpen ? "운영중" : "운영종료"
    };
  }, []);

  const crowdingInfo = useMemo(() => {
    const info = CROWDING_LEVELS?.[crowdingLevel];
    if (!info) {
      return {
        level: "여유",
        color: "text-green-600",
        bgColor: "bg-green-100",
        description: "여유로운 상태"
      };
    }
    return info;
  }, [crowdingLevel]);

  // Effects
  useEffect(() => {
    if (shelter?.id) {
      const crowdingData = crowdingManager.getCrowdingData(shelter.id, shelter.capacity);
      setCrowdingLevel(crowdingData.level);
      setHourlyClicks(crowdingData.hourlyClicks);
    }
  }, [shelter?.id, shelter?.capacity]);

  useEffect(() => {
    if (shelter?.id) {
      const favoriteStatus = favoriteManager.isFavorite(shelter.id);
      setIsFavorite(favoriteStatus);
    }
  }, [shelter?.id]);

  // Callbacks
  const handleFavoriteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isLoggedIn || !user) {
      toast({
        title: "로그인이 필요합니다",
        description: "즐겨찾기 기능을 사용하려면 로그인해주세요.",
      });
      return;
    }

    if (isLoadingFavorite) return;

    setIsLoadingFavorite(true);
    
    try {
      const newFavoriteStatus = favoriteManager.toggleFavorite(shelter.id);
      setIsFavorite(newFavoriteStatus);
      
      toast({
        title: newFavoriteStatus ? "즐겨찾기 추가" : "즐겨찾기 제거",
        description: newFavoriteStatus 
          ? `${shelter.name}이(가) 즐겨찾기에 추가되었습니다.`
          : `${shelter.name}이(가) 즐겨찾기에서 제거되었습니다.`,
      });
    } catch (error) {
      console.error("즐겨찾기 처리 중 오류:", error);
      toast({
        title: "오류 발생",
        description: "즐겨찾기 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingFavorite(false);
    }
  }, [isLoggedIn, user, isLoadingFavorite, shelter.id, shelter.name]);

  const handleCardClick = useCallback(() => {
    if (shelter?.id) {
      crowdingManager.recordClick(shelter.id);
      
      const updatedData = crowdingManager.getCrowdingData(shelter.id, shelter.capacity);
      setCrowdingLevel(updatedData.level);
      setHourlyClicks(updatedData.hourlyClicks);
    }
    
    if (onClick) {
      onClick();
    }
  }, [shelter?.id, shelter?.capacity, onClick]);

  const handleNavigate = useCallback(() => {
    const lat = shelter.latitude || shelter.coordinates?.lat;
    const lng = shelter.longitude || shelter.coordinates?.lng;
    
    if (lat && lng) {
      const tmapUrl = `https://tmap.life/route?goalname=${encodeURIComponent(shelter.name)}&goalx=${lng}&goaly=${lat}`;
      window.open(tmapUrl, '_blank');
    } else {
      toast({
        title: "위치 정보 없음",
        description: "이 쉼터의 위치 정보가 없어 길찾기를 제공할 수 없습니다.",
        variant: "destructive",
      });
    }
  }, [shelter.name, shelter.latitude, shelter.longitude, shelter.coordinates]);

  // Early return
  if (!shelter) {
    return null;
  }

  return (
    <Card 
      className={`hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary ${onClick ? 'cursor-pointer' : ''} relative`}
      onClick={handleCardClick}
    >
      {showFavoriteButton && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 z-10 p-1 h-8 w-8 hover:bg-background/80"
          onClick={handleFavoriteClick}
          disabled={isLoadingFavorite}
        >
          <Heart 
            className={`w-4 h-4 transition-colors ${
              isFavorite 
                ? 'text-red-500 fill-current' 
                : 'text-muted-foreground hover:text-red-500'
            }`} 
          />
        </Button>
      )}

      <CardHeader className="pb-3 pr-12">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold text-foreground mb-1 truncate">
              {shelter.name}
            </CardTitle>
            <div className="flex items-center text-muted-foreground text-sm mb-2">
              <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
              <span className="truncate">{shelter.address}</span>
            </div>
            <div className="flex items-center space-x-3 text-sm flex-wrap">
              <div className="flex items-center text-muted-foreground">
                <Navigation className="w-4 h-4 mr-1" />
                <span className="whitespace-nowrap">{shelter.distance}</span>
              </div>
              <div className="flex items-center text-muted-foreground">
                <Clock className="w-4 h-4 mr-1" />
                <span className="whitespace-nowrap">
                  {operatingStatus.hours}
                  <span className={`ml-2 px-1 py-0.5 rounded text-xs ${operatingStatus.isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {operatingStatus.status}
                  </span>
                </span>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mb-2 ${crowdingInfo.bgColor} ${crowdingInfo.color}`}>
              <Users className="w-3 h-3 mr-1" />
              {crowdingInfo.level}
            </div>
            <div className="text-xs text-muted-foreground">
              1시간: {hourlyClicks}회 클릭
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3 mb-4">
          <div className="flex items-center space-x-2">
            {shelter.facilities?.wifi && (
              <div className="flex items-center text-accent">
                <Wifi className="w-4 h-4" />
              </div>
            )}
            {shelter.facilities?.showers && (
              <div className="flex items-center text-accent">
                <Bath className="w-4 h-4" />
              </div>
            )}
            {shelter.facilities?.beds && (
              <div className="flex items-center text-accent">
                <Bed className="w-4 h-4" />
              </div>
            )}
            {shelter.facilities?.firstAid && (
              <div className="flex items-center text-accent">
                <Heart className="w-4 h-4" />
              </div>
            )}
          </div>
          
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
          </div>
        </div>

        <div className="flex space-x-2">
          <Button size="sm" asChild className="flex-1">
            <Link href={`/shelter/${shelter.id}`}>
              상세보기
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={handleNavigate}>
            길찾기
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ShelterCard;
export { ShelterCard };
export type { ShelterCardProps };