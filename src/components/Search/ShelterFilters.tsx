"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface FilterOptions {
  sido?: string;
  sigungu?: string;
  emdong?: string;
  facilityType?: string;
  facilitySubType?: string;
  nightOperation?: boolean;
  weekendOperation?: boolean;
  accommodationAvailable?: boolean;
  searchKeyword?: string;
  capacityRange?: string;
  facilityArea?: string;
  coolingFacilities?: string;
}

interface ShelterFiltersProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  onReset: () => void;
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

export const ShelterFilters: React.FC<ShelterFiltersProps> = ({
  filters,
  onFiltersChange,
  onReset,
}) => {
  const handleFilterChange = (key: keyof FilterOptions, value: string | boolean) => {
    onFiltersChange({
      ...filters,
      [key]: value === "all" ? undefined : value,
    });
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border mb-6">
      {/* 첫 번째 행: 지역구분 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            지역구분
          </label>
          <Select
            value={filters.sido || ""}
            onValueChange={(value) => handleFilterChange("sido", value)}
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
          <label className="block text-sm font-medium text-gray-700 mb-2 lg:hidden">
            시군구
          </label>
          <Select
            value={filters.sigungu || ""}
            onValueChange={(value) => handleFilterChange("sigungu", value)}
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
          <label className="block text-sm font-medium text-gray-700 mb-2 lg:hidden">
            읍면동
          </label>
          <Select
            value={filters.emdong || ""}
            onValueChange={(value) => handleFilterChange("emdong", value)}
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
                handleFilterChange("accommodationAvailable", true);
                handleFilterChange("nightOperation", false);
                handleFilterChange("weekendOperation", false);
              } else if (value === "야간운영") {
                handleFilterChange("nightOperation", true);
                handleFilterChange("accommodationAvailable", false);
                handleFilterChange("weekendOperation", false);
              } else if (value === "주말운영") {
                handleFilterChange("weekendOperation", true);
                handleFilterChange("accommodationAvailable", false);
                handleFilterChange("nightOperation", false);
              } else {
                handleFilterChange("accommodationAvailable", false);
                handleFilterChange("nightOperation", false);
                handleFilterChange("weekendOperation", false);
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
            onValueChange={(value) => handleFilterChange("facilityType", value)}
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
          <label className="block text-sm font-medium text-gray-700 mb-2 sm:hidden lg:block">
            시설유형상세
          </label>
          <Select
            value={filters.facilitySubType || ""}
            onValueChange={(value) => handleFilterChange("facilitySubType", value)}
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
            onValueChange={(value) => handleFilterChange("capacityRange", value)}
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
            onValueChange={(value) => handleFilterChange("facilityArea", value)}
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
            onValueChange={(value) => handleFilterChange("coolingFacilities", value)}
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
            onChange={(e) => handleFilterChange("searchKeyword", e.target.value)}
            className="h-10 w-full"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2 opacity-0 pointer-events-none">
            버튼
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={onReset}
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
  );
};