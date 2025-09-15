# 쉼터 스팟 가이드 (Shelter Spot Guide)

## 프로젝트 소개

실시간 혼잡도 데이터와 함께 근처 쉼터와 냉방센터를 찾아볼 수 있는 웹 애플리케이션입니다. 무더운 날씨에 안전한 쉼터를 제공하는 종합 가이드입니다.

## 주요 기능

- 🗺️ **실시간 지도**: 인터랙티브 지도에서 쉼터 위치 확인
- 📊 **혼잡도 추적**: 실시간 혼잡도 정보 (여유/보통/혼잡)
- 🔍 **스마트 검색**: 쉼터명, 주소로 빠른 검색
- 📱 **모바일 최적화**: 반응형 디자인으로 모든 기기 지원
- 🚶 **길찾기**: 선택한 쉼터까지의 경로 안내
- 💙 **접근성**: 한국어 지원 및 사용하기 쉬운 인터페이스

## 기술 스택

이 프로젝트는 다음 기술들로 구축되었습니다:

- **Next.js 14** - React 기반 풀스택 프레임워크
- **TypeScript** - 타입 안전성을 위한 정적 타입 검사
- **React 18** - 사용자 인터페이스 라이브러리
- **Tailwind CSS** - 유틸리티 우선 CSS 프레임워크
- **shadcn/ui** - 재사용 가능한 UI 컴포넌트 라이브러리
- **Lucide React** - 아이콘 라이브러리
- **TanStack Query** - 서버 상태 관리

## 설치 및 실행

Node.js와 npm이 설치되어 있어야 합니다 - [nvm으로 설치하기](https://github.com/nvm-sh/nvm#installing-and-updating)

다음 단계를 따라주세요:

```bash
# 1단계: 저장소 클론
git clone https://github.com/dawnstar09/shelter-spot-guide.git

# 2단계: 프로젝트 디렉토리로 이동
cd shelter-spot-guide

# 3단계: 환경 변수 설정
cp .env.example .env.local
# .env.local 파일을 편집하여 실제 API 키를 입력하세요

# 4단계: 의존성 설치
npm install

# 5단계: 개발 서버 시작
npm run dev
```

개발 서버가 [http://localhost:3000](http://localhost:3000)에서 실행됩니다.

## 환경 변수 설정

프로젝트를 실행하기 전에 환경 변수를 설정해야 합니다:

1. `.env.example` 파일을 `.env.local`로 복사합니다
2. TMAP API 키를 발급받아 설정합니다:
   - [SK 오픈 API](https://openapi.sk.com/)에서 회원가입
   - TMAP API 서비스 신청
   - 발급받은 API 키를 `.env.local`의 `NEXT_PUBLIC_TMAP_API_KEY`에 입력

필수 환경 변수:
- `NEXT_PUBLIC_TMAP_API_KEY`: TMAP API 키 (지도 표시를 위해 필요)

## 스크립트

- `npm run dev` - 개발 서버 시작
- `npm run build` - 프로덕션 빌드
- `npm run start` - 프로덕션 서버 시작  
- `npm run lint` - ESLint로 코드 검사

## 프로젝트 구조

```
src/
├── app/                # Next.js App Router 페이지
│   ├── page.tsx       # 홈페이지
│   ├── layout.tsx     # 루트 레이아웃
│   ├── about/         # 소개 페이지
│   └── shelters/      # 쉼터 목록 페이지
├── components/        # 재사용 가능한 컴포넌트
│   ├── Layout/        # 레이아웃 컴포넌트
│   ├── Map/           # 지도 관련 컴포넌트
│   ├── Shelter/       # 쉼터 관련 컴포넌트
│   └── ui/            # shadcn/ui 컴포넌트
├── data/              # 모크 데이터
├── hooks/             # 커스텀 React 훅
└── lib/               # 유틸리티 함수
```

## 기여하기

1. 이 저장소를 포크합니다
2. 새로운 기능 브랜치를 생성합니다 (`git checkout -b feature/amazing-feature`)
3. 변경사항을 커밋합니다 (`git commit -m 'Add amazing feature'`)
4. 브랜치에 푸시합니다 (`git push origin feature/amazing-feature`)
5. Pull Request를 생성합니다

## 라이선스

이 프로젝트는 MIT 라이선스 하에 있습니다.
