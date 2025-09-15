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
import { CrowdingLevel } from "@/types/crowding";
import type { Shelter } from "@/components/Shelter/ShelterCard";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("distance");
  const [filterBy, setFilterBy] = useState("all");
  const [selectedShelter, setSelectedShelter] = useState<Shelter | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [sheltersWithDistance, setSheltersWithDistance] = useState<Shelter[]>(realShelters);

  // 거리 계산 함수 (Haversine formula)
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

  // 사용자 위치 가져오기
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLoc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(userLoc);
        },
        (error) => {
          console.log("위치 정보를 가져올 수 없습니다:", error);
        }
      );
    }
  }, []);

  // 사용자 위치 기반으로 쉼터 거리 업데이트
  useEffect(() => {
    if (userLocation) {
      const updated = realShelters.map(shelter => {
        const distance = calculateDistance(
          userLocation.lat, userLocation.lng,
          shelter.coordinates.lat, shelter.coordinates.lng
        );
        return {
          ...shelter,
          distance: `${distance.toFixed(2)} km`
        };
      });
      setSheltersWithDistance(updated);
    }
  }, [userLocation]);

  // 검색어와 혼잡도 필터를 기반으로 쉼터 필터링
  const filteredShelters = sheltersWithDistance.filter(shelter => {
    const matchesSearch = shelter.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         shelter.address.toLowerCase().includes(searchQuery.toLowerCase());
    
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
      const aDistance = parseFloat(a.distance) || 999;
      const bDistance = parseFloat(b.distance) || 999;
      return aDistance - bDistance;
    } else if (sortBy === "congestion") {
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
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">무더위 쉼터 찾기</h1>
          <p className="text-muted-foreground font-paperlogy-light max-w-2xl mx-auto">
            실시간 혼잡도와 거리 정보를 확인하여 가장 적합한 쉼터를 찾으세요
          </p>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="쉼터 이름이나 주소를 검색하세요..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full lg:w-48">
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="정렬" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="distance">거리순 정렬</SelectItem>
                  <SelectItem value="congestion">혼잡도순 정렬</SelectItem>
                  <SelectItem value="name">이름순 정렬</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterBy} onValueChange={setFilterBy}>
                <SelectTrigger className="w-full lg:w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="필터" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">모든 혼잡도</SelectItem>
                  <SelectItem value="여유">여유</SelectItem>
                  <SelectItem value="보통">보통</SelectItem>
                  <SelectItem value="혼잡">혼잡</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between mb-6">
          <div className="text-muted-foreground font-paperlogy-light">
            {sortedShelters.length}개의 쉼터를 찾았습니다
            {searchQuery && ` ("${searchQuery}" 검색 결과)`}
          </div>
          {userLocation && (
            <div className="text-sm text-green-600 font-paperlogy-light">
              📍 현재 위치 기준 실제 거리 표시 중
            </div>
          )}
        </div>

        <Tabs defaultValue="list" className="space-y-6">
          <TabsList>
            <TabsTrigger value="list">목록</TabsTrigger>
            <TabsTrigger value="map">지도</TabsTrigger>
          </TabsList>

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
                {sortedShelters.map((shelter) => (
                  <ShelterCard
                    key={shelter.id}
                    shelter={shelter}
                    onClick={() => setSelectedShelter(shelter)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="map">
            <Card>
              <CardContent className="p-0">
                <div style={{ height: "600px" }}>
                  <MapView
                    shelters={sortedShelters}
                    selectedShelterId={selectedShelter?.id}
                    onShelterSelect={setSelectedShelter}
                    onUserLocationChange={setUserLocation}
                    className="rounded-lg"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
