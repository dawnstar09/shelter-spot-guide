import { MapPin, Clock, Wifi, Bath, Bed, Heart, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

/**
 * 혼잡도 레벨 타입 정의
 */
export type CongestionLevel = "low" | "medium" | "high";

/**
 * 쉼터 데이터 인터페이스
 */
export interface Shelter {
  id: string;
  name: string;
  address: string;
  distance: string;
  operatingHours: string;
  congestion: CongestionLevel;
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
  use_prnb: number;
  r_area_sqr: string;
  rmrk: string | null;
  facility_type1: string;
  facility_type2: string;
}

/**
 * ShelterCard 컴포넌트 props
 */
interface ShelterCardProps {
  shelter: Shelter;
  showMap?: boolean;
}

/**
 * 혼잡도 레벨에 따른 색상과 텍스트 반환
 */
const getCongestionInfo = (level: CongestionLevel) => {
  switch (level) {
    case "low":
      return {
        variant: "success" as const,
        text: "여유",
        color: "text-success-foreground",
        bgColor: "bg-success"
      };
    case "medium":
      return {
        variant: "warning" as const,
        text: "보통",
        color: "text-warning-foreground",
        bgColor: "bg-warning"
      };
    case "high":
      return {
        variant: "destructive" as const,
        text: "혼잡",
        color: "text-destructive-foreground",
        bgColor: "bg-destructive"
      };
  }
};

/**
 * ShelterCard 컴포넌트 - 카드 형태로 쉼터 정보를 표시합니다
 * 쉼터 목록과 추천에서 사용됩니다
 */
const ShelterCard = ({ shelter, showMap = false }: ShelterCardProps) => {
  const congestionInfo = getCongestionInfo(shelter.congestion);

  return (
    <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary">
      <CardHeader className="pb-3">
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
                <span className="font-paperlogy-light whitespace-nowrap">{shelter.operatingHours}</span>
              </div>
            </div>
          </div>
          
          {/* 혼잡도 상태 */}
          <div className="text-right">
            <Badge variant={congestionInfo.variant} className="mb-2">
              {congestionInfo.text}
            </Badge>
            <div className="text-xs text-muted-foreground font-paperlogy-light">
              대기시간: {shelter.waitTime}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* 시설 정보 */}
        <div className="flex items-center space-x-4 mb-4">
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