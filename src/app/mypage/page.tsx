'use client'

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  User, 
  MapPin, 
  Calendar, 
  Mail, 
  Phone, 
  Heart, 
  Clock, 
  Settings, 
  LogOut,
  ArrowLeft,
  Star,
  Navigation
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Header from "@/components/Layout/Header";
import ShelterCard from "@/components/Shelter/ShelterCard";
import { realShelters } from "@/data/realShelters";
import { crowdingManager } from "@/utils/crowdingManager";
import { favoriteManager } from "@/utils/favoriteManager";
import { useAuth } from "@/contexts/AuthContext";

export default function MyPage() {
  const router = useRouter();
  const { isLoggedIn, user, logout, isLoading: authLoading } = useAuth();
  const [favoriteShelterIds, setFavoriteShelterIds] = useState<string[]>([]);
  const [recentVisits, setRecentVisits] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 로그인 상태 확인
    if (!authLoading) {
      if (!isLoggedIn || !user) {
        router.push("/login");
        return;
      }
      
      // 즐겨찾기와 최근 방문 데이터 로드 (실제로는 백엔드에서 가져옴)
      const favorites = favoriteManager.getFavorites();
      setFavoriteShelterIds(favorites);
      
      const savedVisits = localStorage.getItem("recentVisits");
      if (savedVisits) {
        setRecentVisits(JSON.parse(savedVisits));
      }
      
      setIsLoading(false);
    }
  }, [isLoggedIn, user, authLoading, router]);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const handleToggleFavorite = (shelterId: string) => {
    const newFavoriteStatus = favoriteManager.toggleFavorite(shelterId);
    const updatedFavorites = favoriteManager.getFavorites();
    setFavoriteShelterIds(updatedFavorites);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">로딩 중...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // 즐겨찾기 쉼터들 정보
  const favoriteShelters = favoriteShelterIds
    .map(id => realShelters.find(shelter => shelter.id === id))
    .filter(Boolean);

  // 최근 방문한 쉼터들 (최대 3개)
  const recentShelters = recentVisits
    .slice(0, 3)
    .map(id => realShelters.find(shelter => shelter.id === id))
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-4xl">
        {/* 뒤로가기 버튼 */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/" className="flex items-center space-x-1">
              <ArrowLeft className="w-4 h-4" />
              <span>메인으로 돌아가기</span>
            </Link>
          </Button>
        </div>

        {/* 사용자 프로필 */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <Avatar className="w-16 h-16">
                  <AvatarFallback className="text-lg font-bold bg-primary text-primary-foreground">
                    {user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-2xl font-bold">{user.name}</h1>
                  <p className="text-muted-foreground">@{user.username}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  설정
                </Button>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  로그아웃
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span>{user.email}</span>
              </div>
              {user.phone && (
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{user.phone}</span>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>가입일: {new Date(user.joinDate).toLocaleDateString('ko-KR')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span>회원</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6">
          {/* 즐겨찾기 쉼터들 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Heart className="w-5 h-5 text-red-500" />
                <span>즐겨찾기 쉼터 ({favoriteShelters.length}개)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {favoriteShelters.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  {favoriteShelters.map((shelter) => shelter && (
                    <ShelterCard
                      key={shelter.id}
                      shelter={shelter}
                      onClick={() => router.push(`/shelter/${shelter.id}`)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Heart className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">즐겨찾기한 쉼터가 없습니다</p>
                  <Button variant="outline" size="sm" className="mt-2" asChild>
                    <Link href="/">쉼터 찾기</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 최근 방문한 쉼터 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-blue-500" />
                <span>최근 방문</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentShelters.length > 0 ? (
                <div className="space-y-3">
                  {recentShelters.map((shelter) => shelter && (
                    <div key={shelter.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{shelter.name}</h4>
                        <p className="text-xs text-muted-foreground truncate">
                          {shelter.address}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 ml-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleToggleFavorite(shelter.id)}
                          className="p-1"
                        >
                          <Heart className={`w-3 h-3 ${favoriteShelterIds.includes(shelter.id) ? 'text-red-500 fill-current' : 'text-muted-foreground'}`} />
                        </Button>
                        <Button size="sm" asChild>
                          <Link href={`/shelter/${shelter.id}`}>
                            보기
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">최근 방문한 쉼터가 없습니다</p>
                  <Button variant="outline" size="sm" className="mt-2" asChild>
                    <Link href="/">쉼터 찾기</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 이용 통계 */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <span>이용 통계</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">
                  {recentVisits.length}
                </div>
                <div className="text-sm text-muted-foreground">방문한 쉼터</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {favoriteShelterIds.length}
                </div>
                <div className="text-sm text-muted-foreground">즐겨찾기</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {Math.floor(Math.random() * 50) + 10}
                </div>
                <div className="text-sm text-muted-foreground">총 이용시간 (시간)</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {new Date().getFullYear() - new Date(user.joinDate).getFullYear() || 1}
                </div>
                <div className="text-sm text-muted-foreground">이용년수</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 빠른 액션 */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>빠른 액션</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Button variant="outline" className="h-auto p-4" asChild>
                <Link href="/" className="flex flex-col items-center space-y-2">
                  <MapPin className="w-6 h-6" />
                  <span className="text-sm">쉼터 찾기</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto p-4" asChild>
                <Link href="/" className="flex flex-col items-center space-y-2">
                  <Navigation className="w-6 h-6" />
                  <span className="text-sm">주변 쉼터</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto p-4">
                <div className="flex flex-col items-center space-y-2">
                  <Settings className="w-6 h-6" />
                  <span className="text-sm">설정</span>
                </div>
              </Button>
              <Button variant="outline" className="h-auto p-4" asChild>
                <Link href="/about" className="flex flex-col items-center space-y-2">
                  <User className="w-6 h-6" />
                  <span className="text-sm">서비스 소개</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}