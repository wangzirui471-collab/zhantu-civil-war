"""Pack the Natural Earth shapes and Mapzen Terrarium tiles into an offline browser atlas."""

import argparse
import base64
import functools
import json
import math
import struct
import zipfile
import zlib
from pathlib import Path


def shapefile(archive):
    with zipfile.ZipFile(archive) as source:
        shapes = source.read(next(name for name in source.namelist() if name.endswith(".shp")))
        attrs = source.read(next(name for name in source.namelist() if name.endswith(".dbf")))
    rows, header, stride = struct.unpack_from("<IHH", attrs, 4)
    fields = []
    offset = 1
    for i in range(32, header - 1, 32):
        key = attrs[i:i + 11].split(b"\x00")[0].decode("ascii")
        length = attrs[i + 16]
        fields.append((key.lower(), offset, length))
        offset += length
    cursor = 100
    for row in range(rows):
        _, size = struct.unpack_from(">II", shapes, cursor)
        record = memoryview(shapes)[cursor + 8:cursor + 8 + size * 2]
        cursor += 8 + size * 2
        if struct.unpack_from("<I", record)[0] not in (5, 15, 25):
            continue
        start = header + row * stride
        properties = {
            key: attrs[start + offset:start + offset + length].split(b"\x00", 1)[0].decode("utf-8", "replace").strip()
            for key, offset, length in fields
        }
        yield properties, record


def simplify(points, tolerance):
    if len(points) < 4:
        return points
    first, last = points[0], points[-1]
    dx, dy = last[0] - first[0], last[1] - first[1]
    length = dx * dx + dy * dy
    maximum, index = 0, None
    for i, (x, y) in enumerate(points[1:-1], 1):
        dot = ((x - first[0]) * dx + (y - first[1]) * dy) / length if length else 0
        scale = max(0, min(1, dot))
        gap = (x - first[0] - dx * scale) ** 2 + (y - first[1] - dy * scale) ** 2
        if gap > maximum:
            maximum, index = gap, i
    if index is None or maximum <= tolerance * tolerance:
        return [first, last]
    return simplify(points[:index + 1], tolerance)[:-1] + simplify(points[index:], tolerance)


def rings(record, tolerance):
    parts, count = struct.unpack_from("<II", record, 36)
    positions = [struct.unpack_from("<I", record, 44 + index * 4)[0] for index in range(parts)] + [count]
    offset = 44 + parts * 4
    for a, b in zip(positions, positions[1:]):
        raw = [struct.unpack_from("<dd", record, offset + i * 16) for i in range(a, b)]
        if not raw or min(p[0] for p in raw) > 146 or max(p[0] for p in raw) < 64:
            continue
        if min(p[1] for p in raw) > 56 or max(p[1] for p in raw) < 12:
            continue
        line = simplify(raw, tolerance)
        if len(line) >= 4:
            yield [[round(x, 4), round(y, 4)] for x, y in line]


def label_position(polygons):
    main = max(polygons, key=lambda p: abs(sum(x * ny - y * nx for (x, y), (nx, ny) in zip(p, p[1:]))))
    weight = sum(x * ny - y * nx for (x, y), (nx, ny) in zip(main, main[1:]))
    if abs(weight) < 1e-9:
        return [sum(point[i] for point in main) / len(main) for i in (0, 1)]
    return [round(sum((a[i] + b[i]) * (a[0] * b[1] - a[1] * b[0])
                      for a, b in zip(main, main[1:])) / (3 * weight), 4) for i in (0, 1)]


def paeth(left, above, corner):
    estimate = left + above - corner
    p, q, r = abs(estimate - left), abs(estimate - above), abs(estimate - corner)
    return left if p <= q and p <= r else above if q <= r else corner


@functools.lru_cache(maxsize=96)
def read_tile(path):
    raw = path.read_bytes()
    width, height, depth, color, _, _, interlaced = struct.unpack_from(">IIBBBBB", raw, 16)
    if (width, height, depth, color, interlaced) != (256, 256, 8, 2, 0):
        raise ValueError(f"Unsupported Terrarium PNG. {path}")
    offset = 8
    blocks = []
    while offset < len(raw):
        size, kind = struct.unpack_from(">I4s", raw, offset)
        if kind == b"IDAT":
            blocks.append(raw[offset + 8:offset + 8 + size])
        offset += size + 12
    scanlines = zlib.decompress(b"".join(blocks))
    previous = bytearray(768)
    points = []
    for row in range(256):
        start = row * 769
        kind = scanlines[start]
        current = bytearray(scanlines[start + 1:start + 769])
        if kind == 1:
            for i in range(3, 768):
                current[i] = (current[i] + current[i - 3]) & 255
        elif kind == 2:
            current = bytearray((a + b) & 255 for a, b in zip(current, previous))
        elif kind in (3, 4):
            for i in range(768):
                left = current[i - 3] if i >= 3 else 0
                if kind == 3:
                    prediction = (left + previous[i]) // 2
                else:
                    prediction = paeth(left, previous[i], previous[i - 3] if i >= 3 else 0)
                current[i] = (current[i] + prediction) & 255
        points.append([current[i] * 256 + current[i + 1] + (current[i + 2] >= 128) - 32768
                       for i in range(0, 768, 3)])
        previous = current
    return points


def elevation(cache, bounds, step, zoom):
    west, south, east, north = bounds
    size = 2 ** zoom * 256
    width = round((east - west) / step) + 1
    height = round((north - south) / step) + 1
    cols = [divmod(round((west + col * step + 180) / 360 * size), 256) for col in range(width)]
    lats = [north - row * step for row in range(height)]
    ys = [divmod(round((1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * size), 256) for lat in lats]
    meters = []
    for tile_y, pixel_y in ys:
        for tile_x, pixel_x in cols:
            tile = read_tile(cache / f"dem-{zoom}-{tile_x}-{tile_y}.png")
            meters.append(tile[pixel_y][pixel_x])
    return {"west": west, "north": north, "step": step, "width": width, "height": height,
            "samples": base64.b64encode(struct.pack(f"<{len(meters)}h", *meters)).decode("ascii")}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("cache", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    cache = args.cache
    land = [path for _, record in shapefile(cache / "land.zip") for path in rings(record, .032)]
    boundary = [path for attr, record in shapefile(cache / "countries.zip")
                if attr["adm0_a3"] in ("CHN", "TWN", "HKG", "MAC") for path in rings(record, .024)]
    provinces = []
    for attr, record in shapefile(cache / "admin1.zip"):
        if attr["iso_a2"] not in ("CN", "TW"):
            continue
        names = {"TWN": "台湾", "Hong Kong": "香港", "Macau": "澳门"}
        name = attr.get("name_zh") or names.get(attr["name"], "")
        polygons = list(rings(record, .045))
        if name and polygons:
            if attr["iso_a2"] == "TW":
                name = ""
            provinces.append({"name": name, "label": label_position(polygons), "rings": polygons})
    grids = [
        elevation(cache, [67, 15, 143, 55], .1, 5),
        elevation(cache, [116, 37.5, 132, 49], .05, 6),
        elevation(cache, [114, 31, 121, 37], .034, 7),
    ]
    output = {"land": land, "boundary": boundary, "provinces": provinces, "grids": grids,
              "sources": [
                  {"title": "地形高程 · Mapzen Terrain Tiles", "url": "https://registry.opendata.aws/terrain-tiles/"},
                  {"title": "各高程来源与署名", "url": "https://github.com/tilezen/joerd/blob/master/docs/attribution.md"},
                  {"title": "海岸和现代参照省界 · Natural Earth", "url": "https://www.naturalearthdata.com/downloads/10m-cultural-vectors/"},
              ]}
    args.output.write_text("globalThis.CivilWarGeography=" + json.dumps(output, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    print(f"{len(land)} land rings, {len(provinces)} province features, {len(grids)} elevation grids")


if __name__ == "__main__":
    main()
