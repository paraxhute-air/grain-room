# 🎞 Grain Room | Grain Studio

**Grain Room**은 웹 브라우저에서 바로 사용할 수 있는 감성적인 이미지 편집 도구입니다. 복잡한 설치 없이 간단한 드래그 앤 드롭만으로 필름 카메라의 고유한 질감과 색감을 재현할 수 있습니다.

![Project Screenshot](./screenshot.png) <!-- 스크린샷 캡쳐 후 추가 권장 -->

---

## 💡 기획 의도
디지털 사진의 선명함보다는 아날로그 필름 사진이 주는 따뜻함과 그리움을 웹 환경에서 손쉽게 구현하고자 했습니다. 단순히 필터만 씌우는 것이 아니라, **실제 필름의 그레인(Grain) 입자감**, **빛샘 효과**, **날짜 스탬프** 등을 통해 사용자가 자신의 사진에 특별한 감성을 더할 수 있도록 설계했습니다.

## ✨ 주요 특징 (Key Features)

### 1. 강력한 그레인 엔진 (Grain Engine)
- **실시간 렌더링**: Canvas API를 활용하여 모든 효과가 실시간으로 적용됩니다.
- **정교한 조절**: 그레인의 강도(Intensity)와 크기(Size)를 미세하게 조절할 수 있습니다.
- **블렌드 모드**: Overlay, Multiply, Screen 등 다양한 합성 모드를 지원하여 이미지 분위기에 맞는 질감을 표현합니다.

### 2. 필름 감성 색감 보정 (Color Grading)
- **기본 보정**: 밝기, 대비, 채도, 색온도 조절.
- **특수 효과**:
  - **Sepia & Fade**: 빈티지한 느낌과 물빠진 색감을 표현.
  - **Vignette**: 가장자리를 어둡게 하여 피사체에 시선을 집중.
- **CMYK 토닝**: 시안(Cyan), 마젠타(Magenta), 옐로우(Yellow), 키(Key) 값을 개별 조절하여 독특한 색감 연출 가능.

### 3. 다양한 프리셋 (Presets)
- **9종의 감성 프리셋**: Film 35mm, Vintage, Noir, Cinematic, Tokyo 등 클릭 한 번으로 완성도 높은 분위기를 연출합니다.

### 4. 텍스트 & 날짜 스탬프 (Overlay)
- **날짜 스탬프**: 
  - 위치(상하좌우), 방향(가로/세로), 색상 커스터마이징 가능.
  - 레트로 디지털 숫자의 느낌을 살린 폰트 적용.
- **노트(Note) 기능**: 
  - 사진에 짧은 메모나 감성 문구를 추가할 수 있습니다.
  - **인터랙티브 에디팅**: 텍스트 박스를 드래그하여 자유롭게 위치를 이동하고, 핸들을 통해 크기를 조절할 수 있습니다.
  - 다양한 폰트(나눔명조, 나눔손글씨 펜 등)와 스타일(라벨, 그림자 등) 지원.

### 5. 프레임 & 레이아웃 (Frame)
- **액자 효과**: 화이트, 블랙, 종이 질감(Paper) 등의 프레임을 씌워 사진을 완성도 있게 마무리합니다.
- **여백 조절**: 프레임의 여백(Margin)을 소/중/대 크기로 조절 가능.

### 6. 사용자 편의 기능 (UX)
- **드래그 앤 드롭**: 파일 탐색기 없이 이미지를 직관적으로 불러옵니다.
- **갤러리 관리**: 여러 장의 이미지를 동시에 불러와 작업할 수 있으며, 썸네일 스트립에서 쉽게 전환 가능합니다.
- **실행 취소/복구 (Undo/Redo)**: 편집 이력을 관리하여 언제든 이전 상태로 되돌릴 수 있습니다.
- **자르기 (Crop)**: 자유 비율, 1:1, 16:9, 원형 등 다양한 비율로 이미지를 잘라낼 수 있습니다.
- **다운로드 옵션**: JPG/PNG 포맷 선택 및 화질 설정이 가능합니다.

## 🛠 기술 스택 (Tech Stack)
- **Frontend**: Vanila JavaScript (ES6+), HTML5 Canvas API, CSS3 (CSS Variables 활용)
- **Style**: Modern CSS (Flexbox, Grid), Responsive Design (Mobile-friendly Layout)
- **Bundler/Tooling**: 별도 빌드 도구 없이 `npx live-server` 등으로 즉시 실행 가능한 구조.

## 🚀 시작하기 (Getting Started)

### 로컬 실행
이 프로젝트는 별도의 복잡한 의존성 설치가 필요하지 않습니다.

1. 저장소를 클론합니다.
   ```bash
   git clone https://github.com/your-repo/grain-room.git
   ```
2. 프로젝트 폴더로 이동합니다.
   ```bash
   cd grain-room
   ```
3. 로컬 서버를 실행합니다. (Live Server 권장)
   ```bash
   npx live-server .
   ```
   또는 `index.html` 파일을 브라우저에서 직접 열어도 작동합니다.

## 📝 라이센스
This project is open-source and free to use.

---
_Designed & Developed by [Your Name]_
