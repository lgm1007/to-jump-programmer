"""앱 아이콘 · 스플래시 · 파비콘 이미지를 생성한다.

    python3 -m venv .venv && .venv/bin/pip install pillow
    .venv/bin/python scripts/generate-icons.py

디자인: 파란→보라 그라데이션 위에 흰색 "위로 점프" 화살표와 계단 3칸.
"""
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "images"
WEB_OUT = ROOT / "public" / "icons"  # 웹(PWA) 설치 아이콘 — public/ 은 웹 빌드에 그대로 복사된다
SS = 4  # 안티에일리어싱용 슈퍼샘플링 배율

TOP_LEFT = (49, 130, 246)  # #3182F6
BOTTOM_RIGHT = (108, 92, 255)  # #6C5CFF
WHITE = (255, 255, 255, 255)


def gradient(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size))
    px = img.load()
    for y in range(size):
        for x in range(size):
            t = (x + y) / (2 * (size - 1))
            px[x, y] = tuple(int(a + (b - a) * t) for a, b in zip(TOP_LEFT, BOTTOM_RIGHT)) + (255,)
    return img


def draw_mark(draw: ImageDraw.ImageDraw, size: int, scale: float = 1.0, color=WHITE) -> None:
    """size 크기 캔버스 중앙에 '계단을 오르다 위로 점프하는 화살표'를 그린다 (scale=1 이 아이콘 기준)."""
    s = size / 1024 * scale
    dx, dy = -28, -2  # 시각적 중앙 보정

    def p(x: float, y: float) -> tuple[float, float]:
        return (size / 2 + (x + dx - 512) * s, size / 2 + (y + dy - 512) * s)

    w = int(96 * s)
    r = w / 2

    def dot(x: float, y: float) -> None:
        cx, cy = p(x, y)
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=color)

    # 계단 3칸 + 마지막 칸에서 위로 솟는 화살표 (하나의 이어진 선)
    path = [(200, 800), (380, 800), (380, 640), (560, 640), (560, 480), (740, 480), (740, 240)]
    draw.line([p(x, y) for x, y in path], fill=color, width=w, joint="curve")
    dot(*path[0])
    # 화살촉
    tip = (740, 230)
    for side in ((600, 370), (880, 370)):
        draw.line([p(*side), p(*tip)], fill=color, width=w)
        dot(*side)
    dot(*tip)


def render(size: int, background: bool, mark_scale: float = 1.0, rounded: float = 0.0, mark_color=WHITE) -> Image.Image:
    big = size * SS
    if background:
        base = gradient(256).resize((big, big), Image.BICUBIC)
    else:
        base = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    draw_mark(ImageDraw.Draw(base), big, mark_scale, mark_color)
    if rounded > 0:
        mask = Image.new("L", (big, big), 0)
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, big - 1, big - 1], radius=int(big * rounded), fill=255)
        base.putalpha(mask)
    return base.resize((size, size), Image.LANCZOS)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    # iOS / 기본 아이콘: 투명 영역 없는 정사각형 (iOS 가 모서리를 자동으로 둥글게 처리)
    render(1024, background=True, mark_scale=0.82).convert("RGB").save(OUT / "icon.png")
    # Android 적응형 아이콘: 전경은 안전 영역(가운데 66%) 안에 들어가도록 축소
    render(1024, background=False, mark_scale=0.62).save(OUT / "android-icon-foreground.png")
    gradient(256).resize((1024, 1024), Image.BICUBIC).convert("RGB").save(OUT / "android-icon-background.png")
    render(1024, background=False, mark_scale=0.62).save(OUT / "android-icon-monochrome.png")
    # 스플래시: 둥근 사각형 아이콘
    render(512, background=True, rounded=0.225, mark_scale=0.8).save(OUT / "splash-icon.png")
    # 파비콘
    render(64, background=True, rounded=0.225, mark_scale=0.84).save(OUT / "favicon.png")
    # 웹(PWA): 일반 아이콘은 둥근 사각형, 마스커블은 꽉 찬 배경 + 안전 영역(가운데 80%) 안의 마크
    WEB_OUT.mkdir(parents=True, exist_ok=True)
    for size in (192, 512):
        render(size, background=True, rounded=0.225, mark_scale=0.8).save(WEB_OUT / f"icon-{size}.png")
        render(size, background=True, mark_scale=0.62).convert("RGB").save(WEB_OUT / f"maskable-{size}.png")
    # iOS 홈 화면 아이콘: 투명 영역 없이 (iOS 가 모서리를 둥글게 처리)
    render(180, background=True, mark_scale=0.82).convert("RGB").save(WEB_OUT / "apple-touch-icon.png")
    print("아이콘 생성 완료:", ", ".join(sorted(p.name for p in [*OUT.glob("*.png"), *WEB_OUT.glob("*.png")])))


if __name__ == "__main__":
    main()
