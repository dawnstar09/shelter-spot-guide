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
const getOperatingStatus = () => {
  const now = new Date();
  const currentHour = now.getHours();
  const isOpen = currentHour >= 9 && currentHour < 18; // 9시-18시 운영
  
  return {
    hours: "오전 9시 - 오후 6시",
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
  const operatingStatus = useMemo(() => getOperatingStatus(), []);

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
      
      const crowdingData = crowdingManager.getCrowdingData(shelter.id);
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
      
      <div className="container mx-auto px-4 py-8">
        {/* 경로 표시 */}
        <div className="flex items-center space-x-2 mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/" className="flex items-center space-x-1">
              <ArrowLeft className="w-4 h-4" />
              <span>지도로 돌아가기</span>
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 메인 콘텐츠 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 쉼터 헤더 */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold mb-2">{shelter.name}</CardTitle>
                    <div className="flex items-center text-muted-foreground text-sm mb-4">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span className="font-paperlogy-light">{shelter.address}</span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center text-muted-foreground">
                        <Navigation className="w-4 h-4 mr-1" />
                        <span className="font-paperlogy-light">{actualDistance || shelter.distance} 거리</span>
                      </div>
                      <div className="flex items-center text-muted-foreground">
                        <Clock className="w-4 h-4 mr-1" />
                        <span className="font-paperlogy-light">
                          {operatingStatus.hours}
                          <span className={`ml-2 px-2 py-1 rounded text-xs ${operatingStatus.isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {operatingStatus.status}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${crowdingInfo.bgColor} ${crowdingInfo.color}`}>
                    <Users className="w-4 h-4 mr-1" />
                    {crowdingInfo.level} ({hourlyClicks}회/시간)
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* 운영 시간 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
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
                        <span className="text-muted-foreground font-paperlogy-light">오전 9시 - 오후 5시</span>
                      </div>
                      <div className="flex justify-between">
                        <span>화요일</span>
                        <span className="text-muted-foreground font-paperlogy-light">오전 9시 - 오후 5시</span>
                      </div>
                      <div className="flex justify-between">
                        <span>수요일</span>
                        <span className="text-muted-foreground font-paperlogy-light">오전 9시 - 오후 5시</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>목요일</span>
                        <span className="text-muted-foreground font-paperlogy-light">오전 9시 - 오후 5시</span>
                      </div>
                      <div className="flex justify-between">
                        <span>금요일</span>
                        <span className="text-muted-foreground font-paperlogy-light">오전 9시 - 오후 5시</span>
                      </div>
                      <div className="flex justify-between">
                        <span>토요일</span>
                        <span className="text-muted-foreground font-paperlogy-light">오전 10시 - 오후 2시</span>
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

            {/* 추가 정보 */}
            <Card>
              <CardHeader>
                <CardTitle>추가 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <span className="font-medium">이용 가능 인원:</span>
                  <span className="text-muted-foreground ml-2 font-paperlogy-light">{shelter.use_prnb}명</span>
                </div>
                <div>
                  <span className="font-medium">시설 면적:</span>
                  <span className="text-muted-foreground ml-2 font-paperlogy-light">{shelter.r_area_sqr}㎡</span>
                </div>
                {shelter.rmrk && (
                  <div>
                    <span className="font-medium">비고:</span>
                    <span className="text-muted-foreground ml-2 font-paperlogy-light">{shelter.rmrk}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShelterDetailPage;
