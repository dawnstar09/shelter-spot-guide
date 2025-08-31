'use client'

import { useState } from "react";
import { Search, Filter, SlidersHorizontal, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/Layout/Header";
import ShelterCard from "@/components/Shelter/ShelterCard";
import MapView from "@/components/Map/MapView";
import { realShelters } from "@/data/realShelters";
import type { Shelter } from "@/components/Shelter/ShelterCard";

/**
 * 쉼터 페이지 컴포넌트
 * 사용자 위치와 선호도에 따른 추천 쉼터를 표시합니다
 * 필터링, 정렬, 목록/지도 보기 기능을 제공합니다
 */
export default function Shelters() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("distance");
  const [filterBy, setFilterBy] = useState("all");
  const [selectedShelter, setSelectedShelter] = useState<Shelter | null>(null);

  // 검색어와 혼잡도 필터를 기반으로 쉼터 필터링
  const filteredShelters = realShelters.filter(shelter => {
    const matchesSearch = shelter.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         shelter.address.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterBy === "all" || shelter.congestion === filterBy;
    
    return matchesSearch && matchesFilter;
  });

  // 선택된 기준에 따라 쉼터 정렬
  const sortedShelters = [...filteredShelters].sort((a, b) => {
    if (sortBy === "distance") {
      return parseFloat(a.distance) - parseFloat(b.distance);
    } else if (sortBy === "congestion") {
      const congestionOrder = { "low": 1, "medium": 2, "high": 3 };
      return congestionOrder[a.congestion] - congestionOrder[b.congestion];
    } else if (sortBy === "name") {
      return a.name.localeCompare(b.name);
    }
    return 0;
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* 페이지 헤더 */}
      <section className="bg-gradient-to-r from-primary-light to-accent-light py-12">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              가까운 추천 쉼터
            </h1>
            <p className="text-lg text-muted-foreground mb-8 font-paperlogy-light">
              현재 위치와 혼잡도를 기반으로 귀하의 요구에 맞는 쉼터를 추천해드립니다.
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* 필터 및 검색 */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* 검색 */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  type="search"
                  placeholder="쉼터 이름이나 주소로 검색..."
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
                  <SelectItem value="distance">거리순 정렬</SelectItem>
                  <SelectItem value="congestion">혼잡도순 정렬</SelectItem>
                  <SelectItem value="name">이름순 정렬</SelectItem>
                </SelectContent>
              </Select>

              {/* 혼잡도 필터 */}
              <Select value={filterBy} onValueChange={setFilterBy}>
                <SelectTrigger className="w-full lg:w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="필터" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">모든 혼잡도</SelectItem>
                  <SelectItem value="low">여유</SelectItem>
                  <SelectItem value="medium">보통</SelectItem>
                  <SelectItem value="high">혼잡</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* 결과 요약 */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-muted-foreground font-paperlogy-light">
            {sortedShelters.length}개의 쉼터를 찾았습니다
            {searchQuery && ` ("${searchQuery}" 검색 결과)`}
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="list" className="flex items-center space-x-2">
              <span>목록 보기</span>
            </TabsTrigger>
            <TabsTrigger value="map" className="flex items-center space-x-2">
              <MapPin className="w-4 h-4" />
              <span>지도 보기</span>
            </TabsTrigger>
          </TabsList>

          {/* 목록 보기 */}
          <TabsContent value="list" className="space-y-4 mt-6">
            {sortedShelters.length === 0 ? (
              <Card className="p-8 text-center">
                <CardContent>
                  <div className="text-muted-foreground font-paperlogy-light">
                    검색 조건에 맞는 쉼터를 찾을 수 없습니다.
                  </div>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => {
                      setSearchQuery("");
                      setFilterBy("all");
                    }}
                  >
                    필터 초기화
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {sortedShelters.map((shelter) => (
                  <ShelterCard
                    key={shelter.id}
                    shelter={shelter}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* 지도 보기 */}
          <TabsContent value="map" className="mt-6">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* 지도 */}
              <div className="flex-1">
                <Card className="h-[600px]">
                  <CardContent className="p-0 h-full">
                    <MapView
                      shelters={sortedShelters}
                      selectedShelterId={selectedShelter?.id}
                      onShelterSelect={setSelectedShelter}
                      className="h-full rounded-lg"
                    />
                  </CardContent>
                </Card>
              </div>

              {/* 선택된 쉼터 정보 */}
              <div className="w-full lg:w-[450px]">
                {selectedShelter ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">선택된 쉼터</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ShelterCard shelter={selectedShelter} />
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-center text-muted-foreground">
                        <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="font-paperlogy-light">쉼터 마커를 클릭하면 상세정보를 볼 수 있습니다</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
