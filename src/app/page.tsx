'use client'

import { useState } from "react";
import { Search, Filter, MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Layout/Header";
import MapView from "@/components/Map/MapView";
import ShelterCard from "@/components/Shelter/ShelterCard";
import { realShelters, getSheltersByDistance } from "@/data/realShelters";
import type { Shelter } from "@/components/Shelter/ShelterCard";

/**
 * 홈 페이지 컴포넌트 - 오량쉼터 메인 지도 인터페이스
 * 인터랙티브 지도, 검색 기능, 쉼터 목록을 제공합니다
 */
export default function Home() {
  const [selectedShelter, setSelectedShelter] = useState<Shelter | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("distance");
  const [showList, setShowList] = useState(false);

  // 사용자 선호도에 따라 쉼터 필터링 및 정렬
  const filteredShelters = realShelters.filter(shelter =>
    shelter.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    shelter.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedShelters = [...filteredShelters].sort((a, b) => {
    if (sortBy === "distance") {
      return parseFloat(a.distance) - parseFloat(b.distance);
    } else if (sortBy === "congestion") {
      const congestionOrder = { "low": 1, "medium": 2, "high": 3 };
      return congestionOrder[a.congestion] - congestionOrder[b.congestion];
    }
    return 0;
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* 히어로 섹션 */}
      <section className="relative bg-gradient-to-r from-primary to-accent text-primary-foreground py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              가까운 무더위 쉼터를 찾아보세요
            </h1>
            <p className="text-xl md:text-2xl text-primary-foreground/90 mb-8 font-paperlogy-light">
              실시간 혼잡도와 시설 정보를 확인하여 가까운 무더위 쉼터를 찾으세요
            </p>
            
            {/* 빠른 검색 */}
            <div className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  type="search"
                  placeholder="쉼터명이나 주소로 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-card text-foreground"
                />
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-48 bg-card text-foreground">
                  <SelectValue placeholder="정렬" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="distance">거리순 정렬</SelectItem>
                  <SelectItem value="congestion">혼잡도순 정렬</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {/* 메인 콘텐츠 */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 지도 섹션 */}
          <div className="lg:col-span-2">
            <Card className="h-[600px]">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    <span>무더위 쉼터 위치</span>
                  </CardTitle>
                  <div className="flex space-x-2">
                    <Button
                      variant={showList ? "outline" : "default"}
                      size="sm"
                      onClick={() => setShowList(false)}
                    >
                      지도 보기
                    </Button>
                    <Button
                      variant={showList ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowList(true)}
                    >
                      목록 보기
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 h-[calc(100%-80px)]">
                {!showList ? (
                  <MapView
                    shelters={sortedShelters}
                    selectedShelterId={selectedShelter?.id}
                    onShelterSelect={setSelectedShelter}
                    className="h-full rounded-lg"
                  />
                ) : (
                  <div className="h-full overflow-y-auto p-4 space-y-4">
                    {sortedShelters.map((shelter) => (
                      <ShelterCard
                        key={shelter.id}
                        shelter={shelter}
                        showMap={false}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 사이드바 */}
          <div className="space-y-6">
            {/* 선택된 쉼터 상세정보 */}
            {selectedShelter && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">선택된 쉼터</CardTitle>
                </CardHeader>
                <CardContent>
                  <ShelterCard shelter={selectedShelter} />
                </CardContent>
              </Card>
            )}

            {/* 실시간 통계 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Navigation className="w-5 h-5 text-primary" />
                  <span>실시간 현황</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-success-light rounded-lg">
                    <div className="text-2xl font-bold text-success">
                      {realShelters.filter(s => s.congestion === "low").length}
                    </div>
                    <div className="text-sm text-muted-foreground font-paperlogy-light">여유</div>
                  </div>
                  <div className="text-center p-3 bg-warning-light rounded-lg">
                    <div className="text-2xl font-bold text-warning">
                      {realShelters.filter(s => s.congestion === "medium").length}
                    </div>
                    <div className="text-sm text-muted-foreground font-paperlogy-light">보통</div>
                  </div>
                </div>
                <div className="text-center p-3 bg-destructive-light rounded-lg">
                  <div className="text-2xl font-bold text-destructive">
                    {realShelters.filter(s => s.congestion === "high").length}
                  </div>
                  <div className="text-sm text-muted-foreground font-paperlogy-light">혼잡</div>
                </div>
              </CardContent>
            </Card>

            {/* 가까운 쉼터 */}
            <Card>
              <CardHeader>
                <CardTitle>가까운 쉼터</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {getSheltersByDistance().slice(0, 3).map((shelter) => (
                  <div
                    key={shelter.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => setSelectedShelter(shelter)}
                  >
                    <div>
                      <div className="font-medium text-sm font-paperlogy-light">{shelter.name}</div>
                      <div className="text-xs text-muted-foreground font-paperlogy-light">{shelter.distance}</div>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${
                      shelter.congestion === "low" ? "bg-success" :
                      shelter.congestion === "medium" ? "bg-warning" : "bg-destructive"
                    }`} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
