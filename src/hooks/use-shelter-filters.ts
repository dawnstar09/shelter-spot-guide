import { useMemo, useState } from 'react';
import type { Shelter } from '@/components/Shelter/ShelterCard';

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

const useShelterFilters = (shelters: Shelter[]) => {
  const [filters, setFilters] = useState<FilterOptions>({});

  const filteredShelters = useMemo(() => {
    let filtered = [...shelters];

    // 지역 필터링 (시도)
    if (filters.sido) {
      filtered = filtered.filter(shelter =>
        shelter.address?.includes(filters.sido!)
      );
    }

    // 지역 필터링 (시군구)
    if (filters.sigungu) {
      filtered = filtered.filter(shelter =>
        shelter.address?.includes(filters.sigungu!)
      );
    }

    // 지역 필터링 (읍면동)
    if (filters.emdong) {
      filtered = filtered.filter(shelter =>
        shelter.address?.includes(filters.emdong!)
      );
    }

    // 시설유형 필터링
    if (filters.facilityType) {
      filtered = filtered.filter(shelter =>
        shelter.facilityType === filters.facilityType
      );
    }

    // 시설유형상세 필터링 (시설명에서 키워드 검색)
    if (filters.facilitySubType) {
      const keyword = filters.facilitySubType;
      filtered = filtered.filter(shelter =>
        shelter.name?.includes(keyword) || 
        shelter.specialNotes?.includes(keyword)
      );
    }

    // 수용인원 필터링
    if (filters.capacityRange) {
      filtered = filtered.filter(shelter => {
        const capacity = parseInt(shelter.capacity || '0');
        switch (filters.capacityRange) {
          case '50-': return capacity < 50;
          case '50-100': return capacity >= 50 && capacity <= 100;
          case '100-200': return capacity > 100 && capacity <= 200;
          case '200-500': return capacity > 200 && capacity <= 500;
          case '500+': return capacity > 500;
          default: return true;
        }
      });
    }

    // 시설면적 필터링
    if (filters.facilityArea) {
      filtered = filtered.filter(shelter => {
        const area = parseFloat(shelter.facilityArea || '0');
        switch (filters.facilityArea) {
          case '100-': return area < 100;
          case '100-300': return area >= 100 && area <= 300;
          case '300-500': return area > 300 && area <= 500;
          case '500-1000': return area > 500 && area <= 1000;
          case '1000+': return area > 1000;
          default: return true;
        }
      });
    }

    // 냉방시설 필터링
    if (filters.coolingFacilities) {
      filtered = filtered.filter(shelter => {
        const fanCount = parseInt(shelter.fanCount || '0');
        const acCount = parseInt(shelter.acCount || '0');
        
        switch (filters.coolingFacilities) {
          case 'fan': return fanCount > 0 && acCount === 0;
          case 'ac': return acCount > 0 && fanCount === 0;
          case 'both': return fanCount > 0 && acCount > 0;
          case 'none': return fanCount === 0 && acCount === 0;
          default: return true;
        }
      });
    }

    // 야간운영 필터링
    if (filters.nightOperation) {
      filtered = filtered.filter(shelter =>
        shelter.nightOperation === true
      );
    }

    // 주말운영 필터링
    if (filters.weekendOperation) {
      filtered = filtered.filter(shelter =>
        shelter.weekendOperation === true
      );
    }

    // 숙박가능 필터링
    if (filters.accommodationAvailable) {
      filtered = filtered.filter(shelter =>
        shelter.accommodationAvailable === true
      );
    }

    // 키워드 검색 (시설명)
    if (filters.searchKeyword && filters.searchKeyword.trim()) {
      const keyword = filters.searchKeyword.toLowerCase().trim();
      filtered = filtered.filter(shelter =>
        shelter.name?.toLowerCase().includes(keyword) ||
        shelter.address?.toLowerCase().includes(keyword) ||
        shelter.facilityType?.toLowerCase().includes(keyword) ||
        shelter.specialNotes?.toLowerCase().includes(keyword)
      );
    }

    return filtered;
  }, [shelters, filters]);

  const updateFilters = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  const resetFilters = () => {
    setFilters({});
  };

  return {
    filters,
    filteredShelters,
    updateFilters,
    resetFilters,
    totalCount: shelters.length,
    filteredCount: filteredShelters.length,
  };
};

export { useShelterFilters };
export default useShelterFilters;