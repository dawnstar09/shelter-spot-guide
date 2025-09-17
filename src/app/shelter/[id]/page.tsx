'use client';

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Clock, Wifi, Bath, Bed, Heart, Navigation, NfcIcon, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import Header from "@/components/Layout/Header";
import { getShelterById } from "@/data/realShelters";
import { crowdingManager } from "@/utils/crowdingManager";
import { CrowdingLevel, CROWDING_LEVELS } from "@/types/crowding";

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
 * 쉼터 상세 페이지 컴포넌트
 * 특정 쉼터에 대한 종합적인 정보를 표시합니다
 * NFC 태그 등록 및 체크인 기능을 포함합니다
 */
const ShelterDetailPage = () => {
  const params = useParams();
  const id = params?.id as string;
  const shelter = id ? getShelterById(id) : null;
  const [crowdingLevel, setCrowdingLevel] = useState<CrowdingLevel>("여유");
  const [hourlyClicks, setHourlyClicks] = useState(0);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [actualDistance, setActualDistance] = useState<string | null>(null);

  // 운영 상태 계산 (useMemo로 최적화)
  const operatingStatus = useMemo(() => getOperatingStatus(shelter?.weekendOperation, shelter?.reverseSchedule), [shelter?.weekendOperation, shelter?.reverseSchedule]);

  // Haversine formula to calculate distance between two points on Earth
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c;
    return d;
  };

  // 사용자 위치 얻기
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          
          if (shelter) {
            const distance = calculateDistance(
              latitude, 
              longitude, 
              shelter.coordinates.lat, 
              shelter.coordinates.lng
            );
            setActualDistance(`${distance.toFixed(1)} km`);
          }
        },
        (error) => {
          console.log('Geolocation error:', error);
          // 위치 허용을 안 했을 때 기본 거리 사용
          if (shelter) {
            setActualDistance(shelter.distance);
          }
        }
      );
    } else {
      // 지리적 위치를 지원하지 않는 경우 기본 거리 사용
      if (shelter) {
        setActualDistance(shelter.distance);
      }
    }
  }, [shelter]);

  // 혼잡도 정보 로드
  useEffect(() => {
    if (shelter) {
      // 페이지 접근 시 클릭 기록
      crowdingManager.recordClick(shelter.id);
      
      const crowdingData = crowdingManager.getCrowdingData(shelter.id, shelter.capacity);
      setCrowdingLevel(crowdingData.level);
      setHourlyClicks(crowdingData.hourlyClicks);
    }
  }, [shelter]);

  if (!shelter) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">쉼터를 찾을 수 없습니다</h1>
            <p className="text-muted-foreground mb-6 font-paperlogy-light">찾으시는 쉼터가 존재하지 않습니다.</p>
            <Button asChild>
              <Link href="/">지도로 돌아가기</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 혼잡도 퍼센트 계산 (새로운 시스템)
  const getCongestionPercentage = (level: CrowdingLevel) => {
    switch (level) {
      case "여유": return 25;
      case "보통": return 65;
      case "혼잡": return 90;
      default: return 0;
    }
  };

  const crowdingInfo = CROWDING_LEVELS[crowdingLevel];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* 경로 표시 */}
        <div className="flex items-center space-x-2 mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/" className="flex items-center space-x-1">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">지도로 돌아가기</span>
              <span className="sm:hidden">뒤로</span>
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* 메인 콘텐츠 */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* 쉼터 헤더 */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-xl sm:text-2xl font-bold mb-2 leading-tight break-words">{shelter.name}</CardTitle>
                    <div className="flex items-start text-muted-foreground text-sm mb-4">
                      <MapPin className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
                      <span className="font-paperlogy-light leading-relaxed break-words">{shelter.address}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 text-sm">
                      <div className="flex items-center text-muted-foreground">
                        <Navigation className="w-4 h-4 mr-1 flex-shrink-0" />
                        <span className="font-paperlogy-light">{actualDistance || shelter.distance} 거리</span>
                      </div>
                      <div className="flex items-start sm:items-center text-muted-foreground">
                        <Clock className="w-4 h-4 mr-1 mt-0.5 sm:mt-0 flex-shrink-0" />
                        <div className="font-paperlogy-light">
                          <span>{operatingStatus.hours}</span>
                          <span className={`ml-2 px-2 py-1 rounded text-xs inline-block ${operatingStatus.isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {operatingStatus.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${crowdingInfo.bgColor} ${crowdingInfo.color} self-start flex-shrink-0`}>
                    <Users className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">{crowdingInfo.level} ({hourlyClicks}회/시간)</span>
                    <span className="sm:hidden">{crowdingInfo.level}</span>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* 운영 시간 */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <Clock className="w-5 h-5 text-primary" />
                  <span>운영 시간</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">오늘</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-muted-foreground font-paperlogy-light">{operatingStatus.hours}</span>
                      <span className={`px-2 py-1 rounded text-xs ${operatingStatus.isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {operatingStatus.status}
                      </span>
                    </div>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>월요일</span>
                        <span className="text-muted-foreground font-paperlogy-light">
                          {shelter?.reverseSchedule ? "오전 8시 - 오후 10시" : "오전 9시 - 오후 6시"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>화요일</span>
                        <span className="text-muted-foreground font-paperlogy-light">
                          {shelter?.reverseSchedule ? "오전 9시 - 오후 6시" : "오전 8시 - 오후 10시"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>수요일</span>
                        <span className="text-muted-foreground font-paperlogy-light">
                          {shelter?.reverseSchedule ? "오전 8시 - 오후 10시" : "오전 9시 - 오후 6시"}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>목요일</span>
                        <span className="text-muted-foreground font-paperlogy-light">
                          {shelter?.reverseSchedule ? "오전 9시 - 오후 6시" : "오전 8시 - 오후 10시"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>금요일</span>
                        <span className="text-muted-foreground font-paperlogy-light">
                          {shelter?.reverseSchedule ? "오전 8시 - 오후 10시" : "오전 9시 - 오후 6시"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>토요일</span>
                        <span className="text-muted-foreground font-paperlogy-light">
                          {shelter?.weekendOperation 
                            ? (shelter?.reverseSchedule ? "오전 8시 - 오후 10시" : "오전 9시 - 오후 6시")
                            : "운영안함"
                          }
                        </span>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <div className="flex justify-between">
                        <span>일요일</span>
                        <span className="text-muted-foreground font-paperlogy-light">
                          {shelter?.weekendOperation 
                            ? (shelter?.reverseSchedule ? "오전 8시 - 오후 10시" : "오전 9시 - 오후 6시")
                            : "운영안함"
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 시설 정보 */}
            <Card>
              <CardHeader>
                <CardTitle>시설 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">시설 유형</span>
                    <p className="font-medium">{shelter.facilityType || "정보 없음"}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">시설 면적</span>
                    <p className="font-medium">{shelter.facilityArea ? `${shelter.facilityArea}㎡` : "정보 없음"}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">수용 인원</span>
                    <p className="font-medium">{shelter.capacity ? `${shelter.capacity}명` : "정보 없음"}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">숙박 가능</span>
                    <p className="font-medium">{shelter.accommodationAvailable ? "가능" : "불가능"}</p>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <span className="text-sm text-muted-foreground mb-3 block">냉난방 시설</span>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span>선풍기: {shelter.fanCount}개</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span>에어컨: {shelter.acCount}개</span>
                    </div>
                  </div>
                </div>

                {/* 운영 정보 */}
                <Separator />
                <div>
                  <span className="text-sm text-muted-foreground mb-3 block">운영 정보</span>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>야간 운영</span>
                      <span className={shelter.nightOperation ? "text-green-600" : "text-red-600"}>
                        {shelter.nightOperation ? "가능" : "불가능"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>주말 운영</span>
                      <span className={shelter.weekendOperation ? "text-green-600" : "text-red-600"}>
                        {shelter.weekendOperation ? "가능" : "불가능"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 특이사항 */}
                {shelter.specialNotes && (
                  <>
                    <Separator />
                    <div>
                      <span className="text-sm text-muted-foreground mb-2 block">특이사항</span>
                      <p className="text-sm">{shelter.specialNotes}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 사이드바 */}
          <div className="space-y-6">
            {/* 혼잡도 */}
            <Card>
              <CardHeader>
                <CardTitle>현재 혼잡도</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold mb-2">
                    {crowdingLevel}
                  </div>
                  <div className="text-sm text-muted-foreground mb-4 font-paperlogy-light">
                    1시간 클릭 수: {hourlyClicks}회
                  </div>
                </div>
                <Progress 
                  value={getCongestionPercentage(crowdingLevel)} 
                  className="h-3"
                />
                <div className="text-xs text-muted-foreground text-center font-paperlogy-light">
                  실시간 업데이트됨
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShelterDetailPage;
