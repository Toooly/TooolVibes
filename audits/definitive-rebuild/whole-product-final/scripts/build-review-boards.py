from pathlib import Path
from shutil import copy2

from PIL import Image, ImageDraw, ImageFont


ROOT = Path.cwd() / "audits/definitive-rebuild/whole-product-final"
RAW = ROOT / "final/raw"
STATES = ROOT / "after/states"
PRODUCTION = ROOT / "final/production"
BOARDS = ROOT / "final/boards"
AFTER_DESKTOP = ROOT / "after/desktop"
AFTER_MOBILE = ROOT / "after/mobile"
BOARDS.mkdir(parents=True, exist_ok=True)
AFTER_DESKTOP.mkdir(parents=True, exist_ok=True)
AFTER_MOBILE.mkdir(parents=True, exist_ok=True)

BG = "#08090d"
PANEL = "#11131a"
LINE = "#313542"
INK = "#f5f0e8"
MUTED = "#a8afc0"
ACCENT = "#7a45ff"


def load_font(size: int, bold: bool = False):
    names = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
        if bold
        else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Supplemental/Helvetica.ttc",
    ]
    for name in names:
        try:
            return ImageFont.truetype(name, size=size)
        except OSError:
            continue
    return ImageFont.load_default()


TITLE = load_font(48, True)
LABEL = load_font(25, True)
SMALL = load_font(20)


def open_rgb(path: Path) -> Image.Image:
    return Image.open(path).convert("RGB")


def contain(image: Image.Image, width: int, height: int) -> Image.Image:
    copy = image.copy()
    copy.thumbnail((width, height), Image.Resampling.LANCZOS)
    return copy


def paste_panel(
    canvas: Image.Image,
    image: Image.Image,
    box: tuple[int, int, int, int],
    label: str,
):
    draw = ImageDraw.Draw(canvas)
    x, y, width, height = box
    draw.rounded_rectangle(
        (x, y, x + width, y + height),
        radius=24,
        fill=PANEL,
        outline=LINE,
        width=2,
    )
    draw.text((x + 20, y + 16), label, font=LABEL, fill=INK)
    content_y = y + 62
    fitted = contain(image, width - 24, height - 78)
    px = x + (width - fitted.width) // 2
    py = content_y + (height - 78 - fitted.height) // 2
    canvas.paste(fitted, (px, py))


def pair_board(filename: str, title: str, route_id: str):
    canvas = Image.new("RGB", (2400, 1500), BG)
    draw = ImageDraw.Draw(canvas)
    draw.text((56, 44), title, font=TITLE, fill=INK)
    draw.rectangle((56, 112, 2344, 116), fill=ACCENT)
    desktop = open_rgb(RAW / "1440" / f"{route_id}.png")
    mobile = open_rgb(RAW / "390" / f"{route_id}.png")
    paste_panel(canvas, desktop, (56, 150, 1720, 1288), "DESKTOP · 1440")
    paste_panel(canvas, mobile, (1820, 150, 524, 1288), "MOBILE · 390")
    canvas.save(BOARDS / filename, quality=94)


pair_board("01-global-shell.png", "GLOBAL SHELL — COMMAND BAR / MOBILE CHROME", "home")
pair_board("02-home.png", "HOME — DECISION-FIRST DISCOVERY", "home")
pair_board("03-archive.png", "ARCHIVE — EDITORIAL CATALOG", "archive")
pair_board("04-tool-detail.png", "TOOL DETAIL — BLINK DECISION DESK", "tool-detail")
pair_board("05-radar.png", "RADAR — HONEST PRODUCT HUNT STATE", "radar")
pair_board("06-compare.png", "COMPARE — DECISION WORKSPACE", "compare")
pair_board("07-saved.png", "SAVED — PERSISTENT LIBRARY", "saved")
pair_board("08-collections.png", "COLLECTIONS — EDITORIAL PATHS", "collections")
pair_board("11-collection-detail.png", "COLLECTION DETAIL — ORDERED DECISION PATH", "collection-detail")
pair_board("12-account.png", "ACCOUNT — PRIVATE WORKSPACE ACCESS", "account")


primary_routes = [
    ("account", "account"),
    ("archive", "archive"),
    ("collection detail", "collection-detail"),
    ("collections", "collections"),
    ("compare", "compare"),
    ("home", "home"),
    ("radar", "radar"),
    ("saved", "saved"),
    ("tool detail", "tool-detail"),
]


def primary_grid_board(filename: str, width: int, crop_height: int):
    canvas = Image.new("RGB", (1080, 1680), BG)
    draw = ImageDraw.Draw(canvas)
    for index, (label, route_id) in enumerate(primary_routes):
        row, column = divmod(index, 3)
        x = 8 + column * 360
        y = 8 + row * 556
        draw.text((x, y), label, font=SMALL, fill=INK)
        image = open_rgb(RAW / str(width) / f"{route_id}.png")
        image = image.crop((0, 0, image.width, min(image.height, crop_height)))
        fitted = contain(image, 344, 510)
        px = x + (344 - fitted.width) // 2
        canvas.paste(fitted, (px, y + 34))
    canvas.save(ROOT / "after" / filename, quality=94)


for _, route_id in primary_routes:
    copy2(RAW / "1440" / f"{route_id}.png", AFTER_DESKTOP / f"{route_id}.png")
    copy2(RAW / "390" / f"{route_id}.png", AFTER_MOBILE / f"{route_id}.png")

primary_grid_board("primary-desktop-board.png", 1440, 960)
primary_grid_board("primary-mobile-board.png", 390, 844)


def production_grid_board(filename: str, viewport: str):
    canvas = Image.new("RGB", (2400, 1900), BG)
    draw = ImageDraw.Draw(canvas)
    draw.text(
        (56, 42),
        f"LIVE PRODUCTION — {viewport.upper()} · 2026-07-26",
        font=TITLE,
        fill=INK,
    )
    draw.rectangle((56, 112, 2344, 116), fill=ACCENT)
    for index, (label, route_id) in enumerate(primary_routes):
        row, column = divmod(index, 3)
        x = 56 + column * 780
        y = 150 + row * 570
        image = open_rgb(PRODUCTION / viewport / f"{route_id}.png")
        paste_panel(canvas, image, (x, y, 730, 520), label)
    canvas.save(BOARDS / filename, quality=94)


if PRODUCTION.exists():
    production_grid_board("13-production-desktop.png", "desktop")
    production_grid_board("14-production-mobile.png", "mobile")


widths = [
    360,
    390,
    430,
    768,
    820,
    912,
    1024,
    1180,
    1279,
    1280,
    1366,
    1440,
    1536,
    1920,
]
responsive = Image.new("RGB", (2500, 2050), BG)
draw = ImageDraw.Draw(responsive)
draw.text((56, 42), "RESPONSIVE CONTACT SHEET — ALL REQUIRED WIDTHS", font=TITLE, fill=INK)
draw.rectangle((56, 112, 2444, 116), fill=ACCENT)
cell_w, cell_h = 575, 430
for index, width in enumerate(widths):
    row, column = divmod(index, 4)
    x = 56 + column * 605
    y = 150 + row * 458
    image = open_rgb(RAW / str(width) / "home.png")
    paste_panel(responsive, image, (x, y, cell_w, cell_h), f"{width}px")
responsive.save(BOARDS / "09-responsive-contact-sheet.png", quality=94)


states = Image.new("RGB", (3000, 2100), BG)
draw = ImageDraw.Draw(states)
draw.text((56, 42), "FIXED SURFACES & INTERACTION STATES", font=TITLE, fill=INK)
draw.rectangle((56, 112, 2944, 116), fill=ACCENT)

desktop_search = open_rgb(STATES / "search-desktop.png")
desktop_compare = open_rgb(STATES / "compare-five-desktop.png")
if desktop_compare.height > 900:
    desktop_compare = desktop_compare.crop((0, 0, desktop_compare.width, 900))

paste_panel(states, desktop_search, (56, 150, 1370, 880), "SEARCH · DESKTOP")
paste_panel(states, desktop_compare, (56, 1065, 1370, 880), "COMPARE 5/5 · DESKTOP")

mobile_states = [
    ("SEARCH · MOBILE", "search-mobile.png"),
    ("COMPARE 1/5", "compare-one-mobile.png"),
    ("COMPARE 5/5", "compare-five-mobile.png"),
    ("SAVED · POPULATED", "saved-populated-mobile.png"),
]
for index, (label, filename) in enumerate(mobile_states):
    row, column = divmod(index, 2)
    image = open_rgb(STATES / filename)
    if image.height > 844:
        image = image.crop((0, 0, image.width, 844))
    x = 1480 + column * 740
    y = 150 + row * 930
    paste_panel(states, image, (x, y, 680, 880), label)

draw.text(
    (56, 2010),
    "Production Playwright captures · 390px mobile / 1440px desktop",
    font=SMALL,
    fill=MUTED,
)
states.save(BOARDS / "10-fixed-surfaces-and-states.png", quality=94)

print(f"Generated {len(list(BOARDS.glob('*.png')))} review boards in {BOARDS}")
