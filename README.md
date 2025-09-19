
---

# 🚗 Car Configurator

Next.js 기반의 자동차 구성 시뮬레이터입니다.
사용자가 **카테고리 → 모델 → 파워트레인 → 트림 → 옵션** 순서로 선택하면, 실시간 가격 계산 및 JSON 구성 결과를 확인할 수 있습니다.

---

## ✨ 주요 기능

* 카테고리별 JSON 데이터 동적 로딩 (`/public/data/승용.json`)
* 단계별 선택 UI (모델 → 파워트레인 → 트림 → 옵션)
* 옵션 의존성(`requires`) 검증 및 기본 포함 옵션 처리
* 가격 계산 (기본 가격 + 옵션 가격)
* 실시간 구성 결과 JSON 출력
* JSON 데이터 직접 수정 & 반영 가능

---

## 🛠 기술 스택

* [Next.js 13+ (App Router)](https://nextjs.org/)
* [React](https://react.dev/)
* [Tailwind CSS](https://tailwindcss.com/) – UI 스타일링

---

## 📂 폴더 구조 (예시)

```
.
├── app/
│   ├── components/
│   │   └── Header.js        # 상단 카테고리 선택 헤더
│   │── CarConfigurator.js   # 자동차 구성 메인 컴포넌트
│   │── layout.js            # 레이아웃
│   │── globals.css          # global Css
│   └── page.js              # 메인 페이지(호출)
├── public/
│   └── data/
│       └── 승용.json        # 자동차 데이터(JSON 예시)
├── package.json
└── README.md
```

---

## 🚀 실행 방법

### 1. 저장소 클론 & 패키지 설치

```bash
git clone https://github.com/kuzri/mini.git
cd mini
npm install
```

### 2. 개발 서버 실행

```bash
npm run dev
```

* 기본 실행 주소: [http://localhost:3000](http://localhost:3000)

---

## 📑 JSON 데이터 구조

자동차 데이터는 `/public/data/승용.json` 안에 정의합니다.

예시 (`승용.json`):

```json
{
  "K5": {
    "가솔린 2.0": {
      "프레스티지": {
        "가격": 2769,
        "옵션": {
          "선루프": { "value": 40 },
          "스마트 크루즈 컨트롤": { "value": true },
          "HUD": { "value": 15, "requires": ["스마트 크루즈 컨트롤"] }
        }
      }
    }
  }
}
```

* **가격**: 단위는 만 원 (코드에서 원으로 변환)
* **옵션**

  * `"value": true` → 기본 포함
  * `"value": false` → 선택 불가
  * `"value": 숫자` → 선택 시 추가 금액(만 원)
  * `"requires": ["옵션A"]` → 의존성 옵션 필요

---

## 📷 화면 예시

### 단계별 진행 표시

* 카테고리 → 모델 → 파워트레인 → 트림 → 옵션 진행 상황 표시

### 요약 카드

* 선택된 트림 + 옵션 수 + 총 가격 표시

### 옵션 선택

* 기본 포함 옵션은 체크 불가 & 초록색 강조
* 조건부 옵션 선택 시 의존성 경고 메시지 표시

### JSON 입력/출력

* JSON 데이터 직접 수정 후 실시간 반영 가능
* 최종 구성 결과 JSON 자동 출력

---

## ✅ 향후 개선 아이디어

* 옵션 그룹별 UI 구분 (예: 안전, 편의, 멀티미디어)
* Firestore 같은 DB 연동 → 사용자 구성 저장
* 차량 이미지 연동
* 반응형 UX 강화 (모바일 전용 최적화)

---
