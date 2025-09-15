# TMAP API 설정 가이드

## 1. SK Open API 가입 및 API 키 발급

1. [SK Open API 포털](https://openapi.sk.com/)에 접속
2. 회원가입 또는 로그인
3. "API 신청" → "TMAP API" 선택
4. 서비스 신청서 작성 및 제출
5. 승인 후 API 키 발급 확인

## 2. 환경 변수 설정

1. 프로젝트 루트에서 `.env.example`을 `.env.local`로 복사:
   ```bash
   cp .env.example .env.local
   ```

2. `.env.local` 파일을 편집하여 발급받은 API 키 입력:
   ```env
   NEXT_PUBLIC_TMAP_API_KEY=your_actual_api_key_here
   ```

## 3. 확인 방법

- 개발 서버 실행: `npm run dev`
- 브라우저에서 http://localhost:3000 접속
- 지도가 정상적으로 로드되는지 확인

## 주의사항

- ⚠️ `.env.local` 파일은 절대 Git에 커밋하지 마세요
- 🔑 API 키는 외부에 노출되지 않도록 주의하세요
- 📝 팀원과 공유할 때는 별도의 안전한 방법을 사용하세요

## 문제 해결

### 지도가 로드되지 않는 경우
1. API 키가 올바르게 설정되었는지 확인
2. 브라우저 개발자 도구에서 네트워크 탭 확인
3. TMAP API 서비스 승인 상태 확인

### 환경 변수가 인식되지 않는 경우
1. 변수명이 `NEXT_PUBLIC_` 접두어로 시작하는지 확인
2. 개발 서버 재시작 (`npm run dev`)
3. `.env.local` 파일 위치가 프로젝트 루트에 있는지 확인