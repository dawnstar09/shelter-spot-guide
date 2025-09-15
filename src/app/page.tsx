'use client'

import { useState, useEffect } from "react";
import { Search, Filter, SlidersHorizontal, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/Layout/Header";
import ShelterCard from "@/components/Shelter/ShelterCard";
import MapView from "@/components/Map/MapView";
import { realShelters } from "@/data/realShelters";
import { crowdingManager } from "@/utils/crowdingManager";
import { CrowdingLevel, CROWDING_LEVELS } from "@/types/crowding";
import type { Shelter } from "@/components/Shelter/ShelterCard";

// 거리 정보가 추가된 쉼터 타입
interface ShelterWithDistance extends Shelter {
  distance?: string;
  distanceValue?: number;
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("distance");
  const [filterBy, setFilterBy] = useState("all");
  const [selectedShelter, setSelectedShelter] = useState<Shelter | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [sheltersWithDistance, setSheltersWithDistance] = useState<ShelterWithDistance[]>(realShelters);
  const [isClient, setIsClient] = useState(false);
  const [locationStatus, setLocationStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [enableRouting, setEnableRouting] = useState(false);

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

  // 사용자 위치 기반으로 쉼터 거리 실시간 계산 및 정렬
  useEffect(() => {
    if (userLocation) {
      console.log("🔄 거리 계산 시작...");
      
      const updated: ShelterWithDistance[] = realShelters.map(shelter => {
        const distance = calculateDistance(
          userLocation.lat, userLocation.lng,
          shelter.coordinates.lat, shelter.coordinates.lng
        );
        return {
          ...shelter,
          distance: formatDistance(distance),
          distanceValue: distance // 정렬용 숫자 값
        };
      });

      // 거리순으로 정렬
      const sorted = updated.sort((a, b) => (a.distanceValue || 0) - (b.distanceValue || 0));
      
      setSheltersWithDistance(sorted);
      console.log("✅ 거리 계산 완료. 가장 가까운 쉼터:", sorted[0]?.name, sorted[0]?.distance);
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

  // 검색어와 혼잡도 필터를 기반으로 쉼터 필터링
  const filteredShelters = sheltersWithDistance.filter(shelter => {
    const matchesSearch = shelter.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         shelter.address.toLowerCase().includes(searchQuery.toLowerCase());
    
    // 클라이언트 사이드에서만 crowdingManager 사용
    if (!isClient) {
      return matchesSearch && filterBy === "all";
    }
    
    const crowdingData = crowdingManager.getCrowdingData(shelter.id);
    const matchesFilter = filterBy === "all" || 
      (filterBy === "여유" && crowdingData.level === "여유") ||
      (filterBy === "보통" && crowdingData.level === "보통") ||
      (filterBy === "혼잡" && crowdingData.level === "혼잡");
    
    return matchesSearch && matchesFilter;
  });

  // 선택된 기준에 따라 쉼터 정렬
  const sortedShelters = [...filteredShelters].sort((a, b) => {
    if (sortBy === "distance") {
      return (a.distanceValue || 0) - (b.distanceValue || 0);
    } else if (sortBy === "congestion" && isClient) {
      const aCrowding = crowdingManager.getCrowdingData(a.id);
      const bCrowding = crowdingManager.getCrowdingData(b.id);
      
      const crowdingOrder: Record<CrowdingLevel, number> = { "여유": 1, "보통": 2, "혼잡": 3 };
      return crowdingOrder[aCrowding.level] - crowdingOrder[bCrowding.level];
    } else if (sortBy === "name") {
      return a.name.localeCompare(b.name);
    }
    return 0;
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-6">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">🏠 무더위 쉼터 찾기</h1>
          <p className="text-muted-foreground font-paperlogy-light max-w-2xl mx-auto">
            실시간 혼잡도와 정확한 거리 정보를 확인하여 가장 적합한 쉼터를 찾으세요
          </p>
          
          {/* 위치 상태 표시 */}
          <div className="mt-4">
            {locationStatus === 'loading' && (
              <div className="text-sm text-yellow-600 font-paperlogy-light">
                📍 현재 위치를 확인하는 중... 
                <br />
                <span className="text-xs text-gray-500">
                  브라우저에서 위치 접근 허용을 눌러주세요
                </span>
              </div>
            )}
            {locationStatus === 'success' && userLocation && (
              <div className="text-sm text-green-600 font-paperlogy-light">
                ✅ 현재 위치 기준 실제 거리 표시 중 (정확도: 높음)
              </div>
            )}
            {locationStatus === 'error' && (
              <div className="text-sm text-orange-600 font-paperlogy-light">
                ⚠️ 위치 접근이 차단되었습니다. 기본 위치(서울시청) 기준으로 거리 표시 중
                <br />
                <span className="text-xs text-gray-500">
                  정확한 거리를 보려면 브라우저 주소창 옆 🔒 아이콘 → 위치 → 허용
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 검색 및 필터 */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* 검색 */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="쉼터 이름이나 주소를 검색하세요..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* 정렬 */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full lg:w-48">
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="정렬" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="distance">📍 거리순 정렬</SelectItem>
                  <SelectItem value="congestion">👥 혼잡도순 정렬</SelectItem>
                  <SelectItem value="name">📝 이름순 정렬</SelectItem>
                </SelectContent>
              </Select>

              {/* 혼잡도 필터 */}
              <Select value={filterBy} onValueChange={setFilterBy}>
                <SelectTrigger className="w-full lg:w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="필터" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 보기</SelectItem>
                  <SelectItem value="여유">😌 여유</SelectItem>
                  <SelectItem value="보통">😐 보통</SelectItem>
                  <SelectItem value="혼잡">😰 혼잡</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* 결과 요약 */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-muted-foreground font-paperlogy-light">
            <span className="font-medium text-primary">{sortedShelters.length}개</span>의 쉼터를 찾았습니다
            {searchQuery && (
              <span className="ml-2 text-sm">
                ("<span className="font-medium">{searchQuery}</span>" 검색 결과)
              </span>
            )}
          </div>
          
          {sortedShelters.length > 0 && (
            <div className="text-sm text-green-600 font-paperlogy-light">
              🎯 가장 가까운 쉼터: <span className="font-medium">{sortedShelters[0].distance}</span>
            </div>
          )}
        </div>

        {/* 탭 */}
        <Tabs defaultValue="list" className="space-y-6">
          <TabsList>
            <TabsTrigger value="list">📋 목록</TabsTrigger>
            <TabsTrigger value="map">🗺️ 지도</TabsTrigger>
          </TabsList>

          {/* 목록 탭 */}
          <TabsContent value="list" className="space-y-4">
            {sortedShelters.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">검색 결과가 없습니다</h3>
                  <p className="text-muted-foreground font-paperlogy-light">
                    다른 검색어나 필터를 시도해보세요
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {sortedShelters.map((shelter, index) => (
                  <div key={shelter.id} className="relative">
                    {/* 순위 배지 (거리순 정렬일 때만) */}
                    {sortBy === "distance" && index < 3 && (
                      <div className="absolute -top-2 -left-2 z-10">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg ${
                          index === 0 ? 'bg-yellow-500' : 
                          index === 1 ? 'bg-gray-400' : 
                          'bg-orange-400'
                        }`}>
                          {index + 1}
                        </div>
                      </div>
                    )}
                    <ShelterCard
                      shelter={shelter}
                      onClick={() => setSelectedShelter(shelter)}
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
                <div className="flex h-[600px]">
                  {/* 지도 영역 */}
                  <div className="flex-1">
                    <MapView
                      shelters={sortedShelters}
                      selectedShelterId={selectedShelter?.id}
                      onShelterSelect={setSelectedShelter}
                      onUserLocationChange={setUserLocation}
                      className="rounded-l-lg"
                      enableRouting={enableRouting}
                    />
                  </div>
                  
                  {/* 가까운 쉼터 목록 */}
                  <div className="w-80 bg-gray-50 rounded-r-lg overflow-y-auto">
                    <div className="p-4 border-b bg-white">
                      <h3 className="font-bold text-lg flex items-center gap-2">
                        📍 가까운 쉼터 TOP 3
                      </h3>
                      <p className="text-sm text-muted-foreground font-paperlogy-light">
                        클릭하면 지도에서 위치를 확인할 수 있습니다
                      </p>
                    </div>
                    
                    <div className="p-4 space-y-3">
                      {sortedShelters.slice(0, 3).map((shelter, index) => {
                        const crowdingData = isClient ? crowdingManager.getCrowdingData(shelter.id) : { level: "여유" as CrowdingLevel, count: 0 };
                        const isSelected = selectedShelter?.id === shelter.id;
                        
                        return (
                          <div
                            key={shelter.id}
                            onClick={() => setSelectedShelter(shelter as Shelter)}
                            className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md ${
                              isSelected 
                                ? 'border-blue-500 bg-blue-50 shadow-md' 
                                : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                          >
                            {/* 순위 배지 */}
                            <div className="flex items-start gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm ${
                                index === 0 ? 'bg-yellow-500' : 
                                index === 1 ? 'bg-gray-400' : 
                                'bg-orange-400'
                              }`}>
                                {index + 1}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm truncate">{shelter.name}</h4>
                                <p className="text-xs text-muted-foreground truncate">{shelter.address}</p>
                                
                                <div className="flex items-center justify-between mt-2">
                                  {/* 거리 */}
                                  <div className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-blue-500" />
                                    <span className="text-xs font-medium text-blue-600">
                                      {shelter.distance || '계산 중...'}
                                    </span>
                                  </div>
                                  
                                  {/* 혼잡도 */}
                                  <div className="flex items-center gap-1">
                                    <div 
                                      className={`w-2 h-2 rounded-full ${
                                        crowdingData.level === "여유" ? "bg-green-500" :
                                        crowdingData.level === "보통" ? "bg-yellow-500" :
                                        "bg-red-500"
                                      }`}
                                    />
                                    <span className="text-xs">
                                      {crowdingData.level === "여유" ? "😌" :
                                       crowdingData.level === "보통" ? "😐" :
                                       "😰"} {crowdingData.level}
                                    </span>
                                  </div>
                                </div>
                                
                                {/* 길찾기 버튼 */}
                                <div className="mt-3 pt-2 border-t border-gray-200">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedShelter(shelter as Shelter);
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
                        <div className="text-center py-8 text-muted-foreground">
                          <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">쉼터를 찾는 중...</p>
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