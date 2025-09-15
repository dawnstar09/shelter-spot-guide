import { useEffect, useRef, useState, Dispatch, SetStateAction } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navigation, MapPin, X } from "lucide-react";
import type { Shelter } from "@/components/Shelter/ShelterCard";
import { crowdingManager } from "@/utils/crowdingManager";
import { CrowdingLevel, CROWDING_LEVELS } from "@/types/crowding";
import { env } from "@/lib/env";

// T-map API 타입 선언
declare global {
  interface Window {
    Tmapv2: any;
  }
}

interface MapViewProps {
  shelters: (Shelter & { distance?: string; distanceValue?: number })[];
  selectedShelterId?: string | null;
  onShelterSelect: Dispatch<SetStateAction<Shelter | null>>;
  onUserLocationChange?: (location: UserLocation | null) => void;
  className?: string;
  enableRouting?: boolean;
}

interface UserLocation {
  lat: number;
  lng: number;
}

const MapView = ({ shelters, selectedShelterId, onShelterSelect, onUserLocationChange, className, enableRouting = false }: MapViewProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
  const routeLineRef = useRef<any>(null);
  
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [isRoutingMode, setIsRoutingMode] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{distance: string, time: string} | null>(null);

  // 사용자 위치 마커를 위한 초록색 SVG 아이콘
  const getUserMarkerIcon = () => {
    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
      <g fill="none" fill-rule="evenodd">
        <circle cx="18" cy="14" r="8" fill="#22c55e"/>
        <path d="M18 34c5-6 10-11 10-18a10 10 0 10-20 0c0 7 5 12 10 18z" fill="#16a34a"/>
        <circle cx="18" cy="14" r="3.5" fill="#fff"/>
      </g>
    </svg>`;
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg.trim());
  };

  // 혼잡도별 쉼터 마커 아이콘 생성
  const getShelterMarkerIcon = (crowdingLevel: CrowdingLevel) => {
    const colors = {
      "여유": { main: "#22c55e", dark: "#16a34a" },    // 초록색
      "보통": { main: "#eab308", dark: "#ca8a04" },    // 노란색  
      "혼잡": { main: "#ef4444", dark: "#dc2626" }     // 빨간색
    };
    
    const color = colors[crowdingLevel];
    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <g fill="none" fill-rule="evenodd">
        <circle cx="16" cy="12" r="6" fill="${color.main}"/>
        <path d="M16 30c4-5 8-9 8-16a8 8 0 10-16 0c0 7 4 11 8 16z" fill="${color.dark}"/>
        <circle cx="16" cy="12" r="2.5" fill="#fff"/>
      </g>
    </svg>`;
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg.trim());
  };

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
  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setError("브라우저가 위치 서비스를 지원하지 않습니다.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLoc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserLocation(userLoc);
        onUserLocationChange?.(userLoc);
        
        if (mapInstanceRef.current) {
          // 사용자 위치로 지도 중심 이동
          mapInstanceRef.current.setCenter(new window.Tmapv2.LatLng(userLoc.lat, userLoc.lng));
          mapInstanceRef.current.setZoom(16);
          
          // 기존 사용자 마커 제거
          if (userMarkerRef.current) {
            userMarkerRef.current.setMap(null);
          }
          
          // 새 사용자 마커 추가
          userMarkerRef.current = new window.Tmapv2.Marker({
            position: new window.Tmapv2.LatLng(userLoc.lat, userLoc.lng),
            map: mapInstanceRef.current,
            icon: getUserMarkerIcon(),
            iconSize: new window.Tmapv2.Size(36, 36),
            title: "내 위치"
          });
        }
      },
      (error) => {
        console.error("위치 가져오기 실패:", error);
        setError("위치 접근이 거부되었습니다. 브라우저 설정을 확인해주세요.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // enableRouting prop에 따른 자동 길찾기 실행
  useEffect(() => {
    if (enableRouting && selectedShelterId && userLocation) {
      const selectedShelter = shelters.find(s => s.id === selectedShelterId);
      if (selectedShelter) {
        setIsRoutingMode(true);
        findRoute(selectedShelter);
      }
    }
  }, [enableRouting, selectedShelterId, userLocation, shelters]);

  // 길찾기 기능 - 고급 TMAP API 사용
  const findRoute = async (targetShelter: Shelter) => {
    console.log("🎯 길찾기 함수 호출됨!", targetShelter.name);
    
    if (!userLocation) {
      console.error("❌ 사용자 위치 없음");
      setError("먼저 내 위치를 확인해주세요.");
      return;
    }

    console.log("🔄 길찾기 모드 시작");
    setIsRoutingMode(true);
    setError(null);

    try {
      console.log("길찾기 시작:", userLocation, "->", targetShelter.coordinates);
      
      // 좌표값 유효성 검사
      const isValidCoord = (lat: number, lng: number) => {
        return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
      };
      
      if (!isValidCoord(userLocation.lat, userLocation.lng)) {
        throw new Error(`출발지 좌표가 유효하지 않습니다: ${userLocation.lat}, ${userLocation.lng}`);
      }
      
      if (!isValidCoord(targetShelter.coordinates.lat, targetShelter.coordinates.lng)) {
        throw new Error(`도착지 좌표가 유효하지 않습니다: ${targetShelter.coordinates.lat}, ${targetShelter.coordinates.lng}`);
      }

      // 한국 내 좌표인지 확인 (대략적인 범위)
      const isInKorea = (lat: number, lng: number) => {
        return lat >= 33 && lat <= 39 && lng >= 124 && lng <= 132;
      };
      
      if (!isInKorea(userLocation.lat, userLocation.lng)) {
        console.warn("⚠️ 출발지가 한국 외 지역일 수 있습니다:", userLocation);
      }
      
      if (!isInKorea(targetShelter.coordinates.lat, targetShelter.coordinates.lng)) {
        console.warn("⚠️ 도착지가 한국 외 지역일 수 있습니다:", targetShelter.coordinates);
      }
      
      // 직선 거리 계산
      const straightDistance = calculateDistance(
        userLocation.lat, userLocation.lng,
        targetShelter.coordinates.lat, targetShelter.coordinates.lng
      );

      const apiKey = env.TMAP_API_KEY;
      console.log("🔑 TMAP API Key 확인:", apiKey ? "존재함" : "없음", apiKey ? apiKey.substring(0, 10) + "..." : "없음");

      if (!apiKey) {
        throw new Error("TMAP API 키가 설정되지 않았습니다. .env.local 파일을 확인해주세요.");
      }

      const headers = {
        "appKey": apiKey,
        "Content-Type": "application/json",
        "Accept": "application/json"
      };

      // TMAP pedestrian API 요청 형식에 맞게 수정
      const requestBody = {
        startX: userLocation.lng.toString(),
        startY: userLocation.lat.toString(),
        endX: targetShelter.coordinates.lng.toString(),
        endY: targetShelter.coordinates.lat.toString(),
        reqCoordType: "WGS84GEO",
        resCoordType: "WGS84GEO",
        startName: encodeURIComponent("현재위치"),
        endName: encodeURIComponent(targetShelter.name),
        searchOption: "0"
      };

      console.log("🚀 길찾기 API 요청 시작");
      console.log("📍 출발지:", { lat: userLocation.lat, lng: userLocation.lng });
      console.log("🏠 도착지:", { lat: targetShelter.coordinates.lat, lng: targetShelter.coordinates.lng });
      console.log("📋 요청 데이터:", requestBody);
      console.log("🔗 요청 헤더:", headers);

      // API 호출
      console.log("📡 TMAP API 호출 중...");
      const response = await fetch("https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1&format=json", {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody)
      });

      console.log("✅ API 응답 상태:", response.status);
      console.log("📊 응답 헤더:", Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ TMAP API 에러 상세 분석:");
        console.error("📊 상태:", response.status, response.statusText);
        console.error("🔍 요청 URL:", "https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1&format=json");
        console.error("📋 요청 헤더:", headers);
        console.error("📦 요청 바디:", JSON.stringify(requestBody, null, 2));
        console.error("💥 응답 에러:", errorText);
        
        // 400 에러의 경우 더 구체적인 메시지 제공
        if (response.status === 400) {
          console.error("🚨 400 Bad Request - 가능한 원인:");
          console.error("1. API Key 문제");
          console.error("2. 좌표값 형식 오류");
          console.error("3. 필수 파라미터 누락");
          console.error("4. 좌표 범위 초과 (한국 외 지역)");
        }
        
        throw new Error(`길찾기 API 오류 (${response.status}): ${response.statusText}\n상세: ${errorText}`);
      }

      const data = await response.json();
      console.log("✅ API 응답 데이터 수신 완료");
      console.log("📦 응답 데이터:", data);

      if (data.error) {
        throw new Error(data.error);
      }

      // 응답 데이터 처리
      let pathLatLngs: any[] = [];
      let totalDistance = 0;
      let totalTime = 0;
      let turnPoints: any[] = [];
      let routeDescription: string[] = [];

      if (data.features && data.features.length > 0) {
        // API 응답에서 경로 정보 추출
        data.features.forEach((feature: any, index: number) => {
          const { geometry, properties } = feature;
          
          if (geometry) {
            if (geometry.type === "LineString") {
              // 경로 라인 좌표
              const coordinates = geometry.coordinates;
              coordinates.forEach((coord: number[]) => {
                pathLatLngs.push(new window.Tmapv2.LatLng(coord[1], coord[0]));
              });
            } else if (geometry.type === "Point") {
              // 경유점 정보
              const coord = geometry.coordinates;
              turnPoints.push({
                position: new window.Tmapv2.LatLng(coord[1], coord[0]),
                description: properties?.description || "",
                turnType: properties?.turnType || 0,
                pointType: properties?.pointType || ""
              });
            }
          }
          
          if (properties) {
            totalDistance += properties.distance || 0;
            totalTime += properties.time || 0;
            
            // 경로 안내 설명 추가
            if (properties.description) {
              routeDescription.push(properties.description);
            }
          }
        });

        // 경로 최적화 - 중복 좌표 제거
        pathLatLngs = pathLatLngs.filter((point, index, array) => {
          if (index === 0) return true;
          const prev = array[index - 1];
          return Math.abs(point.lat() - prev.lat()) > 0.00001 || 
                 Math.abs(point.lng() - prev.lng()) > 0.00001;
        });

      } else {
        // API 실패 시 직선 거리로 대체
        console.log("API 응답이 없어 직선 거리로 계산");
        pathLatLngs = [
          new window.Tmapv2.LatLng(userLocation.lat, userLocation.lng),
          new window.Tmapv2.LatLng(targetShelter.coordinates.lat, targetShelter.coordinates.lng)
        ];
        
        totalDistance = straightDistance * 1000; // m 단위로 변환
        totalTime = (totalDistance / 1000) * 12 * 60; // 도보 속도 5km/h 가정 (시간은 초 단위)
      }

      console.log("파싱된 경로 정보:", { 
        totalDistance, 
        totalTime, 
        pathLength: pathLatLngs.length,
        turnPoints: turnPoints.length 
      });

      // 기존 경로 제거
      if (routeLineRef.current) {
        routeLineRef.current.setMap(null);
      }

      // 새 경로 표시 (고급 스타일링)
      routeLineRef.current = new window.Tmapv2.Polyline({
        path: pathLatLngs,
        strokeColor: "#2563eb", // 블루 컬러
        strokeWeight: 8,
        strokeOpacity: 0.9,
        strokeStyle: "solid",
        map: mapInstanceRef.current
      });

      // 경로 외곽선 추가 (더 명확한 시각화)
      const routeOutline = new window.Tmapv2.Polyline({
        path: pathLatLngs,
        strokeColor: "#ffffff",
        strokeWeight: 12,
        strokeOpacity: 0.7,
        map: mapInstanceRef.current
      });

      // 화면에 경로가 모두 보이도록 조정
      const bounds = new window.Tmapv2.LatLngBounds();
      pathLatLngs.forEach((ll: any) => bounds.extend(ll));
      
      // 여백 추가
      const padding = {
        top: 50,
        right: 50,
        bottom: 50,
        left: 50
      };
      mapInstanceRef.current.fitBounds(bounds, padding);

      // 경로 정보 설정 (더 정확한 계산)
      const distanceKm = (totalDistance / 1000).toFixed(2);
      const timeMin = Math.round(totalTime / 60);
      const timeHour = Math.floor(timeMin / 60);
      const remainMin = timeMin % 60;
      
      let timeString = "";
      if (timeHour > 0) {
        timeString = `${timeHour}시간 ${remainMin}분`;
      } else {
        timeString = `${timeMin}분`;
      }

      setRouteInfo({ 
        distance: `${distanceKm} km`, 
        time: timeString
      });

      console.log("길찾기 완료:", { 
        distance: distanceKm, 
        time: timeString,
        pathPoints: pathLatLngs.length,
        turnPoints: turnPoints.length 
      });

    } catch (error) {
      console.error("💥 길찾기 오류 발생!");
      console.error("🚨 오류 상세:", error);
      console.error("🔍 오류 타입:", typeof error);
      console.error("📋 오류 스택:", error instanceof Error ? error.stack : "스택 없음");
      
      const errorMessage = error instanceof Error ? error.message : "길찾기 중 오류가 발생했습니다.";
      console.error("📝 사용자에게 표시할 메시지:", errorMessage);
      
      setError(errorMessage);
      setIsRoutingMode(false);
    }
  };

  // 경로 지우기
  const clearRoute = () => {
    if (routeLineRef.current) {
      routeLineRef.current.setMap(null);
      routeLineRef.current = null;
    }
    setIsRoutingMode(false);
    setRouteInfo(null);
    setError(null);
  };

  useEffect(() => {
    if (!window.Tmapv2) {
      setError("Tmapv2가 준비되지 않았습니다. (스크립트가 layout.tsx에서 head에 동기적으로 삽입되어야 합니다)");
      return;
    }
    if (!mapRef.current) {
      setError("지도 컨테이너가 준비되지 않았습니다.");
      return;
    }
    // 기존 map 인스턴스가 있으면 정리
    if (mapInstanceRef.current) {
      mapInstanceRef.current.destroy && mapInstanceRef.current.destroy();
      mapInstanceRef.current = null;
      if (mapRef.current) mapRef.current.innerHTML = '';
    }
    try {
      mapInstanceRef.current = new window.Tmapv2.Map(mapRef.current, {
        center: new window.Tmapv2.LatLng(env.MAP_CENTER_LAT, env.MAP_CENTER_LNG),
        width: "100%",
        height: "100%",
        zoom: env.MAP_DEFAULT_ZOOM
      });
      setIsLoaded(true);
    } catch (e) {
      setError("지도 초기화 실패: " + (e instanceof Error ? e.message : String(e)));
    }
    // 언마운트 시 map 정리
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy && mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
      }
      if (mapRef.current) mapRef.current.innerHTML = '';
    };
  }, []);

  useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current) return;

    // 기존 마커 정리
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // 선택된 쉼터가 있을 때만 해당 쉼터의 마커 표시
    if (selectedShelterId && shelters) {
      const selectedShelter = shelters.find(s => s.id === selectedShelterId);
      
      if (selectedShelter) {
        const position = new window.Tmapv2.LatLng(selectedShelter.coordinates.lat, selectedShelter.coordinates.lng);
        
        // 혼잡도 정보 가져오기
        const crowdingData = crowdingManager.getCrowdingData(selectedShelter.id);
        const markerIcon = getShelterMarkerIcon(crowdingData.level);

        const marker = new window.Tmapv2.Marker({
          position,
          map: mapInstanceRef.current,
          title: `${selectedShelter.name} (${crowdingData.level})`,
          icon: markerIcon
        });

        marker.addListener('click', () => {
          // 클릭 데이터 기록
          crowdingManager.recordClick(selectedShelter.id);
          
          onShelterSelect(selectedShelter);
          // 길찾기 모드가 활성화되어 있고 사용자 위치가 있으면 자동으로 경로 찾기
          if (isRoutingMode && userLocation) {
            findRoute(selectedShelter);
          }
        });

        markersRef.current.push(marker);

        // 선택된 쉼터로 지도 중심 이동
        const center = new window.Tmapv2.LatLng(selectedShelter.coordinates.lat, selectedShelter.coordinates.lng);
        mapInstanceRef.current.setCenter(center);
      }
    }

  }, [isLoaded, shelters, selectedShelterId, onShelterSelect, isRoutingMode, userLocation]);

  return (
    <Card className={`w-full h-full flex items-center justify-center relative ${className}`}>
      {/* 지도 컨트롤 패널 */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <Button
          onClick={getUserLocation}
          size="sm"
          variant={userLocation ? "default" : "outline"}
          className="flex items-center gap-2"
        >
          <MapPin className="w-4 h-4" />
          내 위치
        </Button>
        
        {userLocation && (
          <Button
            onClick={() => setIsRoutingMode(!isRoutingMode)}
            size="sm"
            variant={isRoutingMode ? "default" : "outline"}
            className="flex items-center gap-2"
          >
            <Navigation className="w-4 h-4" />
            길찾기 {isRoutingMode ? "ON" : "OFF"}
          </Button>
        )}
        
        {isRoutingMode && routeLineRef.current && (
          <Button
            onClick={clearRoute}
            size="sm"
            variant="destructive"
            className="flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            경로 지우기
          </Button>
        )}
      </div>

      {/* 경로 정보 패널 */}
      {routeInfo && (
        <div className="absolute top-4 right-4 z-10 bg-background border border-border rounded-lg p-3 shadow-lg">
          <div className="text-sm font-medium">경로 정보</div>
          <div className="text-sm text-muted-foreground">
            거리: <span className="font-semibold">{routeInfo.distance}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            예상 시간: <span className="font-semibold">{routeInfo.time}</span>
          </div>
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <div className="absolute bottom-4 left-4 right-4 z-10 bg-destructive text-destructive-foreground p-3 rounded-lg shadow-lg">
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* 지도 컨테이너 */}
      <div ref={mapRef} className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }} />
      
      {/* 로딩 메시지 */}
      {!error && !isLoaded && (
        <span className="text-muted-foreground">지도를 불러오는 중...</span>
      )}
    </Card>
  );
};

export default MapView;