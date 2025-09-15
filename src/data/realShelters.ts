
import type { Shelter } from "@/components/Shelter/ShelterCard";
import rawData from '../muduwi.json';

// The raw data is a JSON object with a single key "DATA" which is an array of shelters.
const shelterData = rawData.DATA;

export const realShelters: Shelter[] = shelterData.map((shelter, index) => {
  const distanceInKm = ((index % 50) / 10).toFixed(1); // Deterministic distance
  const waitTimeMinutes = (index % 10) * 3; // Deterministic wait time

  return {
    id: shelter.area_cd + "-" + index,
    name: shelter.r_area_nm,
    address: shelter.r_detl_add || shelter.lotno_addr,
    distance: `${distanceInKm} km`,
    operatingHours: "오전 9시 - 오후 6시", // Default value
    waitTime: `${waitTimeMinutes}분`,
    facilities: {
      wifi: false, // Assuming no wifi info from data
      showers: (shelter.facility_type1?.includes('샤워') || shelter.facility_type2?.includes('샤워')) ?? false,
      beds: false, // Assuming no bed info from data
      firstAid: false, // Assuming no first aid info from data
    },
    coordinates: {
      lat: shelter.lat,
      lng: shelter.lon,
    },
    use_prnb: shelter.use_prnb,
    r_area_sqr: shelter.r_area_sqr,
    rmrk: shelter.rmrk,
    facility_type1: shelter.facility_type1,
    facility_type2: shelter.facility_type2,
  };
});

/**
 * ID로 쉼터 찾기
 */
export const getShelterById = (id: string): Shelter | undefined => {
  return realShelters.find(shelter => shelter.id === id);
};

/**
 * 혼잡도 레벨별 쉼터 필터링
 */
export const getSheltersByCongestion = (level: string): Shelter[] => {
  return realShelters.filter(shelter => shelter.congestion === level);
};

/**
 * 거리순으로 쉼터 정렬 (모크 구현)
 */
export const getSheltersByDistance = (): Shelter[] => {
  return [...realShelters].sort((a, b) => 
    parseFloat(a.distance) - parseFloat(b.distance)
  );
};
