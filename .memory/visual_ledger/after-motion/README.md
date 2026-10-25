# After Motion v3 — 2026-10-25

Ảnh chụp từ `scripts/verify.sh` (Chromium CDP) và `scripts/motion-audit.mjs`, viewport 320/390/768/1280, DPR 1, không overflow.

| Tệp | Nội dung |
|---|---|
| `hero-1280-150ms.png` | Hero ở ~150ms: phiếu bắt đầu hiện, grid đang quét, pen ellipse đang vẽ |
| `hero-1280-450ms.png` | Hero ~450ms: line/grid gần xong, CTA/lede đã hiện |
| `hero-1280-1050ms.png` | Hero sau settle: pen 2 nét, grid 100 ô, rail 20 ngày đầy đủ |
| `landing-1280.png`, `landing-390.png`, `landing-320.png`, `landing-768.png` | Landing trạng thái cuối, 4 viewport |
| `404-390.png` | 404 có nét bút đỏ gạch “404”; không overflow |
| `app-390.png` | App route cuối của audit (`#/exam-setup`) |
| `landing-1280-cta.png` | CTA cuối sau khi cuộn (reveal đã chạy) |

Ảnh tĩnh **không chứng minh motion**; bằng chứng động là log `motion-audit` (46/46) gồm:
- reduce: `getAnimations()` running = 0, hero/reveal hiện;
- fast scroll + resize 320/768/1440: mọi `[data-reveal]` settle;
- app: câu mới enter 180ms, pick không replay, feedback 0→1, bar scaleX, sheet 200ms;
- block GSAP: nội dung vẫn hiện; negative control không có entrance.

Lighthouse local 3 run (sau Motion v3): Perf 0.98, A11y/BP/SEO 1, LCP median 2,375ms, TBT 20ms, CLS 0.
