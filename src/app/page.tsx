'use client'

import { useState, useEffect, useMemo, useCallback } from "react";
import { MapPin } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Header from "@/components/Layout/Header";
import ShelterCard from "@/components/Shelter/ShelterCard";
import MapView from "@/components/Map/MapView";
import { realShelters } from "@/data/realShelters";
import { crowdingManager } from "@/utils/crowdingManager";
import { CrowdingLevel, CROWDING_LEVELS } from "@/types/crowding";
import useShelterFilters from "@/hooks/use-shelter-filters";
import type { Shelter } from "@/components/Shelter/ShelterCard";

// 거리 정보가 추가된 쉼터 타입
interface ShelterWithDistance extends Shelter {
  distanceValue?: number;
}

// 필터링 옵션 데이터 - 실제 쉼터 데이터 기반
const FILTER_OPTIONS = {
  sido: [
    { value: "경기도", label: "경기도" },
  ],
  sigungu: [
    { value: "화성시", label: "화성시" },
  ],
  emdong: [
    { value: "동탄1동", label: "동탄1동" },
    { value: "동탄2동", label: "동탄2동" },
    { value: "동탄3동", label: "동탄3동" },
    { value: "동탄4동", label: "동탄4동" },
    { value: "봉담읍", label: "봉담읍" },
    { value: "향남읍", label: "향남읍" },
    { value: "남양읍", label: "남양읍" },
    { value: "우정읍", label: "우정읍" },
    { value: "팔탄면", label: "팔탄면" },
    { value: "매송면", label: "매송면" },
    { value: "비봉면", label: "비봉면" },
    { value: "마도면", label: "마도면" },
    { value: "송산면", label: "송산면" },
    { value: "서신면", label: "서신면" },
    { value: "양감면", label: "양감면" },
    { value: "정남면", label: "정남면" },
    { value: "장안면", label: "장안면" },
  ],
  facilityType: [
    { value: "사회복지시설", label: "사회복지시설" },
    { value: "교육시설", label: "교육시설" },
    { value: "경로당", label: "경로당" },
    { value: "기타시설", label: "기타시설" },
  ],
  facilitySubType: [
    { value: "노인복지시설", label: "노인복지시설" },
    { value: "장애인복지시설", label: "장애인복지시설" },
    { value: "아동복지시설", label: "아동복지시설" },
    { value: "여성복지시설", label: "여성복지시설" },
    { value: "종합사회복지관", label: "종합사회복지관" },
    { value: "초등학교", label: "초등학교" },
    { value: "중학교", label: "중학교" },
    { value: "고등학교", label: "고등학교" },
    { value: "대학교", label: "대학교" },
    { value: "도서관", label: "도서관" },
    { value: "체육관", label: "체육관" },
    { value: "문화센터", label: "문화센터" },
    { value: "마을회관", label: "마을회관" },
    { value: "주민센터", label: "주민센터" },
  ],
  capacityRange: [
    { value: "50-", label: "50명 미만" },
    { value: "50-100", label: "50-100명" },
    { value: "100-200", label: "100-200명" },
    { value: "200-500", label: "200-500명" },
    { value: "500+", label: "500명 이상" },
  ],
  facilityArea: [
    { value: "100-", label: "100㎡ 미만" },
    { value: "100-300", label: "100-300㎡" },
    { value: "300-500", label: "300-500㎡" },
    { value: "500-1000", label: "500-1000㎡" },
    { value: "1000+", label: "1000㎡ 이상" },
  ],
  coolingFacilities: [
    { value: "fan", label: "선풍기 있음" },
    { value: "ac", label: "에어컨 있음" },
    { value: "both", label: "선풍기+에어컨" },
    { value: "none", label: "냉방시설 없음" },
  ],
};

export default function Home() {
  const [selectedShelter, setSelectedShelter] = useState<Shelter | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [sheltersWithDistance, setSheltersWithDistance] = useState<ShelterWithDistance[]>(
    realShelters.map(shelter => ({
      ...shelter,
      distance: undefined,
      distanceValue: undefined
    }))
  );
  const [isClient, setIsClient] = useState(false);
  const [locationStatus, setLocationStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [enableRouting, setEnableRouting] = useState(false);

  // 새로운 고급 필터 시스템 추가
  const {
    filters,
    filteredShelters: filterBasedShelters,
    updateFilters,
    resetFilters,
    totalCount,
    filteredCount,
  } = useShelterFilters(sheltersWithDistance);

  // 클라이언트 사이드인지 확인
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 거리 계산 함수 (Haversine formula) - 더 정확한 계산
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // 지구 반지름 (km)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // 거리를 보기 좋게 포맷하는 함수
  const formatDistance = (distanceKm: number): string => {
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)}m`;
    } else {
      return `${distanceKm.toFixed(1)}km`;
    }
  };

  // 사용자 위치 가져오기
  useEffect(() => {
    if (!isClient || !("geolocation" in navigator)) {
      console.log("Geolocation이 지원되지 않습니다.");
      setLocationStatus('error');
      // 기본 위치 (서울시청) 설정
      setUserLocation({
        lat: 37.5666103,
        lng: 126.9783882
      });
      return;
    }

    setLocationStatus('loading');

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000 // 1분간 캐시
    };

    // 현재 위치 가져오기
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLoc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        console.log("✅ 사용자 위치 획득:", userLoc);
        setUserLocation(userLoc);
        setLocationStatus('success');
      },
      (error) => {
        console.error("❌ 위치 정보를 가져올 수 없습니다:", error);
        setLocationStatus('error');
        // 기본 위치 (서울시청) 설정
        setUserLocation({
          lat: 37.5666103,
          lng: 126.9783882
        });
      },
      options
    );
  }, [isClient]);

  // 사용자 위치 기반으로 쉼터 거리 배치 계산 (성능 최적화)
  useEffect(() => {
    if (userLocation) {
      console.log("🔄 거리 계산 시작...");
      
      // 배치 처리로 UI 블로킹 방지
      const batchSize = 50; // 한 번에 50개씩 처리
      const processedShelters: ShelterWithDistance[] = [];
      let currentIndex = 0;

      const processBatch = () => {
        const endIndex = Math.min(currentIndex + batchSize, realShelters.length);
        
        for (let i = currentIndex; i < endIndex; i++) {
          const shelter = realShelters[i];
          const distance = calculateDistance(
            userLocation.lat, userLocation.lng,
            shelter.coordinates.lat, shelter.coordinates.lng
          );
          
          processedShelters.push({
            ...shelter,
            distance: formatDistance(distance),
            distanceValue: distance
          });
        }
        
        currentIndex = endIndex;
        
        // 부분 업데이트로 사용자가 진행 상황을 볼 수 있게 함
        if (currentIndex <= realShelters.length) {
          const sorted = [...processedShelters].sort((a, b) => {
            // 거리 계산이 안 된 항목들은 맨 뒤로
            if (!a.distanceValue && !b.distanceValue) return 0;
            if (!a.distanceValue) return 1;
            if (!b.distanceValue) return -1;
            return a.distanceValue - b.distanceValue;
          });
          setSheltersWithDistance(sorted);
        }
        
        // 더 처리할 항목이 있으면 다음 배치 예약
        if (currentIndex < realShelters.length) {
          requestAnimationFrame(processBatch);
        } else {
          console.log("✅ 거리 계산 완료. 총", realShelters.length, "개 처리됨");
        }
      };

      // 첫 번째 배치 시작
      processBatch();
    }
  }, [userLocation]);

  // 길찾기 실행 후 enableRouting 리셋
  useEffect(() => {
    if (enableRouting) {
      const timer = setTimeout(() => {
        setEnableRouting(false);
      }, 1000); // 1초 후 리셋
      
      return () => clearTimeout(timer);
    }
  }, [enableRouting]);

  // 고급 필터만 적용된 쉼터 목록 (거리순 정렬)
  const sortedShelters = useMemo(() => {
    const filtered = [...filterBasedShelters];
    
    // 거리순으로 정렬 (기본)
    return filtered.sort((a, b) => {
      const aDistance = (a as ShelterWithDistance).distanceValue;
      const bDistance = (b as ShelterWithDistance).distanceValue;
      if (!aDistance && !bDistance) return 0;
      if (!aDistance) return 1;
      if (!bDistance) return -1;
      return aDistance - bDistance;
    });
  }, [filterBasedShelters]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {/* 헤더 */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-4">무더위 쉼터 찾기</h1>
          <p className="text-sm sm:text-base text-muted-foreground font-paperlogy-light max-w-2xl mx-auto px-4">
            실시간 혼잡도와 정확한 거리 정보를 확인하여 가장 적합한 쉼터를 찾으세요
          </p>
          
          {/* 위치 상태 표시 */}
          <div className="mt-3 sm:mt-4 px-4">
            {locationStatus === 'loading' && (
              <div className="text-xs sm:text-sm text-yellow-600 font-paperlogy-light">
                📍 현재 위치를 확인하는 중... 
                <br />
                <span className="text-xs text-gray-500">
                  브라우저에서 위치 접근 허용을 눌러주세요
                </span>
              </div>
            )}
            {locationStatus === 'success' && userLocation && (
              <div className="text-xs sm:text-sm text-green-600 font-paperlogy-light">
                ✅ 현재 위치 기준 실제 거리 표시 중 (정확도: 높음)
              </div>
            )}
            {locationStatus === 'error' && (
              <div className="text-xs sm:text-sm text-orange-600 font-paperlogy-light">
                ⚠️ 위치 접근이 차단되었습니다. 기본 위치(서울시청) 기준으로 거리 표시 중
                <br />
                <span className="text-xs text-gray-500">
                  정확한 거리를 보려면 브라우저 주소창 옆 🔒 아이콘 → 위치 → 허용
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 고급 검색 필터 */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border mb-6">
          {/* 첫 번째 행: 지역구분 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                지역구분
              </label>
              <Select
                value={filters.sido || ""}
                onValueChange={(value) => updateFilters({ 
                  ...filters, 
                  sido: value === "all" ? undefined : value 
                })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="시도선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {FILTER_OPTIONS.sido.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                시군구
              </label>
              <Select
                value={filters.sigungu || ""}
                onValueChange={(value) => updateFilters({ 
                  ...filters, 
                  sigungu: value === "all" ? undefined : value 
                })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="시군구선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {FILTER_OPTIONS.sigungu.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                읍면동
              </label>
              <Select
                value={filters.emdong || ""}
                onValueChange={(value) => updateFilters({ 
                  ...filters, 
                  emdong: value === "all" ? undefined : value 
                })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="읍면동선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {FILTER_OPTIONS.emdong.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이용구분
              </label>
              <Select
                value={
                  filters.accommodationAvailable
                    ? "숙박가능"
                    : filters.nightOperation
                    ? "야간운영"
                    : filters.weekendOperation
                    ? "주말운영"
                    : ""
                }
                onValueChange={(value) => {
                  if (value === "숙박가능") {
                    updateFilters({
                      ...filters,
                      accommodationAvailable: true,
                      nightOperation: false,
                      weekendOperation: false,
                    });
                  } else if (value === "야간운영") {
                    updateFilters({
                      ...filters,
                      nightOperation: true,
                      accommodationAvailable: false,
                      weekendOperation: false,
                    });
                  } else if (value === "주말운영") {
                    updateFilters({
                      ...filters,
                      weekendOperation: true,
                      accommodationAvailable: false,
                      nightOperation: false,
                    });
                  } else {
                    updateFilters({
                      ...filters,
                      accommodationAvailable: false,
                      nightOperation: false,
                      weekendOperation: false,
                    });
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="이용구분선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="일반이용">일반이용</SelectItem>
                  <SelectItem value="숙박가능">숙박가능</SelectItem>
                  <SelectItem value="야간운영">야간운영</SelectItem>
                  <SelectItem value="주말운영">주말운영</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 두 번째 행: 시설유형 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                시설유형
              </label>
              <Select
                value={filters.facilityType || ""}
                onValueChange={(value) => updateFilters({ 
                  ...filters, 
                  facilityType: value === "all" ? undefined : value 
                })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="시설유형선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {FILTER_OPTIONS.facilityType.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                시설유형상세
              </label>
              <Select
                value={filters.facilitySubType || ""}
                onValueChange={(value) => updateFilters({ 
                  ...filters, 
                  facilitySubType: value === "all" ? undefined : value 
                })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="시설유형상세선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {FILTER_OPTIONS.facilitySubType.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                수용인원
              </label>
              <Select
                value={filters.capacityRange || ""}
                onValueChange={(value) => updateFilters({ 
                  ...filters, 
                  capacityRange: value === "all" ? undefined : value 
                })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="수용인원선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {FILTER_OPTIONS.capacityRange.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                시설면적
              </label>
              <Select
                value={filters.facilityArea || ""}
                onValueChange={(value) => updateFilters({ 
                  ...filters, 
                  facilityArea: value === "all" ? undefined : value 
                })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="시설면적선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {FILTER_OPTIONS.facilityArea.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                냉방시설
              </label>
              <Select
                value={filters.coolingFacilities || ""}
                onValueChange={(value) => updateFilters({ 
                  ...filters, 
                  coolingFacilities: value === "all" ? undefined : value 
                })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="냉방시설선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {FILTER_OPTIONS.coolingFacilities.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 세 번째 행: 검색 및 버튼 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                시설명 검색
              </label>
              <Input
                placeholder="시설명을 입력하세요"
                value={filters.searchKeyword || ""}
                onChange={(e) => updateFilters({ 
                  ...filters, 
                  searchKeyword: e.target.value 
                })}
                className="h-10 w-full"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2 opacity-0 pointer-events-none">
                버튼
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={resetFilters}
                  variant="outline"
                  className="flex-1 h-10"
                >
                  초기화
                </Button>
                <Button
                  onClick={() => {
                    // 검색 실행 (이미 실시간으로 필터링됨)
                  }}
                  className="flex-1 h-10 bg-blue-600 hover:bg-blue-700"
                >
                  검색
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* 결과 요약 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-2 sm:gap-4">
          <div className="text-sm sm:text-base text-muted-foreground font-paperlogy-light">
            <span className="font-medium text-primary">{sortedShelters.length}개</span>의 쉼터를 찾았습니다
          </div>
          
          {sortedShelters.length > 0 && (
            <div className="text-xs sm:text-sm text-green-600 font-paperlogy-light">
              🎯 가장 가까운 쉼터: <span className="font-medium">{sortedShelters[0].distance}</span>
            </div>
          )}
        </div>

        {/* 탭 */}
        <Tabs defaultValue="list" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2 h-10 sm:h-11">
            <TabsTrigger value="list" className="text-sm sm:text-base">📋 목록</TabsTrigger>
            <TabsTrigger value="map" className="text-sm sm:text-base">🗺️ 지도</TabsTrigger>
          </TabsList>

          {/* 목록 탭 */}
          <TabsContent value="list" className="space-y-4">
            {sortedShelters.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8 sm:py-12">
                  <MapPin className="w-8 h-8 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-base sm:text-lg font-medium mb-2">검색 결과가 없습니다</h3>
                  <p className="text-sm sm:text-base text-muted-foreground font-paperlogy-light">
                    다른 검색어나 필터를 시도해보세요
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {sortedShelters.map((shelter, index) => (
                  <div key={shelter.id} className="relative">
                    <ShelterCard
                      shelter={shelter as unknown as Shelter}
                      onClick={() => setSelectedShelter(shelter as unknown as Shelter)}
                    />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* 지도 탭 */}
          <TabsContent value="map">
            <Card>
              <CardContent className="p-0">
                {/* 모바일: 세로 배치, 데스크톱: 가로 배치 */}
                <div className="flex flex-col lg:flex-row h-[400px] sm:h-[500px] lg:h-[600px]">
                  {/* 지도 영역 */}
                  <div className="flex-1 order-2 lg:order-1 h-[250px] sm:h-[300px] lg:h-full">
                    <MapView
                      shelters={sortedShelters}
                      selectedShelterId={selectedShelter?.id}
                      onShelterSelect={setSelectedShelter}
                      onUserLocationChange={setUserLocation}
                      className="rounded-none lg:rounded-l-lg"
                      enableRouting={enableRouting}
                    />
                  </div>
                  
                  {/* 가까운 쉼터 목록 */}
                  <div className="w-full lg:w-80 bg-gray-50 rounded-none lg:rounded-r-lg overflow-y-auto order-1 lg:order-2 h-[150px] sm:h-[200px] lg:h-full">
                    <div className="p-3 lg:p-4 border-b bg-white">
                      <h3 className="font-bold text-base lg:text-lg flex items-center gap-2">
                        가까운 쉼터 TOP 3
                      </h3>
                      <p className="text-xs lg:text-sm text-muted-foreground font-paperlogy-light">
                        클릭하면 지도에서 위치를 확인할 수 있습니다
                      </p>
                    </div>
                    
                    <div className="p-2 lg:p-4 space-y-2 lg:space-y-3">
                      {sortedShelters.slice(0, 3).map((shelter, index) => {
                        const crowdingData = isClient ? crowdingManager.getCrowdingData(shelter.id) : { level: "여유" as CrowdingLevel, count: 0 };
                        const isSelected = selectedShelter?.id === shelter.id;
                        
                        return (
                          <div
                            key={shelter.id}
                            onClick={() => setSelectedShelter(shelter as unknown as Shelter)}
                            className={`p-2 lg:p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md ${
                              isSelected 
                                ? 'border-blue-500 bg-blue-50 shadow-md' 
                                : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                          >
                            {/* 순위 배지 */}
                            <div className="flex items-start gap-2 lg:gap-3">
                              <div className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm ${
                                index === 0 ? 'bg-yellow-500' : 
                                index === 1 ? 'bg-gray-400' : 
                                'bg-orange-400'
                              }`}>
                                {index + 1}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-xs lg:text-sm truncate">{shelter.name}</h4>
                                <p className="text-xs text-muted-foreground truncate">{shelter.address}</p>
                                
                                <div className="flex items-center justify-between mt-1 lg:mt-2">
                                  {/* 거리 */}
                                  <div className="flex items-center gap-1">
                                    <MapPin className="w-2.5 h-2.5 lg:w-3 lg:h-3 text-blue-500" />
                                    <span className="text-xs font-medium text-blue-600">
                                      {shelter.distance || '계산 중...'}
                                    </span>
                                  </div>
                                  
                                  {/* 혼잡도 */}
                                  <div className="flex items-center gap-1">
                                    <div 
                                      className={`w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full ${
                                        crowdingData.level === "여유" ? "bg-green-500" :
                                        crowdingData.level === "보통" ? "bg-yellow-500" :
                                        "bg-red-500"
                                      }`}
                                    />
                                    <span className="text-xs">
                                      {crowdingData.level === "여유" ? "여유" :
                                       crowdingData.level === "보통" ? "보통" :
                                       "혼잡"} {crowdingData.level}
                                    </span>
                                  </div>
                                </div>
                                
                                {/* 길찾기 버튼 */}
                                <div className="mt-2 pt-1 lg:pt-2 border-t border-gray-200">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedShelter(shelter as unknown as Shelter);
                                      setEnableRouting(true);
                                    }}
                                    className="w-full text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded-md transition-colors duration-200 flex items-center justify-center gap-1"
                                  >
                                    🧭 길찾기
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      
                      {sortedShelters.length === 0 && (
                        <div className="text-center py-4 lg:py-8 text-muted-foreground">
                          <MapPin className="w-6 h-6 lg:w-8 lg:h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-xs lg:text-sm">쉼터를 찾는 중...</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}