# Grain Room 작업 규칙

## 모바일 기준 기기
- 모바일 UI 작업과 확인은 **iPhone 15 Pro** 기준으로 한다.
  - 화면 393×852, Safari 보이는 영역 393×659, 기기 픽셀 비율 3.
- Playwright로 확인할 때는 `devices['iPhone 15 Pro']` 프리셋을 쓴다.
  - 이 프리셋의 기본 브라우저는 WebKit이지만, 이 환경에는 Chromium만 설치돼 있다. 그래서 `chromium.launch()`로 띄우고 컨텍스트에 `devices['iPhone 15 Pro']`를 넘긴다.
- 높이, 여백, 가림 비율 같은 수치를 보고할 때도 이 기기를 기준으로 한다.
