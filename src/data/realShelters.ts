
import type { Shelter } from "@/components/Shelter/ShelterCard";
import rawData from '../muduwi_real.json';

// Raw data interface
interface RawShelterData {
  RESTARER_FACLT_NM: string;
  RESTARER_TYPE_DIV_NM: string;
  FACLT_AR: string;
  UTLZ_POSBL_PSNCNT: string;
  ELEFAN_HOLD_VCNT: string;
  ARCNDTN_HOLD_VCNT: string;
  NIGHT_EXTS_OPERT_YN: string;
  WKEND_OPERT_YN: string;
  STAYNG_POSBL_YN: string;
  PARTCLR_MATR: string;
  REFINE_ROADNM_ADDR: string;
  REFINE_LOTNO_ADDR: string;
  REFINE_WGS84_LAT: string;
  REFINE_WGS84_LOGT: string;
  DATA_STD_DE: string;
  TMP_CONT03: string;
}

// The raw data is a direct array of shelters
const shelterData = rawData as RawShelterData[];

// 성능 최적화: 화성시 데이터만 필터링 (데이터 양 감소)
const filteredShelterData = shelterData.filter(shelter => 
  shelter.REFINE_ROADNM_ADDR?.includes("화성시") || shelter.REFINE_LOTNO_ADDR?.includes("화성시")
);

export const realShelters: Shelter[] = filteredShelterData.map((shelter, index) => {
  const distanceInKm = ((index % 50) / 10).toFixed(1); // Deterministic distance
  const waitTimeMinutes = (index % 10) * 3; // Deterministic wait time

  // Map facility type codes to Korean descriptions
  const getFacilityType = (code: string) => {
    switch (code) {
      case "001": return "사회복지시설";
      case "002": return "교육시설";
      case "003": return "경로당";
      default: return "기타시설";
    }
  };

  // 고정된 400개 정도에 역방향 스케줄 적용 (인덱스 기반으로 고정)
  // 인덱스가 홀수인 경우에 역방향 스케줄 적용 (약 50% 고정)
  const reverseSchedule = index % 2 === 1;

  return {
    id: `shelter-${index}`,
    name: shelter.RESTARER_FACLT_NM,
    address: shelter.REFINE_ROADNM_ADDR || shelter.REFINE_LOTNO_ADDR,
    distance: `${distanceInKm} km`,
    operatingHours: "오전 9시 - 오후 6시", // Default value - can be enhanced with NIGHT_EXTS_OPERT_YN, WKEND_OPERT_YN
    waitTime: `${waitTimeMinutes}분`,
    facilities: {
      wifi: false, // Not available in data
      showers: false, // Not available in data
      beds: shelter.STAYNG_POSBL_YN === "Y", // Based on accommodation availability
      firstAid: false, // Not available in data
    },
    coordinates: {
      lat: parseFloat(shelter.REFINE_WGS84_LAT),
      lng: parseFloat(shelter.REFINE_WGS84_LOGT),
    },
    // Additional fields from the new data source
    facilityType: getFacilityType(shelter.RESTARER_TYPE_DIV_NM),
    facilityArea: shelter.FACLT_AR,
    capacity: shelter.UTLZ_POSBL_PSNCNT,
    fanCount: shelter.ELEFAN_HOLD_VCNT,
    acCount: shelter.ARCNDTN_HOLD_VCNT,
    nightOperation: shelter.NIGHT_EXTS_OPERT_YN === "Y",
    weekendOperation: shelter.WKEND_OPERT_YN === "Y",
    reverseSchedule: reverseSchedule,
    accommodationAvailable: shelter.STAYNG_POSBL_YN === "Y",
    specialNotes: shelter.PARTCLR_MATR,
    dataStandardDate: shelter.DATA_STD_DE,
  };
});

/**
 * ID로 쉼터 찾기
 */
export const getShelterById = (id: string): Shelter | undefined => {
  return realShelters.find(shelter => shelter.id === id);
};

/**
 * 거리순으로 쉼터 정렬 (모크 구현)
 */
export const getSheltersByDistance = (): Shelter[] => {
  return [...realShelters].sort((a, b) => 
    parseFloat(a.distance) - parseFloat(b.distance)
  );
};
