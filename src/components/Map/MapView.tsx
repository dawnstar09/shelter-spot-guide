import { useEffect, useRef, useState, Dispatch, SetStateAction } from "react";
import { Card } from "@/components/ui/card";
import type { Shelter } from "@/components/Shelter/ShelterCard";

// T-map API 타입 선언
declare global {
  interface Window {
    Tmapv3: any;
  }
}

interface MapViewProps {
  shelters: Shelter[];
  selectedShelterId?: string | null;
  onShelterSelect: Dispatch<SetStateAction<Shelter | null>>;
  className?: string;
}

const MapView = ({ shelters, selectedShelterId, onShelterSelect, className }: MapViewProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!window.Tmapv3) {
      setError("Tmapv3가 준비되지 않았습니다. (스크립트가 layout.tsx에서 head에 동기적으로 삽입되어야 합니다)");
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
      mapInstanceRef.current = new window.Tmapv3.Map(mapRef.current, {
        center: new window.Tmapv3.LatLng(37.56520450, 126.98702028),
        width: "100%",
        height: "100%",
        zoom: 16
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
    if (!isLoaded || !mapInstanceRef.current || !shelters) return;

    // 기존 마커 정리
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    shelters.forEach(shelter => {
      const position = new window.Tmapv3.LatLng(shelter.coordinates.lat, shelter.coordinates.lng);
      const isSelected = shelter.id === selectedShelterId;

      const marker = new window.Tmapv3.Marker({
        position,
        map: mapInstanceRef.current,
        icon: '/marker.ico',
        iconSize: new window.Tmapv3.Size(24, 38),
        title: shelter.name
      });

      marker.on('click', () => onShelterSelect(shelter));
      markersRef.current.push(marker);
    });

    if (selectedShelterId) {
      const selected = shelters.find(s => s.id === selectedShelterId);
      if (selected) {
        const center = new window.Tmapv3.LatLng(selected.coordinates.lat, selected.coordinates.lng);
        mapInstanceRef.current.setCenter(center);
      }
    } else if (shelters.length > 0) {
      // 선택된 쉼터가 없으면 첫번째 쉼터 기준으로 지도 중앙 이동
      const center = new window.Tmapv3.LatLng(shelters[0].coordinates.lat, shelters[0].coordinates.lng);
      mapInstanceRef.current.setCenter(center);
    }

  }, [isLoaded, shelters, selectedShelterId, onShelterSelect]);

  return (
    <Card className={`w-full h-full flex items-center justify-center relative ${className}`}>
      {error && (
        <span className="text-destructive text-sm">{error}</span>
      )}
      <div ref={mapRef} className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }} />
      {!error && !isLoaded && (
        <span className="text-muted-foreground">지도를 불러오는 중...</span>
      )}
    </Card>
  );
};

export default MapView;