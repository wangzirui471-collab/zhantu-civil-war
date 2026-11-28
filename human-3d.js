(() => {
  'use strict';

  // 严格按统帅需求设定大地图兵力与重装备三维图标比例：
  // 步兵 5,000 人 = 1 个三维兵人；坦克 5 辆 = 1 个坦克图标；飞机 3 架 = 1 个飞机图标；军舰 1 艘 = 1 艘军舰图标
  const PEOPLE_PER_ICON = 5_000;
  const TANKS_PER_ICON = 5;
  const ARTILLERY_PER_ICON = 12;
  const PLANES_PER_ICON = 3;
  const SHIPS_PER_ICON = 1;

  // ==================== 阵营与派系材质色板 ====================
  const MAT = {
    ccpTunic:    [0.58, 0.48, 0.28, 0.03, 0.82], // 解放军小米黄/草黄四兜军装
    ccpTrim:     [0.66, 0.57, 0.37, 0.03, 0.78],
    ccpWinter:   [0.53, 0.46, 0.30, 0.04, 0.84], // 东北野战军绗缝厚棉衣
    ccpFur:      [0.44, 0.33, 0.21, 0.05, 0.88], // 栽绒狗皮帽耳
    ccpPuttee:   [0.49, 0.42, 0.25, 0.03, 0.86], // 螺旋绑腿
    ccpRation:   [0.86, 0.83, 0.74, 0.02, 0.86], // 斜挎白帆布米袋/羊肚巾
    ccpShoeGrn:  [0.23, 0.33, 0.19, 0.04, 0.82], // 解放鞋绿帆布面
    ccpStarRed:  [0.88, 0.14, 0.11, 0.18, 0.40], // 红五角星/红领章

    rocCentral:  [0.33, 0.40, 0.39, 0.05, 0.76], // 国军中央军青灰中正装（胡宗南等）
    rocKhaki:    [0.49, 0.45, 0.29, 0.05, 0.78], // 国军卡其黄军服（粤军/滇军等）
    rocUSJacket: [0.31, 0.37, 0.23, 0.06, 0.75], // 国军美械橄榄绿野战服
    rocGuiGreen: [0.35, 0.42, 0.28, 0.05, 0.78], // 桂军草绿夏季野战军服
    rocChuanGry: [0.40, 0.43, 0.44, 0.04, 0.82], // 川军灰蓝单布国军服
    rocJinWool:  [0.30, 0.34, 0.36, 0.05, 0.80], // 晋绥/绥远深灰呢冬装
    rocMaWool:   [0.37, 0.39, 0.34, 0.05, 0.78], // 西北二马青灰呢骑兵军服
    sheepFleece: [0.88, 0.85, 0.77, 0.03, 0.90], // 西北羊皮领/白毛边
    tibetMaroon: [0.46, 0.20, 0.18, 0.04, 0.84], // 噶厦藏军暗绛氆氇镶边军装
    bambooHat:   [0.67, 0.56, 0.34, 0.04, 0.84], // 川军背负竹编斗笠

    rocWebbing:  [0.56, 0.52, 0.35, 0.05, 0.80],
    rocHelmM35:  [0.24, 0.29, 0.27, 0.38, 0.44], // 德式 M35 钢盔
    rocHelmM1:   [0.27, 0.33, 0.21, 0.24, 0.56], // 美式 M1 钢盔
    rocAdrian:   [0.28, 0.34, 0.30, 0.42, 0.42], // 滇军法式亚德里安带脊钢盔
    rocBlue:     [0.10, 0.28, 0.70, 0.16, 0.46], // 青天白日蓝底
    rocSunWhite: [0.96, 0.97, 0.99, 0.12, 0.36], // 青天白日白芒

    // 二战 & 朝鲜战争各国专属单兵军服与钢盔 PBR 材质
    usaOlive:    [0.36, 0.40, 0.26, 0.06, 0.84], // 美军橄榄褐野战服
    usaPants:    [0.48, 0.44, 0.30, 0.05, 0.86], // 美军浅卡其裤与绑腿
    ussrKhaki:   [0.49, 0.46, 0.31, 0.06, 0.86], // 苏联红军卡其套头衫
    ussrHelm:    [0.24, 0.32, 0.21, 0.34, 0.48], // 苏军 SSh-40 军绿钢盔
    ukBrown:     [0.44, 0.35, 0.23, 0.06, 0.88], // 英军棕褐毛呢野战服
    ukBrodie:    [0.32, 0.31, 0.21, 0.34, 0.48], // 英军飞碟型布罗迪钢盔
    fraKhaki:    [0.38, 0.41, 0.27, 0.06, 0.86], // 法军卡其绿军大衣
    fraAdrian:   [0.30, 0.34, 0.24, 0.40, 0.44], // 法军 M26 亚德里安带脊钢盔
    jpnKhaki:    [0.54, 0.46, 0.27, 0.06, 0.86], // 日军昭五/九八式土黄军服
    jpnHelm:     [0.42, 0.37, 0.22, 0.30, 0.52], // 日军九〇式钢盔
    gerFeldgrau: [0.33, 0.38, 0.35, 0.07, 0.84], // 德军原野灰野战服
    gerHelm:     [0.21, 0.25, 0.24, 0.42, 0.42], // 德军 M35 护颈钢盔
    pvaCotton:   [0.52, 0.45, 0.28, 0.04, 0.90], // 志愿军土黄棉军服
    kpaKhaki:    [0.46, 0.42, 0.27, 0.06, 0.86], // 朝鲜人民军土黄军服

    skin:        [0.80, 0.61, 0.47, 0.04, 0.68],
    skinShade:   [0.69, 0.49, 0.36, 0.04, 0.72],
    lip:         [0.66, 0.40, 0.34, 0.06, 0.62],
    hairDark:    [0.11, 0.10, 0.09, 0.08, 0.75],
    eyeWhite:    [0.95, 0.95, 0.93, 0.10, 0.25],

    armorGrn:    [0.29, 0.35, 0.24, 0.30, 0.50],
    armorSov:    [0.31, 0.38, 0.22, 0.28, 0.50],
    armorDark:   [0.18, 0.21, 0.18, 0.38, 0.45],
    armorSand:   [0.48, 0.45, 0.33, 0.22, 0.58],
    gunmetal:    [0.17, 0.19, 0.22, 0.82, 0.26],
    bluedSteel:  [0.11, 0.13, 0.16, 0.86, 0.22],
    brightStl:   [0.68, 0.71, 0.75, 0.90, 0.18],

    navalGrey:   [0.48, 0.53, 0.57, 0.36, 0.44], // 舰体标准海灰涂装
    navalLight:  [0.62, 0.66, 0.69, 0.30, 0.48], // 上层建筑浅海灰
    hullRed:     [0.54, 0.17, 0.14, 0.22, 0.58], // 舰底防锈氧化铁红
    deckTeak:    [0.44, 0.33, 0.21, 0.10, 0.68], // 柚木/防滑钢甲板
    deckDark:    [0.23, 0.26, 0.28, 0.22, 0.62], // 舰首锚甲板深灰
    blastBag:    [0.82, 0.80, 0.74, 0.04, 0.84], // 主炮防水帆布炮衣

    woodWalnut:  [0.40, 0.23, 0.11, 0.08, 0.60],
    woodLight:   [0.54, 0.37, 0.20, 0.06, 0.66],
    leather:     [0.33, 0.20, 0.10, 0.18, 0.50],
    leatherDark: [0.18, 0.12, 0.08, 0.22, 0.46],
    rubber:      [0.11, 0.11, 0.12, 0.05, 0.88],
    brass:       [0.80, 0.63, 0.24, 0.86, 0.22],
    canvasTent:  [0.55, 0.51, 0.38, 0.04, 0.86],
    blanketGrn:  [0.38, 0.43, 0.29, 0.03, 0.88],
    earthSoil:   [0.38, 0.28, 0.17, 0.02, 0.94],
    earthDark:   [0.27, 0.19, 0.12, 0.02, 0.95],
    sandbag:     [0.64, 0.58, 0.42, 0.03, 0.88],
    horseBay:    [0.43, 0.26, 0.14, 0.08, 0.62],
    horseMane:   [0.14, 0.10, 0.08, 0.06, 0.78],
    glass:       [0.36, 0.58, 0.66, 0.72, 0.14],
    flameCore:   [1.00, 0.90, 0.45, 0.00, 0.08],
    flameOuter:  [1.00, 0.48, 0.12, 0.00, 0.15],
    smokeGrey:   [0.60, 0.61, 0.59, 0.00, 0.92],
    waterFoam:   [0.86, 0.93, 0.96, 0.15, 0.32],
    standMat:    [0.24, 0.26, 0.27, 0.45, 0.45],
  };

  // ==================== 向量与双骨骼解析逆运动学 (IK) ====================
  const vSub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const vAdd = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const vScale = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
  const vDot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const vCross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const vLen = a => Math.hypot(a[0], a[1], a[2]);
  const vNorm = a => { const l = vLen(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };

  function solveIK(root, target, L1, L2, poleDir) {
    const diff = vSub(target, root);
    const rawDist = vLen(diff) || 1e-4;
    const maxReach = (L1 + L2) * 0.992;
    const minReach = Math.abs(L1 - L2) + 0.012;
    const d = Math.max(minReach, Math.min(maxReach, rawDist));
    const fwd = vScale(diff, 1 / rawDist);
    const wrist = rawDist > maxReach ? vAdd(root, vScale(fwd, maxReach)) : target;

    const cosA = Math.max(-1, Math.min(1, (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d)));
    const sinA = Math.sqrt(Math.max(0, 1 - cosA * cosA));
    let perp = vSub(poleDir, vScale(fwd, vDot(poleDir, fwd)));
    if (vLen(perp) < 1e-4) perp = Math.abs(fwd[0]) < 0.8 ? [1, 0, 0] : [0, 0, -1];
    perp = vNorm(perp);
    const elbow = vAdd(root, vAdd(vScale(fwd, L1 * cosA), vScale(perp, L1 * sinA)));
    return { elbow, wrist };
  }

  // ==================== 3D 网格构建器 ====================
  function createBuilder() {
    const out = []; // 11 floats/vert: pos(3), norm(3), col(3), mat(2)
    const chunks = [];
    let parts = 0;

    function rotPt(x, y, z, rx, ry, rz) {
      if (rx) { const c = Math.cos(rx), s = Math.sin(rx); const ny = y * c - z * s, nz = y * s + z * c; y = ny; z = nz; }
      if (ry) { const c = Math.cos(ry), s = Math.sin(ry); const nx = x * c + z * s, nz = -x * s + z * c; x = nx; z = nz; }
      if (rz) { const c = Math.cos(rz), s = Math.sin(rz); const nx = x * c - y * s, ny = x * s + y * c; x = nx; y = ny; }
      return [x, y, z];
    }

    function pushVert(p, n, mat) {
      out.push(p[0], p[1], p[2], n[0], n[1], n[2], mat[0], mat[1], mat[2], mat[3], mat[4]);
    }

    function pushTri(a, b, c, mat) {
      const n = vNorm(vCross(vSub(b, a), vSub(c, a)));
      pushVert(a, n, mat); pushVert(b, n, mat); pushVert(c, n, mat);
    }

    function box(cx, cy, cz, sx, sy, sz, mat, rx = 0, ry = 0, rz = 0) {
      parts++;
      const hx = sx * 0.5, hy = sy * 0.5, hz = sz * 0.5;
      const faces = [
        [[1,0,0],  [[hx,-hy,-hz],[hx,hy,-hz],[hx,hy,hz],[hx,-hy,hz]]],
        [[-1,0,0], [[-hx,-hy,hz],[-hx,hy,hz],[-hx,hy,-hz],[-hx,-hy,-hz]]],
        [[0,1,0],  [[-hx,hy,-hz],[-hx,hy,hz],[hx,hy,hz],[hx,hy,-hz]]],
        [[0,-1,0], [[-hx,-hy,hz],[-hx,-hy,-hz],[hx,-hy,-hz],[hx,-hy,hz]]],
        [[0,0,1],  [[-hx,-hy,hz],[hx,-hy,hz],[hx,hy,hz],[-hx,hy,hz]]],
        [[0,0,-1], [[hx,-hy,-hz],[-hx,-hy,-hz],[-hx,hy,-hz],[hx,hy,-hz]]],
      ];
      for (const [fn, quad] of faces) {
        const rn = rotPt(fn[0], fn[1], fn[2], rx, ry, rz);
        const pts = quad.map(q => {
          const r = rotPt(q[0], q[1], q[2], rx, ry, rz);
          return [r[0] + cx, r[1] + cy, r[2] + cz];
        });
        pushVert(pts[0], rn, mat); pushVert(pts[2], rn, mat); pushVert(pts[1], rn, mat);
        pushVert(pts[0], rn, mat); pushVert(pts[3], rn, mat); pushVert(pts[2], rn, mat);
      }
    }

    function cyl(x1, y1, z1, x2, y2, z2, r1, r2, mat, segs = 12, cap = true) {
      parts++;
      const dx = x2 - x1, dy = y2 - y1, dz = z2 - z1;
      const len = Math.hypot(dx, dy, dz);
      if (len < 1e-5) return;
      const ax = dx / len, ay = dy / len, az = dz / len;
      const ux = Math.abs(ay) < 0.9 ? 0 : 1, uy = Math.abs(ay) < 0.9 ? 1 : 0, uz = 0;
      let bx = ay * uz - az * uy, by = az * ux - ax * uz, bz = ax * uy - ay * ux;
      const bl = Math.hypot(bx, by, bz) || 1; bx /= bl; by /= bl; bz /= bl;
      const tx = by * az - bz * ay, ty = bz * ax - bx * az, tz = bx * ay - by * ax;
      const slope = (r1 - r2) / len;

      for (let i = 0; i < segs; i++) {
        const a0 = (i / segs) * Math.PI * 2, a1 = ((i + 1) / segs) * Math.PI * 2;
        const c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
        const N0 = vNorm([bx * c0 + tx * s0 + ax * slope, by * c0 + ty * s0 + ay * slope, bz * c0 + tz * s0 + az * slope]);
        const N1 = vNorm([bx * c1 + tx * s1 + ax * slope, by * c1 + ty * s1 + ay * slope, bz * c1 + tz * s1 + az * slope]);
        const p00 = [x1 + (bx * c0 + tx * s0) * r1, y1 + (by * c0 + ty * s0) * r1, z1 + (bz * c0 + tz * s0) * r1];
        const p01 = [x1 + (bx * c1 + tx * s1) * r1, y1 + (by * c1 + ty * s1) * r1, z1 + (bz * c1 + tz * s1) * r1];
        const p10 = [x2 + (bx * c0 + tx * s0) * r2, y2 + (by * c0 + ty * s0) * r2, z2 + (bz * c0 + tz * s0) * r2];
        const p11 = [x2 + (bx * c1 + tx * s1) * r2, y2 + (by * c1 + ty * s1) * r2, z2 + (bz * c1 + tz * s1) * r2];
        pushVert(p00, N0, mat); pushVert(p10, N0, mat); pushVert(p11, N1, mat);
        pushVert(p00, N0, mat); pushVert(p11, N1, mat); pushVert(p01, N1, mat);
        if (cap && r1 > 0.002) { const nb = [-ax, -ay, -az]; pushVert([x1, y1, z1], nb, mat); pushVert(p01, nb, mat); pushVert(p00, nb, mat); }
        if (cap && r2 > 0.002) { const nt = [ax, ay, az]; pushVert([x2, y2, z2], nt, mat); pushVert(p10, nt, mat); pushVert(p11, nt, mat); }
      }
    }

    function loftRings(rings, mat, segs = 16, capEnds = true) {
      parts++;
      const ringPts = rings.map(([cx, cy, cz, rx, rz, tiltX = 0, tiltZ = 0]) => {
        const pts = [];
        for (let i = 0; i < segs; i++) {
          const a = (i / segs) * Math.PI * 2;
          const ca = Math.cos(a), sa = Math.sin(a);
          const sq = 1 - 0.07 * Math.cos(4 * a);
          const r = rotPt(ca * rx * sq, 0, sa * rz * sq, tiltX, 0, tiltZ);
          const n = rotPt(ca / (rx || 1), 0.14, sa / (rz || 1), tiltX, 0, tiltZ);
          pts.push([[cx + r[0], cy + r[1], cz + r[2]], vNorm(n)]);
        }
        return pts;
      });
      for (let r = 0; r < ringPts.length - 1; r++) {
        const A = ringPts[r], B = ringPts[r + 1];
        for (let i = 0; i < segs; i++) {
          const j = (i + 1) % segs;
          pushVert(A[i][0], A[i][1], mat); pushVert(B[i][0], B[i][1], mat); pushVert(B[j][0], B[j][1], mat);
          pushVert(A[i][0], A[i][1], mat); pushVert(B[j][0], B[j][1], mat); pushVert(A[j][0], A[j][1], mat);
        }
      }
      if (capEnds && ringPts.length >= 2) {
        const first = rings[0], last = rings[rings.length - 1];
        for (let i = 0; i < segs; i++) {
          const j = (i + 1) % segs;
          pushVert([first[0], first[1], first[2]], [0, -1, 0], mat);
          pushVert(ringPts[0][j][0], [0, -1, 0], mat);
          pushVert(ringPts[0][i][0], [0, -1, 0], mat);
          pushVert([last[0], last[1], last[2]], [0, 1, 0], mat);
          pushVert(ringPts[ringPts.length - 1][i][0], [0, 1, 0], mat);
          pushVert(ringPts[ringPts.length - 1][j][0], [0, 1, 0], mat);
        }
      }
    }

    // 船体专用水线流线放样：sections = [[z, yKeel, yDeck, halfBeam, flare], ...]
    function loftHullZ(sections, mat, yMinClip = -99, yMaxClip = 99) {
      parts++;
      const profile = (sec) => {
        const [z, y0, y1, hb, flare = 1.0] = sec;
        const ya = Math.max(yMinClip, Math.min(yMaxClip, y0));
        const yb = Math.max(yMinClip, Math.min(yMaxClip, y1));
        const span = Math.max(1e-4, y1 - y0);
        const tA = (ya - y0) / span, tB = (yb - y0) / span;
        const tMid = (tA + tB) * 0.5;
        const wFn = (t) => hb * Math.pow(Math.max(0, Math.sin(t * Math.PI * 0.5)), 0.55) * (1 + (flare - 1) * t * t);
        return [
          [0, ya, z],
          [wFn(tA * 0.7 + tB * 0.3), ya * 0.7 + yb * 0.3, z],
          [wFn(tMid), (ya + yb) * 0.5, z],
          [wFn(tB), yb, z],
        ];
      };
      const built = sections.map(profile);
      for (let s = 0; s < built.length - 1; s++) {
        const A = built[s], B = built[s + 1];
        for (let side of [-1, 1]) {
          for (let k = 0; k < A.length - 1; k++) {
            const p00 = [A[k][0] * side, A[k][1], A[k][2]];
            const p01 = [A[k + 1][0] * side, A[k + 1][1], A[k + 1][2]];
            const p10 = [B[k][0] * side, B[k][1], B[k][2]];
            const p11 = [B[k + 1][0] * side, B[k + 1][1], B[k + 1][2]];
            if (side > 0) { pushTri(p00, p10, p11, mat); pushTri(p00, p11, p01, mat); }
            else { pushTri(p00, p11, p10, mat); pushTri(p00, p01, p11, mat); }
          }
        }
        // Deck strip
        const topIdx = A.length - 1;
        if (yMaxClip >= sections[s][2] - 0.005) {
          const d0L = [-A[topIdx][0], A[topIdx][1], A[topIdx][2]], d0R = [A[topIdx][0], A[topIdx][1], A[topIdx][2]];
          const d1L = [-B[topIdx][0], B[topIdx][1], B[topIdx][2]], d1R = [B[topIdx][0], B[topIdx][1], B[topIdx][2]];
          pushTri(d0L, d0R, d1R, MAT.deckTeak);
          pushTri(d0L, d1R, d1L, MAT.deckTeak);
        }
      }
      // Transom stern cap
      const st = built[0];
      for (let k = 0; k < st.length - 1; k++) {
        pushTri([-st[k][0], st[k][1], st[k][2]], [-st[k + 1][0], st[k + 1][1], st[k + 1][2]], [st[k + 1][0], st[k + 1][1], st[k + 1][2]], mat);
        pushTri([-st[k][0], st[k][1], st[k][2]], [st[k + 1][0], st[k + 1][1], st[k + 1][2]], [st[k][0], st[k][1], st[k][2]], mat);
      }
    }

    function ellipsoid(cx, cy, cz, rx, ry, rz, mat, maxPolar = Math.PI, rotX = 0, rotY = 0, rotZ = 0, rings = 10, segs = 14) {
      parts++;
      function pt(p, a) {
        const sp = Math.sin(p), cp = Math.cos(p), ca = Math.cos(a), sa = Math.sin(a);
        const rp = rotPt(sp * ca * rx, cp * ry, sp * sa * rz, rotX, rotY, rotZ);
        const rn = vNorm(rotPt(sp * ca / rx, cp / ry, sp * sa / rz, rotX, rotY, rotZ));
        return [[rp[0] + cx, rp[1] + cy, rp[2] + cz], rn];
      }
      for (let r = 0; r < rings; r++) {
        const p0 = maxPolar * r / rings, p1 = maxPolar * (r + 1) / rings;
        for (let s = 0; s < segs; s++) {
          const a0 = Math.PI * 2 * s / segs, a1 = Math.PI * 2 * (s + 1) / segs;
          const [v00, n00] = pt(p0, a0), [v10, n10] = pt(p1, a0), [v11, n11] = pt(p1, a1), [v01, n01] = pt(p0, a1);
          pushVert(v00, n00, mat); pushVert(v10, n10, mat); pushVert(v11, n11, mat);
          pushVert(v00, n00, mat); pushVert(v11, n11, mat); pushVert(v01, n01, mat);
        }
      }
    }

    function extrudeX(cx, halfW, polyYZ, mat) {
      parts++;
      const n = polyYZ.length;
      if (n < 3) return;
      let cy = 0, cz = 0;
      for (const [y, z] of polyYZ) { cy += y; cz += z; }
      cy /= n; cz /= n;
      for (let i = 0; i < n; i++) {
        const [y0, z0] = polyYZ[i], [y1, z1] = polyYZ[(i + 1) % n];
        pushTri([cx + halfW, cy, cz], [cx + halfW, y0, z0], [cx + halfW, y1, z1], mat);
        pushTri([cx - halfW, cy, cz], [cx - halfW, y1, z1], [cx - halfW, y0, z0], mat);
        pushTri([cx - halfW, y0, z0], [cx - halfW, y1, z1], [cx + halfW, y1, z1], mat);
        pushTri([cx - halfW, y0, z0], [cx + halfW, y1, z1], [cx + halfW, y0, z0], mat);
      }
    }

    function wheelX(x, y, z, radius, width, tireMat = MAT.rubber, hubMat = MAT.armorGrn, spinAngle = 0) {
      cyl(x - width * 0.5, y, z, x + width * 0.5, y, z, radius, radius, tireMat, 14);
      cyl(x - width * 0.56, y, z, x + width * 0.56, y, z, radius * 0.62, radius * 0.62, hubMat, 10);
      cyl(x - width * 0.62, y, z, x + width * 0.62, y, z, radius * 0.22, radius * 0.22, MAT.gunmetal, 8);
      const sy = Math.sin(spinAngle) * radius * 0.54, sz = Math.cos(spinAngle) * radius * 0.54;
      const sgn = x >= 0 ? 1 : -1;
      cyl(x + sgn * width * 0.57, y - sy, z - sz, x + sgn * width * 0.57, y + sy, z + sz, radius * 0.08, radius * 0.08, MAT.armorDark, 6);
    }

    function emblemStar(cx, cy, cz, radius, facing = 'Z') {
      parts++;
      const mapPt = (u, v, w) => facing === 'Y' ? [cx + u, cy + w, cz - v]
        : facing === 'Z' ? [cx + u, cy + v, cz + w]
        : facing === '-Z' ? [cx - u, cy + v, cz - w]
        : facing === 'X' ? [cx + w, cy + v, cz - u] : [cx - w, cy + v, cz + u];
      const apex = mapPt(0, 0, radius * 0.28);
      for (let i = 0; i < 10; i++) {
        const a0 = -Math.PI * 0.5 + (i * Math.PI) / 5 + Math.PI;
        const a1 = -Math.PI * 0.5 + ((i + 1) * Math.PI) / 5 + Math.PI;
        const r0 = i % 2 === 0 ? radius : radius * 0.42;
        const r1 = (i + 1) % 2 === 0 ? radius : radius * 0.42;
        pushTri(apex, mapPt(Math.cos(a0) * r0, Math.sin(a0) * r0, 0), mapPt(Math.cos(a1) * r1, Math.sin(a1) * r1, 0), MAT.ccpStarRed);
      }
    }

    function emblemSun(cx, cy, cz, radius, facing = 'Z') {
      const off = (d) => facing === 'Z' ? [cx, cy, cz + d]
        : facing === '-Z' ? [cx, cy, cz - d]
        : facing === 'X' ? [cx + d, cy, cz] : [cx - d, cy, cz];
      const p0 = off(0), p1 = off(radius * 0.16), p2 = off(radius * 0.28);
      cyl(p0[0], p0[1], p0[2], p1[0], p1[1], p1[2], radius, radius, MAT.rocBlue, 16);
      cyl(p1[0], p1[1], p1[2], p2[0], p2[1], p2[2], radius * 0.58, radius * 0.52, MAT.rocSunWhite, 12);
    }

    function hand(wrist, forearmDir, sideSign = 1, curl = 0.85, triggerMode = false) {
      const F = vNorm(forearmDir);
      const upRef = Math.abs(F[1]) < 0.9 ? [0, 1, 0] : [0, 0, 1];
      const R = vNorm(vCross(F, upRef));
      const U = vNorm(vCross(R, F));
      const pt = (f, r, u) => [
        wrist[0] + F[0] * f + R[0] * r + U[0] * u,
        wrist[1] + F[1] * f + R[1] * r + U[1] * u,
        wrist[2] + F[2] * f + R[2] * r + U[2] * u,
      ];
      const palmMid = pt(0.025, 0, 0);
      cyl(wrist[0], wrist[1], wrist[2], palmMid[0], palmMid[1], palmMid[2], 0.024, 0.026, MAT.skin, 9);
      const palmTip = pt(0.046, 0, 0);
      cyl(palmMid[0], palmMid[1], palmMid[2], palmTip[0], palmTip[1], palmTip[2], 0.026, 0.023, MAT.skin, 9);

      const th0 = pt(0.017, sideSign * 0.021, 0.005);
      const th1 = pt(0.038, sideSign * (0.030 - curl * 0.008), 0.010 - curl * 0.012);
      const th2 = pt(0.054, sideSign * (0.020 - curl * 0.014), -curl * 0.016);
      cyl(th0[0], th0[1], th0[2], th1[0], th1[1], th1[2], 0.0085, 0.0074, MAT.skin, 7);
      cyl(th1[0], th1[1], th1[2], th2[0], th2[1], th2[2], 0.0072, 0.0060, MAT.skinShade, 7);

      const offsets = [-0.017, -0.006, 0.006, 0.016];
      const lengths = [0.95, 1.02, 0.96, 0.80];
      for (let i = 0; i < 4; i++) {
        const isTrigger = triggerMode && ((sideSign < 0 && i === 0) || (sideSign > 0 && i === 3));
        const c = isTrigger ? curl * 0.45 : curl;
        const lat = offsets[i], L = lengths[i];
        const k0 = pt(0.045, lat, 0.003);
        const k1 = pt(0.045 + Math.cos(c * 0.72) * 0.023 * L, lat, 0.003 - Math.sin(c * 0.72) * 0.023 * L);
        const k2 = pt(0.045 + (Math.cos(c * 0.72) * 0.023 + Math.cos(c * 1.56) * 0.020) * L,
          lat, 0.003 - (Math.sin(c * 0.72) * 0.023 + Math.sin(c * 1.56) * 0.020) * L);
        cyl(k0[0], k0[1], k0[2], k1[0], k1[1], k1[2], 0.0070, 0.0060, MAT.skin, 6);
        cyl(k1[0], k1[1], k1[2], k2[0], k2[1], k2[2], 0.0058, 0.0048, MAT.skinShade, 6);
      }
    }

    function _appendTransformed(floatArr, origin, xform) {
      const copy = new Float32Array(floatArr.length);
      for (let i = 0; i < floatArr.length; i += 11) {
        const p = xform(floatArr[i], floatArr[i + 1], floatArr[i + 2]);
        const n = vNorm(xform(floatArr[i + 3], floatArr[i + 4], floatArr[i + 5]));
        copy[i] = p[0] + origin[0]; copy[i + 1] = p[1] + origin[1]; copy[i + 2] = p[2] + origin[2];
        copy[i + 3] = n[0]; copy[i + 4] = n[1]; copy[i + 5] = n[2];
        for (let k = 6; k < 11; k++) copy[i + k] = floatArr[i + k];
      }
      chunks.push(copy);
    }

    function finish() {
      const base = new Float32Array(out);
      if (!chunks.length) return { data: base, tris: base.length / 33, parts };
      let total = base.length;
      for (const c of chunks) total += c.length;
      const merged = new Float32Array(total);
      merged.set(base, 0);
      let off = base.length;
      for (const c of chunks) { merged.set(c, off); off += c.length; }
      return { data: merged, tris: merged.length / 33, parts: parts + chunks.length * 6 };
    }

    return { box, cyl, loftRings, loftHullZ, ellipsoid, extrudeX, wheelX, emblemStar, emblemSun, hand, _appendTransformed, finish };
  }

  // ==================== 制式轻重枪械建模 ====================
  function addFirearm(b, type, ox = 0, oy = 0, oz = 0, scale = 1, flash = false, ejectT = -1) {
    const S = scale;
    const X = v => ox + v * S, Y = v => oy + v * S, Z = v => oz + v * S;
    const boltKick = flash ? -0.04 : 0;

    if (ejectT >= 0 && ejectT < 1) {
      const ex = 0.08 + ejectT * 0.36, ey = 0.14 + ejectT * 0.20 - ejectT * ejectT * 0.52, ez = 0.02 - ejectT * 0.10;
      b.cyl(X(ex), Y(ey), Z(ez), X(ex + 0.02), Y(ey + 0.03), Z(ez + 0.04), 0.011 * S, 0.010 * S, MAT.brass, 8);
    }
    const addMuzzleBlast = (mz, my = 0.085) => {
      if (!flash) return;
      b.ellipsoid(X(0), Y(my), Z(mz + 0.10), 0.050 * S, 0.050 * S, 0.15 * S, MAT.flameCore);
      b.ellipsoid(X(0), Y(my), Z(mz + 0.06), 0.10 * S, 0.034 * S, 0.05 * S, MAT.flameOuter);
      b.ellipsoid(X(0), Y(my), Z(mz + 0.06), 0.034 * S, 0.10 * S, 0.05 * S, MAT.flameOuter);
    };

    if (type === 'gun_c96') {
      b.box(X(0), Y(0.08), Z(-0.05), 0.074 * S, 0.12 * S, 0.34 * S, MAT.bluedSteel);
      b.cyl(X(0), Y(0.10), Z(0.12), X(0), Y(0.10), Z(0.46), 0.027 * S, 0.020 * S, MAT.bluedSteel, 10);
      b.box(X(0), Y(0.02), Z(0.07), 0.060 * S, 0.13 * S, 0.11 * S, MAT.gunmetal);
      b.cyl(X(0), Y(0.02), Z(-0.16), X(0), Y(-0.24), Z(-0.25), 0.042 * S, 0.054 * S, MAT.woodWalnut, 10);
      addMuzzleBlast(0.46, 0.10);
      return;
    }

    const addButtstock = (mat = MAT.woodWalnut, zStart = -0.14, drop = -0.15, len = 0.50) => {
      b.extrudeX(X(0), 0.036 * S, [
        [Y(0.06), Z(zStart)],
        [Y(0.044), Z(zStart - len * 0.88)],
        [Y(drop), Z(zStart - len)],
        [Y(drop - 0.058), Z(zStart - len * 0.92)],
        [Y(-0.058), Z(zStart - len * 0.28)],
        [Y(-0.028), Z(zStart)]
      ], mat);
      b.box(X(0), Y((0.04 + drop - 0.05) * 0.5), Z(zStart - len * 0.96), 0.074 * S, 0.19 * S, 0.024 * S, MAT.gunmetal);
    };

    if (type === 'gun_ppsh41') {
      addButtstock(MAT.woodWalnut, -0.10, -0.14, 0.48);
      b.box(X(0), Y(0.065), Z(0.06), 0.076 * S, 0.094 * S, 0.34 * S, MAT.bluedSteel);
      b.cyl(X(0), Y(0.075), Z(0.22), X(0), Y(0.075), Z(0.68), 0.040 * S, 0.036 * S, MAT.gunmetal, 12);
      b.cyl(X(0), Y(-0.088), Z(0.14), X(0), Y(-0.088), Z(0.22), 0.142 * S, 0.142 * S, MAT.gunmetal, 18);
      addMuzzleBlast(0.72, 0.078);
      return;
    }
    if (type === 'gun_thompson') {
      addButtstock(MAT.woodWalnut, -0.15, -0.17, 0.43);
      b.box(X(0), Y(0.075), Z(0.02), 0.080 * S, 0.102 * S, 0.39 * S, MAT.bluedSteel);
      b.box(X(0), Y(0.02), Z(0.35), 0.066 * S, 0.060 * S, 0.25 * S, MAT.woodWalnut);
      b.cyl(X(0), Y(0.082), Z(0.22), X(0), Y(0.082), Z(0.61), 0.025 * S, 0.021 * S, MAT.bluedSteel, 10);
      b.box(X(0), Y(-0.12), Z(0.11), 0.042 * S, 0.29 * S, 0.070 * S, MAT.gunmetal);
      addMuzzleBlast(0.62, 0.082);
      return;
    }
    if (type === 'gun_zb26') {
      addButtstock(MAT.woodWalnut, -0.17, -0.16, 0.46);
      b.box(X(0), Y(0.07), Z(0.02), 0.082 * S, 0.108 * S, 0.43 * S, MAT.bluedSteel);
      b.cyl(X(0), Y(0.09), Z(0.24), X(0), Y(0.09), Z(0.92), 0.028 * S, 0.022 * S, MAT.bluedSteel, 10);
      b.box(X(0), Y(0.25), Z(0.10), 0.044 * S, 0.28 * S, 0.092 * S, MAT.gunmetal, 0.08, 0, 0);
      b.cyl(X(0), Y(0.09), Z(0.92), X(0), Y(0.09), Z(1.00), 0.022 * S, 0.036 * S, MAT.bluedSteel, 10);
      addMuzzleBlast(1.00, 0.09);
      return;
    }

    const wood = type === 'gun_type38' ? MAT.woodLight : MAT.woodWalnut;
    addButtstock(wood, -0.14, -0.15, 0.48);
    const bEnd = type === 'gun_type38' ? 1.04 : type === 'gun_hanyang' ? 0.96 : 0.88;
    const stockEnd = type === 'gun_m1_garand' ? 0.66 : type === 'gun_type38' ? 0.75 : 0.60;
    b.box(X(0), Y(0.048), Z((stockEnd - 0.14) * 0.5), 0.070 * S, 0.076 * S, (stockEnd + 0.14) * S, wood);
    b.box(X(0), Y(0.078), Z(0.02), 0.074 * S, 0.080 * S, 0.27 * S, MAT.bluedSteel);
    b.cyl(X(0), Y(0.082), Z(0.14), X(0), Y(0.082), Z(bEnd), 0.022 * S, 0.017 * S, MAT.bluedSteel, 10);
    if (type !== 'gun_m1_garand') {
      b.cyl(X(0.035), Y(0.082), Z(boltKick), X(0.092), Y(0.068), Z(-0.01 + boltKick), 0.010 * S, 0.010 * S, MAT.brightStl, 8);
      if (type === 'gun_type38' || type === 'gun_zhongzheng') {
        b.box(X(0), Y(0.044), Z(bEnd + 0.14), 0.012 * S, 0.024 * S, 0.28 * S, MAT.brightStl);
      }
    }
    b.box(X(0), Y(0.110), Z(bEnd - 0.04), 0.014 * S, 0.030 * S, 0.024 * S, MAT.bluedSteel);
    addMuzzleBlast(bEnd, 0.082);
  }

  function addOrientedFirearm(b, type, origin, pitch = 0, yaw = 0, scale = 0.60, flash = false, ejectT = -1) {
    const sub = createBuilder();
    addFirearm(sub, type, 0, 0, 0, scale, flash, ejectT);
    const built = sub.finish().data;
    const cp = Math.cos(pitch), sp = Math.sin(pitch), cy = Math.cos(yaw), sy = Math.sin(yaw);
    const xform = (x, y, z) => {
      const y1 = y * cp - z * sp, z1 = y * sp + z * cp;
      const x2 = x * cy + z1 * sy, z2 = -x * sy + z1 * cy;
      return [x2, y1, z2];
    };
    b._appendTransformed(built, origin, xform);
    const isPistol = type === 'gun_c96';
    const gripLocal = isPistol ? [-0.032 * scale, -0.10 * scale, -0.16 * scale] : [-0.048 * scale, -0.078 * scale, -0.17 * scale];
    const foreLocal = isPistol ? [0.032 * scale, -0.10 * scale, -0.13 * scale] : [0.046 * scale, -0.030 * scale, 0.33 * scale];
    return {
      grip: vAdd(origin, xform(...gripLocal)),
      forend: vAdd(origin, xform(...foreLocal)),
    };
  }

  // ==================== 派系战服解析（含全国各野战军与地方军阀国军特征） ====================
  function resolveUniformStyle(side, variant = '') {
    const v = String(variant || '');
    if (side === 'ccp') {
      if (v === 'dongye' || v === 'sov') {
        return { tunic: MAT.ccpWinter, pants: MAT.ccpWinter, hat: 'ccp_ushanka', gun: 'gun_ppsh41', quilted: true };
      }
      if (v === 'xibeiye') {
        return { tunic: MAT.ccpTunic, pants: MAT.ccpTunic, hat: 'ccp_cap', gun: 'gun_type38', nwTowel: true };
      }
      return { tunic: MAT.ccpTunic, pants: MAT.ccpTunic, hat: 'ccp_cap', gun: 'gun_type38' };
    }
    // 国军及各系地方军阀（统一佩戴国军青天白日帽徽/盔徽，保留地域特色军服配件）
    if (v === 'us' || v === 'roc_american') {
      return { tunic: MAT.rocUSJacket, pants: MAT.rocUSJacket, hat: 'roc_m1', gun: 'gun_m1_garand', gaiters: true };
    }
    if (v === 'qingma' || v === 'ningma' || v === 'ma-clique') {
      return { tunic: MAT.rocMaWool, pants: MAT.rocMaWool, hat: 'roc_ma_cap', gun: 'gun_zhongzheng', saber: true, fleeceCollar: true, redTab: true };
    }
    if (v === 'xinjiang' || v === 'xinjiang-garrison') {
      return { tunic: MAT.rocKhaki, pants: MAT.rocKhaki, hat: 'roc_ma_cap', gun: 'gun_zhongzheng', fleeceCollar: true, redTab: true };
    }
    if (v === 'xizang' || v === 'xizang-local') {
      return { tunic: MAT.tibetMaroon, pants: MAT.rocKhaki, hat: 'roc_tibet', gun: 'gun_hanyang', fleeceCollar: true };
    }
    if (v === 'dianxi') {
      return { tunic: MAT.rocKhaki, pants: MAT.rocKhaki, hat: 'roc_adrian', gun: 'gun_zhongzheng', redTab: true };
    }
    if (v === 'chuanxi') {
      return { tunic: MAT.rocChuanGry, pants: MAT.rocChuanGry, hat: 'roc_cap', gun: 'gun_hanyang', bambooHat: true, redTab: true };
    }
    if (v === 'guixi') {
      return { tunic: MAT.rocGuiGreen, pants: MAT.rocGuiGreen, hat: 'roc_m35', gun: 'gun_thompson', redTab: true };
    }
    if (v === 'yuejun') {
      return { tunic: MAT.rocKhaki, pants: MAT.rocKhaki, hat: 'roc_m1', gun: 'gun_zhongzheng', redTab: true };
    }
    if (v === 'jinsui' || v === 'suiyuan') {
      return { tunic: MAT.rocJinWool, pants: MAT.rocJinWool, hat: 'roc_m35', gun: 'gun_type38', redTab: true };
    }
    // 二战 & 朝鲜战争各国专属单兵涂装与装备（每个国家独一无二！）
    if (variant === 'usa') return { tunic: MAT.usaOlive, pants: MAT.usaPants, hat: 'usa_m1', gun: 'gun_thompson', nation: 'usa' };
    if (variant === 'ussr') return { tunic: MAT.ussrKhaki, pants: MAT.ussrKhaki, hat: 'ussr_ssh40', gun: 'gun_ppsh', nation: 'ussr', isRed: true };
    if (variant === 'uk') return { tunic: MAT.ukBrown, pants: MAT.ukBrown, hat: 'uk_brodie', gun: 'gun_zhongzheng', nation: 'uk' };
    if (variant === 'france') return { tunic: MAT.fraKhaki, pants: MAT.fraKhaki, hat: 'fra_adrian', gun: 'gun_zhongzheng', nation: 'france' };
    if (variant === 'japan') return { tunic: MAT.jpnKhaki, pants: MAT.jpnKhaki, hat: 'jpn_helm', gun: 'gun_type38', nation: 'japan' };
    if (variant === 'germany') return { tunic: MAT.gerFeldgrau, pants: MAT.gerFeldgrau, hat: 'ger_m35', gun: 'gun_zhongzheng', nation: 'germany', gasMaskCan: true };
    if (variant === 'china_ww2') return { tunic: MAT.rocCentral, pants: MAT.rocCentral, hat: 'roc_m35', gun: 'gun_zhongzheng', nation: 'china', broadsword: true };
    if (variant === 'pva') return { tunic: MAT.pvaCotton, pants: MAT.pvaCotton, hat: 'ccp_ushanka', gun: 'gun_ppsh', nation: 'pva', isRed: true };
    if (variant === 'kpa') return { tunic: MAT.kpaKhaki, pants: MAT.kpaKhaki, hat: 'ussr_ssh40', gun: 'gun_mosin', nation: 'kpa', isRed: true };

    // 胡宗南集团及中央军嫡系
    return { tunic: MAT.rocCentral, pants: MAT.rocCentral, hat: 'roc_cap', gun: 'gun_zhongzheng', redTab: true };
  }

  // ==================== 无穿模精细人物与全姿态库 ====================
  function addCampProps(b, isSleep, phase = 0) {
    if (isSleep) {
      // 后方野战行军帐篷 + 前侧温暖篝火（严格与卧姿睡垫分离，绝不穿模）
      b.extrudeX(-0.56, 0.36, [[0.01, -0.68], [0.58, -0.18], [0.01, 0.32]], MAT.canvasTent);
      b.cyl(-0.93, 0.58, -0.18, -0.19, 0.58, -0.18, 0.018, 0.018, MAT.woodWalnut, 8);
      // 篝火柴堆与跃动火苗
      const fx = -0.52, fz = 0.58;
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 4;
        b.cyl(fx - Math.cos(a) * 0.14, 0.03, fz - Math.sin(a) * 0.14, fx + Math.cos(a) * 0.14, 0.06, fz + Math.sin(a) * 0.14, 0.024, 0.022, MAT.woodWalnut, 7);
      }
      const flick = 1 + Math.sin(phase * 5.2) * 0.14;
      b.ellipsoid(fx, 0.15 * flick, fz, 0.085, 0.14 * flick, 0.085, MAT.flameOuter);
      b.ellipsoid(fx, 0.13 * flick, fz, 0.050, 0.10 * flick, 0.050, MAT.flameCore);
    } else {
      // 城内日间休整：木质弹药箱坐凳 + 右侧三支步枪三角架枪 (Stacked Rifles)
      b.box(0, 0.15, -0.06, 0.34, 0.28, 0.28, MAT.woodWalnut);
      const sx = -0.52, sz = 0.22;
      for (let i = 0; i < 3; i++) {
        const a = (i * Math.PI * 2) / 3 + 0.3;
        b.cyl(sx + Math.cos(a) * 0.18, 0.02, sz + Math.sin(a) * 0.18, sx, 0.72, sz, 0.018, 0.014, MAT.woodWalnut, 8);
        b.cyl(sx, 0.52, sz, sx - Math.cos(a) * 0.05, 0.88, sz - Math.sin(a) * 0.05, 0.012, 0.010, MAT.bluedSteel, 8);
      }
    }
  }

  function addSoldier(b, opts = {}) {
    const {
      ox = 0, oy = 0, oz = 0, side = 'ccp', variant = '',
      action = 'idle', phase = 0, weapon = null,
      leftTarget = null, rightTarget = null, crouch = 0, bodyLean = 0, mounted = false
    } = opts;

    const isCCP = side === 'ccp';
    const style = resolveUniformStyle(side, variant);
    const tunicMat = style.tunic;
    const pantsMat = style.pants;
    const gunId = weapon || style.gun;

    // ---------- 1. 夜间宿营卧姿（独立水平人体拓扑，完全贴合睡垫，零穿地零穿模） ----------
    if (action === 'sleep' && !mounted && !leftTarget && !rightTarget) {
      addCampProps(b, true, phase);
      const breath = Math.sin(phase * 1.6) * 0.010;
      const bx = ox + 0.18;
      // 铺地帆布防潮睡垫与枕包
      b.box(bx, 0.035, 0.02, 0.54, 0.05, 1.56, MAT.ccpTrim);
      b.box(bx, 0.11, -0.56, 0.32, 0.11, 0.22, isCCP ? MAT.ccpRation : MAT.rocWebbing);
      // 卧姿头部（枕在背包上，面朝斜上方，带微微呼吸起伏）
      const hy = 0.23, hz = -0.54;
      b.ellipsoid(bx, hy, hz, 0.106, 0.112, 0.118, MAT.skin);
      b.ellipsoid(bx, hy - 0.02, hz - 0.03, 0.108, 0.095, 0.105, MAT.hairDark);
      for (const sx of [-1, 1]) {
        b.box(bx + sx * 0.04, hy + 0.106, hz + 0.02, 0.032, 0.008, 0.012, MAT.hairDark); // 闭目眼睫线
      }
      b.cyl(bx, hy + 0.105, hz + 0.01, bx, hy + 0.128, hz + 0.04, 0.012, 0.016, MAT.skin, 7);
      // 军帽端正置于枕畔
      if (isCCP) {
        b.ellipsoid(bx + 0.26, 0.10, -0.52, 0.12, 0.075, 0.13, tunicMat);
        b.emblemStar(bx + 0.26, 0.12, -0.39, 0.030, 'Z');
      } else {
        b.ellipsoid(bx + 0.26, 0.10, -0.52, 0.13, 0.10, 0.14, MAT.rocHelmM35, Math.PI * 0.58);
        b.emblemSun(bx + 0.26, 0.12, -0.38, 0.028, 'Z');
      }
      // 躯干与盖在身上的行军军毯/大衣
      b.loftRings([
        [bx, 0.15 + breath, -0.36, 0.19, 0.11, Math.PI * 0.5, 0],
        [bx, 0.17 + breath, -0.10, 0.22, 0.13 + breath, Math.PI * 0.5, 0],
        [bx, 0.16 + breath * 0.6, 0.20, 0.21, 0.12, Math.PI * 0.5, 0],
        [bx, 0.13, 0.52, 0.17, 0.09, Math.PI * 0.5, 0],
      ], isCCP ? tunicMat : MAT.blanketGrn, 14);
      // 双臂自然交叠于胸腹军毯之上（严格在军毯表面上方 y = 0.29）
      for (const sx of [-1, 1]) {
        const sh = [bx + sx * 0.21, 0.17 + breath, -0.30];
        const elb = [bx + sx * 0.24, 0.19 + breath, -0.06];
        const wr = [bx + sx * 0.07, 0.295 + breath, -0.02];
        b.cyl(sh[0], sh[1], sh[2], elb[0], elb[1], elb[2], 0.060, 0.052, tunicMat, 10);
        b.cyl(elb[0], elb[1], elb[2], wr[0], wr[1], wr[2], 0.050, 0.044, tunicMat, 10);
        b.hand(wr, vSub(wr, elb), -sx, 0.75, false);
      }
      // 双脚军靴微露于毯尾
      for (const sx of [-0.09, 0.09]) {
        b.box(bx + sx, 0.12, 0.64, 0.10, 0.15, 0.12, isCCP ? MAT.ccpShoeGrn : MAT.leatherDark);
      }
      // 随身枪械平放于睡垫右侧木托架上（避免弹鼓/枪托下垂入地）
      b.box(bx + 0.34, 0.04, 0.02, 0.10, 0.07, 0.52, MAT.woodWalnut);
      addOrientedFirearm(b, gunId, [bx + 0.34, 0.16, 0.05], 0, 0, 0.54, false, -1);
      return;
    }

    // ---------- 2. 常规站/跑/跪/挖壕/城内坐姿动作学解算 ----------
    let lean = bodyLean, dropY = -crouch, stride = 0, stepZ = 0, gunMode = 'port', flash = false, ejectT = -1;
    let digShovel = null, seatedRest = false;

    if (!leftTarget && !rightTarget) {
      if (action === 'idle' || action === 'hold' || action === 'inspect') {
        dropY += Math.sin(phase * 1.4) * 0.008;
        gunMode = 'port';
      } else if (action === 'rest') {
        // 城内日间休整：端坐木箱、双手捧搪瓷缸饮水休整，旁立步枪架！
        addCampProps(b, false, phase);
        seatedRest = true;
        dropY = -0.44;
        lean = 0.08 + Math.sin(phase * 1.5) * 0.03;
      } else if (action === 'march' || action === 'move') {
        stride = Math.sin(phase * 2.6) * 0.48;
        dropY += Math.abs(Math.cos(phase * 2.6)) * 0.024 - 0.015;
        lean = 0.09;
        gunMode = 'shoulder_march';
      } else if (action === 'advance' || action === 'attack') {
        const cyc = (phase * 0.45) % 1.0;
        if (cyc < 0.45) {
          stride = Math.sin(phase * 4.2) * 0.54;
          lean = 0.26;
          dropY -= 0.08;
          stepZ = Math.sin((cyc / 0.45) * Math.PI) * 0.14;
          gunMode = 'charge';
        } else {
          lean = 0.17;
          dropY -= 0.11;
          const firePulse = ((cyc - 0.45) * 7.2) % 1.0;
          flash = firePulse < 0.32;
          ejectT = firePulse;
          gunMode = 'aim_fire';
        }
      } else if (action === 'fire') {
        lean = 0.16;
        dropY -= 0.08;
        const firePulse = (phase * 1.5) % 1.0;
        flash = firePulse < 0.26;
        ejectT = firePulse;
        gunMode = 'aim_fire';
      } else if (action === 'siege') {
        // 围城压制：修筑围困土垒，半蹲仰角封锁城头火力
        for (let i = -2; i <= 2; i++) {
          b.ellipsoid(ox + i * 0.26, 0.10, oz + 0.62, 0.22, 0.11, 0.18, MAT.earthSoil);
          if (Math.abs(i) <= 1) b.ellipsoid(ox + i * 0.24, 0.22, oz + 0.58, 0.19, 0.08, 0.13, MAT.sandbag);
        }
        dropY -= 0.22;
        lean = 0.12;
        const firePulse = (phase * 1.2) % 1.0;
        flash = firePulse < 0.22;
        ejectT = firePulse;
        gunMode = 'aim_siege';
      } else if (action === 'intercept') {
        // 围点打援：利用山石灌木侧翼设伏，斜向瞄准阻击援敌
        b.ellipsoid(ox + 0.26, 0.14, oz + 0.54, 0.24, 0.16, 0.18, MAT.armorDark);
        b.ellipsoid(ox - 0.22, 0.12, oz + 0.56, 0.22, 0.13, 0.16, MAT.earthSoil);
        dropY -= 0.25;
        lean = 0.15;
        gunMode = 'aim_ambush';
      } else if (action === 'entrench') {
        // 挖战壕专有指令：双手紧握工兵锹掘土筑起战壕沙袋胸墙！
        for (let i = -2; i <= 2; i++) {
          b.ellipsoid(ox + i * 0.28, 0.09, oz + 0.58, 0.24, 0.10, 0.20, MAT.earthSoil);
          if (Math.abs(i) <= 1) b.ellipsoid(ox + i * 0.24, 0.20, oz + 0.56, 0.19, 0.08, 0.13, MAT.sandbag);
        }
        const t = (phase * 0.55) % 1.0;
        const digDip = Math.sin(t * Math.PI);
        lean = 0.34 + digDip * 0.20;
        dropY -= 0.13 + digDip * 0.07;
        gunMode = 'slung_back';
        digShovel = { t, fling: t > 0.58 ? (t - 0.58) / 0.42 : 0 };
      } else if (action === 'defend') {
        // 守阵地专有指令：半跪于双层沙袋掩体后稳固据枪警戒（枪管严格高于沙袋顶 y=0.38，绝不穿沙袋！）
        for (let i = -2; i <= 2; i++) {
          b.ellipsoid(ox + i * 0.26, 0.09, oz + 0.58, 0.22, 0.09, 0.16, MAT.earthSoil);
          b.ellipsoid(ox + i * 0.22, 0.20, oz + 0.54, 0.18, 0.08, 0.12, MAT.sandbag);
          if (Math.abs(i) <= 1) b.ellipsoid(ox + i * 0.20, 0.31, oz + 0.52, 0.17, 0.075, 0.11, MAT.sandbag);
        }
        dropY -= 0.26;
        lean = 0.13;
        gunMode = 'aim_fire';
        const firePulse = (phase * 0.95) % 1.0;
        flash = firePulse < 0.18;
        ejectT = firePulse;
      }
    }

    const baseZ = oz + stepZ + (digShovel ? -0.22 : seatedRest ? -0.04 : 0);
    const pelvisY = oy + 0.88 + dropY;

    // ---------- 3. 双腿、螺旋绑腿/美式护腿与制式军鞋 ----------
    for (const s of [-1, 1]) {
      let hip, knee, ank;
      if (mounted) {
        hip = [ox + s * 0.16, pelvisY + 0.02, baseZ];
        knee = [ox + s * 0.34, pelvisY - 0.16, baseZ + 0.16];
        ank = [ox + s * 0.32, pelvisY - 0.50, baseZ + 0.04];
        b.cyl(ox + s * 0.23, pelvisY + 0.06, baseZ + 0.02, ank[0], ank[1] - 0.04, ank[2], 0.009, 0.009, MAT.leather, 6);
        b.box(ank[0], ank[1] - 0.10, ank[2] + 0.04, 0.135, 0.020, 0.055, MAT.brightStl);
      } else if (seatedRest) {
        // 坐姿开膝稳踩地面（y >= 0.015，绝不陷入地面或穿过衣摆）
        hip = [ox + s * 0.14, pelvisY + 0.02, baseZ + 0.04];
        knee = [ox + s * 0.25, oy + 0.42, baseZ + 0.34];
        ank = [ox + s * 0.21, oy + 0.11, baseZ + 0.38];
      } else {
        const lx = ox + s * (digShovel ? 0.19 : 0.132);
        const sw = s * stride;
        const isKneel = dropY < -0.20 && s === -1 && stride === 0;
        const footY = oy + (stride !== 0 ? Math.max(0, -s * Math.cos(phase * 2.6)) * 0.07 : 0);
        const footZ = baseZ + (digShovel ? (s > 0 ? 0.14 : -0.18) : isKneel ? -0.24 : Math.sin(sw) * 0.30);
        hip = [ox + s * 0.132, pelvisY, baseZ];
        const legIK = solveIK(hip, [lx, footY + 0.11, footZ], 0.41, 0.40, [s * (digShovel ? 0.25 : 0.06), 0.15, 0.95]);
        knee = legIK.elbow; ank = legIK.wrist;
      }

      b.cyl(hip[0], hip[1], hip[2], knee[0], knee[1], knee[2], 0.102, 0.082, pantsMat, 12);
      b.ellipsoid(knee[0], knee[1], knee[2], 0.080, 0.080, 0.082, pantsMat);

      if (style.gaiters) {
        b.cyl(knee[0], knee[1], knee[2], (knee[0] + ank[0]) * 0.5, (knee[1] + ank[1]) * 0.5, (knee[2] + ank[2]) * 0.5, 0.080, 0.072, pantsMat, 10);
        b.cyl((knee[0] + ank[0]) * 0.5, (knee[1] + ank[1]) * 0.5, (knee[2] + ank[2]) * 0.5, ank[0], ank[1], ank[2], 0.074, 0.064, MAT.rocWebbing, 10);
        b.box(ank[0], ank[1] - 0.055, ank[2] + 0.048, 0.124, 0.098, 0.228, MAT.leather);
        b.box(ank[0], ank[1] - 0.096, ank[2] + 0.048, 0.130, 0.025, 0.236, MAT.rubber);
      } else if (isCCP) {
        b.cyl(knee[0], knee[1], knee[2], ank[0], ank[1], ank[2], 0.078, 0.062, MAT.ccpPuttee, 10);
        for (let band = 1; band <= 4; band++) {
          const bt = band / 5;
          const bx = knee[0] + (ank[0] - knee[0]) * bt, by = knee[1] + (ank[1] - knee[1]) * bt, bz = knee[2] + (ank[2] - knee[2]) * bt;
          const r = 0.080 - bt * 0.015;
          b.cyl(bx, by - 0.011, bz, bx, by + 0.011, bz, r, r, band % 2 ? MAT.ccpTrim : MAT.ccpTunic, 10, false);
        }
        b.box(ank[0], ank[1] - 0.052, ank[2] + 0.048, 0.120, 0.084, 0.224, MAT.ccpShoeGrn);
        b.ellipsoid(ank[0], ank[1] - 0.062, ank[2] + 0.146, 0.060, 0.035, 0.036, MAT.ccpRation);
        b.box(ank[0], ank[1] - 0.092, ank[2] + 0.048, 0.126, 0.024, 0.232, MAT.ccpRation);
      } else {
        b.cyl(knee[0], knee[1], knee[2], ank[0], ank[1], ank[2], 0.078, 0.063, pantsMat, 10);
        b.box(ank[0], ank[1] - 0.055, ank[2] + 0.048, 0.122, 0.094, 0.226, MAT.leatherDark);
        b.box(ank[0], ank[1] - 0.096, ank[2] + 0.048, 0.128, 0.026, 0.236, MAT.rubber);
      }
    }

    // ---------- 4. 躯干放样、军服衣领徽章与贴体武装带（零穿模路径） ----------
    const sl = Math.sin(lean), cl = Math.cos(lean);
    const spinePt = (h) => [ox, pelvisY + h * cl, baseZ + h * sl];
    const skirtZ = seatedRest ? 0.04 : 0;
    const [p0x, p0y, p0z] = spinePt(seatedRest ? -0.03 : -0.07);
    const [p1x, p1y, p1z] = spinePt(0.08);
    const [p2x, p2y, p2z] = spinePt(0.24);
    const [p3x, p3y, p3z] = spinePt(0.42);
    const [p4x, p4y, p4z] = spinePt(0.54);

    b.loftRings([
      [p0x, p0y, p0z + skirtZ, seatedRest ? 0.228 : 0.212, seatedRest ? 0.155 : 0.136, lean, 0],
      [p1x, p1y, p1z, 0.178, 0.112, lean, 0],
      [p2x, p2y, p2z, 0.198, 0.126, lean, 0],
      [p3x, p3y, p3z, 0.216, 0.132, lean, 0],
      [p4x, p4y, p4z, 0.154, 0.096, lean, 0],
    ], tunicMat, 16);

    if (style.quilted) {
      for (const h of [0.03, 0.17, 0.31, 0.41]) {
        const [qx, qy, qz] = spinePt(h);
        b.cyl(qx, qy - 0.01, qz, qx, qy + 0.01, qz, 0.204, 0.204, MAT.ccpTrim, 14, false);
      }
    }

    // 衣领（支持西北马家军/新疆羊皮翻领与中央军红领章）
    const [colX, colY, colZ] = spinePt(0.54);
    b.cyl(colX, colY - 0.02, colZ, colX, colY + 0.044, colZ + 0.01, style.fleeceCollar ? 0.098 : 0.085, 0.078,
      style.fleeceCollar ? MAT.sheepFleece : tunicMat, 14);
    if (style.redTab) {
      for (const sx of [-0.052, 0.052]) {
        b.box(colX + sx, colY + 0.018, colZ + 0.078, 0.035, 0.021, 0.018, MAT.ccpStarRed, lean, sx * 0.38, 0);
      }
    }
    if (isCCP) {
      const [chX, chY, chZ] = spinePt(0.39);
      b.box(chX + 0.095, chY, chZ + 0.135, 0.076, 0.035, 0.010, MAT.ccpStarRed, lean, 0, 0);
      b.box(chX + 0.095, chY, chZ + 0.139, 0.068, 0.027, 0.010, MAT.rocSunWhite, lean, 0, 0);
    }

    for (const h of [0.18, 0.27, 0.36, 0.45]) {
      const [bx, by, bz] = spinePt(h);
      b.ellipsoid(bx, by, bz + 0.136, 0.009, 0.009, 0.008, MAT.brass);
    }
    for (const sx of [-0.104, 0.104]) {
      const [upX, upY, upZ] = spinePt(0.35);
      b.box(upX + sx, upY, upZ + 0.132, 0.080, 0.084, 0.014, isCCP ? MAT.ccpTrim : tunicMat, lean, 0, 0);
    }

    const [wX, wY, wZ] = spinePt(0.11);
    const beltMat = style.gaiters ? MAT.rocWebbing : MAT.leather;
    b.cyl(wX, wY - 0.023, wZ, wX, wY + 0.023, wZ, 0.190, 0.190, beltMat, 16, false);
    b.box(wX, wY, wZ + 0.192, 0.054, 0.048, 0.018, MAT.brass, lean, 0, 0);

    // 越肩闭环贴体背带（严格经过衣领与肩球之间 x=±0.135，全程在胸背曲面外侧，零穿模！）
    const addFullHarnessStrap = (xFront, xShoulder, r, mat) => {
      const pts = [
        [...spinePt(0.11), xFront, 0.186],
        [...spinePt(0.24), (xFront + xShoulder) * 0.5, 0.156],
        [...spinePt(0.41), xShoulder * 0.85, 0.150],
        [...spinePt(0.55), xShoulder, 0.010],
        [...spinePt(0.41), xShoulder, -0.145],
        [...spinePt(0.15), xShoulder * 0.9, -0.175],
      ].map(([px, py, pz, dx, dz]) => [px + dx, py, pz + dz]);
      for (let i = 0; i < pts.length - 1; i++) {
        b.cyl(pts[i][0], pts[i][1], pts[i][2], pts[i + 1][0], pts[i + 1][1], pts[i + 1][2], r, r, mat, 7);
      }
    };

    const [bpX, bpY, bpZ] = spinePt(0.30);
    if (isCCP) {
      addFullHarnessStrap(0.14, -0.135, 0.022, MAT.ccpRation);
      addFullHarnessStrap(-0.14, 0.135, 0.015, MAT.ccpTrim);
      b.box(bpX, bpY, bpZ - 0.205, 0.28, 0.32, 0.12, MAT.ccpTrim, lean, 0, 0);
      for (const sx of [-0.08, 0.08]) b.box(bpX + sx, bpY, bpZ - 0.205, 0.018, 0.33, 0.132, MAT.ccpRation, lean, 0, 0);
      if (!seatedRest) {
        b.cyl(bpX - 0.13, bpY - 0.17, bpZ - 0.21, bpX - 0.13, bpY - 0.07, bpZ - 0.21, 0.042, 0.042, MAT.rocSunWhite, 10);
      }
    } else {
      for (const sx of [-0.132, 0.132]) {
        addFullHarnessStrap(sx * 0.85, sx, 0.015, beltMat);
        b.box(wX + sx * 0.88, wY, wZ + 0.194, 0.088, 0.074, 0.042, beltMat, lean, 0, 0);
      }
      if (style.bambooHat) {
        // 川军标志性背负竹编斗笠
        b.cyl(bpX, bpY + 0.04, bpZ - 0.19, bpX, bpY + 0.04, bpZ - 0.29, 0.26, 0.03, MAT.bambooHat, 16);
      } else {
        b.box(bpX, bpY, bpZ - 0.195, 0.27, 0.30, 0.12, MAT.rocWebbing, lean, 0, 0);
      }
      if (style.saber) {
        // 西北马家军标志性骑兵马刀鞘（斜佩左腰外侧，完全避开左臂摆动区）
        b.cyl(wX + 0.21, wY - 0.02, wZ + 0.06, wX + 0.24, wY - 0.42, wZ - 0.28, 0.018, 0.014, MAT.bluedSteel, 8);
        b.cyl(wX + 0.20, wY + 0.08, wZ + 0.14, wX + 0.21, wY - 0.02, wZ + 0.06, 0.016, 0.022, MAT.brass, 8);
      }
      if (style.gasMaskCan) {
        // 德军标志性后腰圆柱形防毒面具铁筒
        b.cyl(wX - 0.15, wY - 0.06, wZ - 0.22, wX + 0.15, wY - 0.06, wZ - 0.22, 0.055, 0.055, MAT.gerHelm, 12);
      }
      if (style.broadsword) {
        // 中国抗日部队标志性背后斜挎大刀（红绸刀柄）
        b.box(bpX + 0.04, bpY + 0.10, bpZ - 0.27, 0.075, 0.56, 0.018, MAT.brightStl, 0, 0, 0.45);
        b.cyl(bpX + 0.18, bpY + 0.34, bpZ - 0.27, bpX + 0.25, bpY + 0.44, bpZ - 0.27, 0.020, 0.020, MAT.hullRed, 8);
      }
    }

    // ---------- 5. 颈部、面部五官与阵营/地方军阀特色军帽 ----------
    const [nkX, nkY, nkZ] = spinePt(0.58);
    const [hdX, hdY, hdZ] = spinePt(0.71);
    b.cyl(nkX, nkY - 0.03, nkZ, hdX, hdY - 0.06, hdZ, 0.064, 0.056, MAT.skin, 10);
    b.loftRings([
      [hdX, hdY - 0.11, hdZ + 0.02, 0.066, 0.074, 0, 0],
      [hdX, hdY - 0.04, hdZ + 0.01, 0.102, 0.110, 0, 0],
      [hdX, hdY + 0.04, hdZ,        0.112, 0.122, 0, 0],
      [hdX, hdY + 0.11, hdZ - 0.01, 0.100, 0.112, 0, 0],
    ], MAT.skin, 14);
    b.ellipsoid(hdX, hdY + 0.03, hdZ - 0.035, 0.108, 0.094, 0.104, MAT.hairDark);
    for (const sx of [-1, 1]) {
      b.ellipsoid(hdX + sx * 0.110, hdY - 0.01, hdZ + 0.005, 0.017, 0.032, 0.020, MAT.skinShade);
      b.box(hdX + sx * 0.041, hdY + 0.042, hdZ + 0.115, 0.034, 0.008, 0.012, MAT.hairDark, 0, 0, -sx * 0.08);
      b.ellipsoid(hdX + sx * 0.041, hdY + 0.022, hdZ + 0.111, 0.017, 0.011, 0.009, MAT.eyeWhite);
      b.ellipsoid(hdX + sx * 0.041, hdY + 0.022, hdZ + 0.119, 0.008, 0.008, 0.005, MAT.hairDark);
    }
    b.cyl(hdX, hdY + 0.026, hdZ + 0.114, hdX, hdY - 0.022, hdZ + 0.135, 0.011, 0.017, MAT.skin, 7);
    b.box(hdX, hdY - 0.062, hdZ + 0.108, 0.040, 0.010, 0.013, MAT.lip);

    const hg = style.hat;
    if (hg === 'ccp_cap') {
      b.ellipsoid(hdX, hdY + 0.088, hdZ - 0.005, 0.130, 0.080, 0.140, style.nwTowel ? MAT.ccpRation : tunicMat);
      b.cyl(hdX, hdY + 0.048, hdZ - 0.005, hdX, hdY + 0.078, hdZ - 0.005, 0.122, 0.128, tunicMat, 16);
      b.box(hdX, hdY + 0.052, hdZ + 0.134, 0.172, 0.015, 0.086, tunicMat, 0.22, 0, 0);
      b.emblemStar(hdX, hdY + 0.095, hdZ + 0.137, 0.034, 'Z');
    } else if (hg === 'ccp_ushanka') {
      b.ellipsoid(hdX, hdY + 0.095, hdZ - 0.005, 0.140, 0.102, 0.146, MAT.ccpWinter);
      for (const sx of [-0.128, 0.128]) b.box(hdX + sx, hdY + 0.045, hdZ + 0.01, 0.040, 0.115, 0.115, MAT.ccpFur);
      b.box(hdX, hdY + 0.092, hdZ + 0.131, 0.162, 0.082, 0.034, MAT.ccpFur);
      b.emblemStar(hdX, hdY + 0.095, hdZ + 0.151, 0.036, 'Z');
    } else if (hg === 'roc_ma_cap') {
      // 西北二马/新疆：国军青天白日栽绒羊皮军帽
      b.cyl(hdX, hdY + 0.048, hdZ, hdX, hdY + 0.134, hdZ + 0.01, 0.124, 0.130, tunicMat, 16);
      b.cyl(hdX, hdY + 0.042, hdZ, hdX, hdY + 0.082, hdZ, 0.136, 0.136, MAT.sheepFleece, 16);
      b.box(hdX, hdY + 0.048, hdZ + 0.140, 0.170, 0.015, 0.088, MAT.leatherDark, 0.20, 0, 0);
      b.emblemSun(hdX, hdY + 0.114, hdZ + 0.134, 0.028, 'Z');
    } else if (hg === 'roc_adrian') {
      // 滇军标志性法式亚德里安纵向帽脊钢盔 + 青天白日徽
      b.ellipsoid(hdX, hdY + 0.056, hdZ - 0.006, 0.146, 0.122, 0.158, MAT.rocAdrian, Math.PI * 0.58);
      b.cyl(hdX, hdY + 0.038, hdZ - 0.006, hdX, hdY + 0.050, hdZ - 0.006, 0.168, 0.148, MAT.rocAdrian, 16);
      b.box(hdX, hdY + 0.162, hdZ - 0.01, 0.038, 0.044, 0.20, MAT.rocAdrian); // 亚德里安顶部纵向盔脊
      b.emblemSun(hdX, hdY + 0.096, hdZ + 0.146, 0.029, 'Z');
    } else if (hg === 'roc_tibet') {
      // 藏军宽檐毛呢军帽 + 帽徽
      b.ellipsoid(hdX, hdY + 0.068, hdZ, 0.128, 0.096, 0.134, MAT.rocKhaki, Math.PI * 0.58);
      b.cyl(hdX, hdY + 0.046, hdZ, hdX, hdY + 0.058, hdZ, 0.175, 0.165, MAT.rocKhaki, 16);
      b.emblemSun(hdX, hdY + 0.095, hdZ + 0.132, 0.026, 'Z');
    } else if (hg === 'usa_m1') {
      // 美军 M1 钢盔（橄榄绿+网罩+额前白色士官条）
      b.ellipsoid(hdX, hdY + 0.054, hdZ - 0.008, 0.150, 0.128, 0.162, MAT.rocHelmM1, Math.PI * 0.58);
      b.cyl(hdX, hdY + 0.036, hdZ - 0.008, hdX, hdY + 0.052, hdZ - 0.008, 0.162, 0.152, MAT.rocHelmM1, 16);
      b.box(hdX, hdY + 0.102, hdZ + 0.148, 0.052, 0.016, 0.010, MAT.eyeWhite);
    } else if (hg === 'ussr_ssh40') {
      // 苏联红军/人民军 SSh-40 圆顶宽檐钢盔 + 正面红五角星
      b.ellipsoid(hdX, hdY + 0.056, hdZ - 0.006, 0.152, 0.126, 0.162, MAT.ussrHelm, Math.PI * 0.58);
      b.cyl(hdX, hdY + 0.034, hdZ - 0.006, hdX, hdY + 0.050, hdZ - 0.006, 0.172, 0.154, MAT.ussrHelm, 16);
      b.emblemStar(hdX, hdY + 0.098, hdZ + 0.152, 0.034, 'Z');
    } else if (hg === 'uk_brodie') {
      // 英军标志性宽边飞碟型布罗迪钢盔（Brodie Mk.II 托米盔）
      b.ellipsoid(hdX, hdY + 0.068, hdZ, 0.140, 0.088, 0.144, MAT.ukBrodie, Math.PI * 0.55);
      b.cyl(hdX, hdY + 0.048, hdZ, hdX, hdY + 0.064, hdZ, 0.228, 0.214, MAT.ukBrodie, 18);
    } else if (hg === 'fra_adrian') {
      // 法军标志性 M26 亚德里安钢盔（顶部厚实纵向防弹脊 + RF 金盾徽）
      b.ellipsoid(hdX, hdY + 0.056, hdZ - 0.006, 0.148, 0.122, 0.160, MAT.fraAdrian, Math.PI * 0.58);
      b.cyl(hdX, hdY + 0.038, hdZ - 0.006, hdX, hdY + 0.050, hdZ - 0.006, 0.174, 0.150, MAT.fraAdrian, 16);
      b.box(hdX, hdY + 0.164, hdZ - 0.01, 0.040, 0.046, 0.21, MAT.fraAdrian);
      b.cyl(hdX, hdY + 0.096, hdZ + 0.148, hdX, hdY + 0.096, hdZ + 0.156, 0.026, 0.026, MAT.brass, 10);
    } else if (hg === 'jpn_helm') {
      // 日军九〇式钢盔 + 正面五角金星 + 标志性脑后及两侧防晒护颈垂布（“屁帘”）
      b.ellipsoid(hdX, hdY + 0.056, hdZ - 0.006, 0.148, 0.120, 0.156, MAT.jpnHelm, Math.PI * 0.58);
      b.cyl(hdX, hdY + 0.036, hdZ - 0.006, hdX, hdY + 0.050, hdZ - 0.006, 0.160, 0.148, MAT.jpnHelm, 16);
      b.cyl(hdX, hdY + 0.096, hdZ + 0.146, hdX, hdY + 0.096, hdZ + 0.154, 0.024, 0.024, MAT.brass, 5);
      for (const sx of [-0.11, 0, 0.11]) {
        b.box(hdX + sx, hdY - 0.04, hdZ - 0.132, 0.085, 0.14, 0.016, MAT.jpnKhaki);
      }
    } else if (hg === 'ger_m35') {
      // 德军标志性深护颈外扩 M35/M42 钢盔（原野深灰+护耳折边）
      b.ellipsoid(hdX, hdY + 0.052, hdZ - 0.008, 0.150, 0.128, 0.162, MAT.gerHelm, Math.PI * 0.58);
      b.cyl(hdX, hdY + 0.034, hdZ - 0.008, hdX, hdY + 0.052, hdZ - 0.008, 0.164, 0.152, MAT.gerHelm, 16);
      b.box(hdX, hdY + 0.018, hdZ - 0.048, 0.320, 0.052, 0.195, MAT.gerHelm);
    } else if (hg === 'roc_cap') {
      b.cyl(hdX, hdY + 0.048, hdZ, hdX, hdY + 0.136, hdZ + 0.012, 0.122, 0.128, tunicMat, 18);
      b.cyl(hdX, hdY + 0.050, hdZ, hdX, hdY + 0.095, hdZ + 0.005, 0.130, 0.132, tunicMat, 18);
      b.box(hdX, hdY + 0.050, hdZ + 0.140, 0.170, 0.015, 0.090, tunicMat, 0.20, 0, 0);
      b.emblemSun(hdX, hdY + 0.116, hdZ + 0.134, 0.027, 'Z');
    } else {
      const hMat = hg === 'roc_m1' ? MAT.rocHelmM1 : MAT.rocHelmM35;
      b.ellipsoid(hdX, hdY + 0.052, hdZ - 0.008, 0.148, 0.126, 0.160, hMat, Math.PI * 0.58);
      b.cyl(hdX, hdY + 0.036, hdZ - 0.008, hdX, hdY + 0.052, hdZ - 0.008, 0.160, 0.150, hMat, 16);
      if (hg === 'roc_m35') b.box(hdX, hdY + 0.025, hdZ - 0.045, 0.310, 0.040, 0.18, hMat);
      b.emblemSun(hdX, hdY + 0.095, hdZ + 0.145, 0.030, 'Z');
    }

    // ---------- 6. 双臂解析 IK 与武器/铁锹/搪瓷缸无穿模握持 ----------
    const [shBaseX, shBaseY, shBaseZ] = spinePt(0.47);
    const shL = [shBaseX + 0.228, shBaseY, shBaseZ];
    const shR = [shBaseX - 0.228, shBaseY, shBaseZ];
    for (const sh of [shL, shR]) b.ellipsoid(sh[0], sh[1], sh[2], 0.072, 0.074, 0.072, tunicMat);

    let targetL = leftTarget, targetR = rightTarget, triggerMode = false, fingerCurl = 0.88;

    if (!targetL && !targetR) {
      if (seatedRest) {
        // 右手端白搪瓷缸饮水，左手自然搭于左膝上方
        const sip = Math.sin(phase * 1.5) * 0.04;
        const mugPos = [ox - 0.08, shBaseY - 0.08 + sip, shBaseZ + 0.26];
        b.cyl(mugPos[0], mugPos[1] - 0.05, mugPos[2], mugPos[0], mugPos[1] + 0.05, mugPos[2], 0.044, 0.044, MAT.rocSunWhite, 12);
        b.cyl(mugPos[0], mugPos[1] + 0.04, mugPos[2], mugPos[0], mugPos[1] + 0.052, mugPos[2], 0.046, 0.046, MAT.ccpStarRed, 12);
        targetR = [mugPos[0] - 0.05, mugPos[1] - 0.01, mugPos[2] - 0.02];
        targetL = [ox + 0.24, oy + 0.49, baseZ + 0.28];
        fingerCurl = 0.72;
      } else if (digShovel) {
        addOrientedFirearm(b, gunId, [bpX + 0.04, bpY - 0.05, bpZ - 0.30], -1.05, 0.32, 0.55, false, -1);
        const t = digShovel.t, scoop = Math.sin(t * Math.PI);
        const bladePos = [ox + 0.02, oy + 0.06 + digShovel.fling * 0.34, baseZ + 0.60 + scoop * 0.12];
        const handleTop = [ox - 0.18, pelvisY + 0.22 - scoop * 0.10 + digShovel.fling * 0.14, baseZ + 0.24];
        b.cyl(handleTop[0], handleTop[1], handleTop[2], bladePos[0], bladePos[1], bladePos[2], 0.017, 0.016, MAT.woodLight, 8);
        b.cyl(handleTop[0] - 0.055, handleTop[1], handleTop[2], handleTop[0] + 0.055, handleTop[1], handleTop[2], 0.015, 0.015, MAT.woodWalnut, 8);
        b.box(bladePos[0], bladePos[1], bladePos[2] + 0.06, 0.16, 0.020, 0.20, MAT.gunmetal, 0.35 - digShovel.fling * 0.6, 0, 0);
        if (t > 0.18 && t < 0.85) b.ellipsoid(bladePos[0], bladePos[1] + 0.045, bladePos[2] + 0.07, 0.080, 0.050, 0.080, MAT.earthSoil);
        if (digShovel.fling > 0.05) {
          const f = digShovel.fling;
          for (let k = 0; k < 4; k++) {
            b.ellipsoid(ox + (k - 1.5) * 0.07, oy + 0.36 + Math.sin(f * Math.PI) * 0.28, baseZ + 0.66 + f * 0.30, 0.035, 0.026, 0.032, MAT.earthSoil);
          }
        }
        targetR = [handleTop[0] - 0.02, handleTop[1] + 0.02, handleTop[2]];
        targetL = [handleTop[0] * 0.42 + bladePos[0] * 0.58 + 0.02, handleTop[1] * 0.42 + bladePos[1] * 0.58 + 0.02, handleTop[2] * 0.42 + bladePos[2] * 0.58];
      } else if (gunMode === 'shoulder_march') {
        addOrientedFirearm(b, gunId, [shR[0] - 0.02, shR[1] + 0.09, shR[2] + 0.16], -0.96, 0.04, 0.58, false, -1);
        targetR = [shR[0] - 0.04, shR[1] - 0.23, shR[2] + 0.24];
        const armSwing = -stride * 0.82;
        targetL = [shL[0] + 0.06, pelvisY + 0.05 + Math.abs(armSwing) * 0.06, baseZ + Math.sin(armSwing) * 0.24];
        fingerCurl = 0.65;
      } else if (gunMode === 'aim_fire' || gunMode === 'aim_siege' || gunMode === 'aim_ambush') {
        const kick = flash ? -0.028 : 0;
        const aimPitch = gunMode === 'aim_siege' ? -0.18 : -0.02;
        const aimYaw = mounted ? -0.26 : gunMode === 'aim_ambush' ? 0.28 : 0.04;
        const g = addOrientedFirearm(b, gunId, [shR[0] + 0.05, shR[1] - 0.01, shR[2] + 0.48 + kick], aimPitch, aimYaw, 0.60, flash, ejectT);
        targetR = g.grip;
        targetL = g.forend;
        triggerMode = true;
      } else {
        const pitch = mounted ? -0.42 : gunMode === 'charge' ? -0.20 : -0.34;
        const yaw = mounted ? -0.50 : gunMode === 'charge' ? -0.24 : -0.50;
        const g = addOrientedFirearm(b, gunId, [ox - 0.07, shBaseY - 0.13, shBaseZ + 0.34], pitch, yaw, 0.60, flash, ejectT);
        targetR = g.grip;
        targetL = g.forend;
        triggerMode = true;
      }
    }

    for (const [sh, tgt, sgn] of [[shL, targetL, 1], [shR, targetR, -1]]) {
      const ik = solveIK(sh, tgt, 0.27, 0.25, [sgn * 0.68, -0.62, -0.45]);
      b.cyl(sh[0], sh[1], sh[2], ik.elbow[0], ik.elbow[1], ik.elbow[2], 0.066, 0.056, tunicMat, 10);
      b.ellipsoid(ik.elbow[0], ik.elbow[1], ik.elbow[2], 0.055, 0.055, 0.055, tunicMat);
      b.cyl(ik.elbow[0], ik.elbow[1], ik.elbow[2], ik.wrist[0], ik.wrist[1], ik.wrist[2], 0.054, 0.044, tunicMat, 10);
      const fDir = vNorm(vSub(ik.wrist, ik.elbow));
      const cuffStart = vSub(ik.wrist, vScale(fDir, 0.036));
      b.cyl(cuffStart[0], cuffStart[1], cuffStart[2], ik.wrist[0], ik.wrist[1], ik.wrist[2], 0.048, 0.046, isCCP ? MAT.ccpTrim : tunicMat, 10);
      b.hand(ik.wrist, fDir, sgn, fingerCurl, triggerMode);
    }
  }

  // ==================== 精细主力护卫/轻巡洋军舰建模（彻底消除粗糙感） ====================
  function buildWarship(b, side = 'roc', action = 'idle', phase = 0) {
    const isMoving = action === 'march' || action === 'move' || action === 'advance' || action === 'attack';
    const isFiring = action === 'fire' || action === 'attack' || action === 'advance' || action === 'bombard';
    const firePulse = isFiring ? (phase * 0.9) % 1.0 : -1;

    // 9 段流线船体型线：[z, yKeel, yDeck, halfBeam, flare]（长首楼飞剪舰首 + 方尾）
    const hullSections = [
      [-1.62, 0.05, 0.38, 0.20, 1.05], // 方尾封板
      [-1.30, 0.02, 0.39, 0.28, 1.06],
      [-0.80, 0.01, 0.40, 0.33, 1.08],
      [-0.20, 0.01, 0.41, 0.35, 1.10], // 舯部最大船宽
      [ 0.35, 0.01, 0.43, 0.34, 1.14],
      [ 0.42, 0.01, 0.50, 0.33, 1.18], // 长首楼抬升折角
      [ 0.95, 0.02, 0.52, 0.25, 1.28],
      [ 1.42, 0.04, 0.56, 0.12, 1.42],
      [ 1.74, 0.10, 0.61, 0.012, 1.50], // 锋利前倾飞剪舰首 (Clipper Bow)
    ];

    // 分三层绘制船壳：舰底防锈氧化铁红 + 黑色水线带 + 海灰干舷与柚木主甲板
    b.loftHullZ(hullSections, MAT.hullRed, 0.00, 0.14);
    b.loftHullZ(hullSections, MAT.rubber, 0.135, 0.185);
    b.loftHullZ(hullSections, MAT.navalGrey, 0.18, 0.70);

    // 舰首双锚链孔、海军霍尔锚、锚机与首尾旗杆
    for (const sx of [-1, 1]) {
      b.cyl(sx * 0.13, 0.42, 1.44, sx * 0.16, 0.30, 1.46, 0.028, 0.022, MAT.gunmetal, 8);
      b.box(sx * 0.165, 0.30, 1.46, 0.018, 0.085, 0.055, MAT.armorDark, 0.25, sx * 0.22, 0);
      // 舷侧成排铜框舷窗 (Portholes)
      for (let pz = -1.15; pz <= 0.95; pz += 0.26) {
        const beam = pz > 0.4 ? 0.28 : 0.34;
        const py = pz > 0.4 ? 0.38 : 0.30;
        b.cyl(sx * (beam - 0.01), py, pz, sx * (beam + 0.012), py, pz, 0.018, 0.018, MAT.glass, 8);
      }
    }
    b.cyl(0, 0.52, 1.32, 0, 0.57, 1.32, 0.045, 0.038, MAT.gunmetal, 10); // 电动起锚绞盘
    b.cyl(0, 0.60, 1.70, 0, 0.86, 1.72, 0.010, 0.006, MAT.brightStl, 6); // 舰首旗杆
    b.cyl(0, 0.38, -1.58, 0, 0.72, -1.64, 0.011, 0.007, MAT.brightStl, 6); // 舰尾旗杆

    // 上层建筑群：首楼甲板室 -> 罗经舰桥（带左右防空瞭望翼桥） -> 顶层主炮射击指挥仪与测距仪
    b.box(0, 0.56, 0.24, 0.44, 0.20, 0.76, MAT.navalGrey);
    b.box(0, 0.73, 0.34, 0.34, 0.18, 0.44, MAT.navalLight);
    // 左右延伸舰桥翼台 (Bridge Wings)
    b.box(0, 0.75, 0.40, 0.58, 0.08, 0.16, MAT.navalLight);
    // 装甲驾驶室长条观察窗
    b.box(0, 0.77, 0.565, 0.30, 0.052, 0.024, MAT.glass);
    // 舰桥两侧鲜明阵营徽章（青天白日 / 红五星）
    if (side === 'ccp') {
      b.emblemStar(0.23, 0.58, 0.30, 0.062, 'X');
      b.emblemStar(-0.23, 0.58, 0.30, 0.062, '-X');
    } else {
      b.emblemSun(0.23, 0.58, 0.30, 0.060, 'X');
      b.emblemSun(-0.23, 0.58, 0.30, 0.060, '-X');
    }
    // 舰桥顶主炮光学测距指挥塔 (Fire-Control Director)
    b.cyl(0, 0.82, 0.36, 0, 0.96, 0.36, 0.085, 0.075, MAT.navalGrey, 12);
    b.cyl(-0.14, 0.93, 0.36, 0.14, 0.93, 0.36, 0.024, 0.024, MAT.gunmetal, 8); // 横向基线光学测距仪

    // 三脚桁架前主桅 + 横桁信号架 + 警戒雷达网 + 后信号副桅
    b.cyl(0, 0.82, 0.22, 0, 1.56, 0.16, 0.022, 0.011, MAT.gunmetal, 8);
    for (const sx of [-0.14, 0.14]) {
      b.cyl(sx, 0.66, 0.12, 0, 1.32, 0.17, 0.015, 0.010, MAT.gunmetal, 6); // 三脚桅斜撑腿
    }
    b.box(0, 1.34, 0.17, 0.46, 0.020, 0.020, MAT.gunmetal); // 主横桁
    b.box(0, 1.58, 0.16, 0.22, 0.09, 0.024, MAT.brightStl, 0, phase * 1.6, 0); // 旋转对海对空搜索雷达天线
    b.cyl(0, 0.52, -0.70, 0, 1.24, -0.78, 0.018, 0.009, MAT.gunmetal, 8); // 后主桅
    b.box(0, 1.06, -0.76, 0.30, 0.016, 0.016, MAT.gunmetal);

    // 前后双后掠椭圆柱烟囱（带黑色防熏烟囱帽与航行蒸汽烟羽）
    for (const [fz, rScale] of [[0.00, 1.0], [-0.38, 0.92]]) {
      b.cyl(0, 0.62, fz, 0, 1.08, fz - 0.09, 0.105 * rScale, 0.092 * rScale, MAT.navalGrey, 14);
      b.cyl(0, 1.02, fz - 0.08, 0, 1.11, fz - 0.095, 0.096 * rScale, 0.092 * rScale, MAT.rubber, 14); // 黑色烟囱顶帽
      if (isMoving) {
        for (let p = 0; p < 3; p++) {
          const pt = ((phase * 0.7 + p * 0.33) % 1.0);
          b.ellipsoid(0, 1.15 + pt * 0.26, fz - 0.14 - pt * 0.45, 0.06 + pt * 0.09, 0.05 + pt * 0.07, 0.07 + pt * 0.10, MAT.smokeGrey);
        }
      }
    }

    // 舯部四联装鱼雷发射管、两舷救生鲸鱼艇与四座双联高射机关炮座
    b.box(0, 0.46, -0.20, 0.32, 0.12, 0.68, MAT.navalGrey);
    b.cyl(0, 0.52, -0.56, 0, 0.58, -0.56, 0.08, 0.08, MAT.armorDark, 10);
    for (const tx of [-0.045, -0.015, 0.015, 0.045]) {
      b.cyl(tx, 0.58, -0.70, tx, 0.58, -0.42, 0.016, 0.016, MAT.gunmetal, 8); // 四联鱼雷管
    }
    for (const sx of [-1, 1]) {
      // 两舷吊艇架与白色救生艇 (Whaleboats)
      b.ellipsoid(sx * 0.27, 0.58, -0.16, 0.055, 0.048, 0.19, MAT.rocSunWhite);
      b.ellipsoid(sx * 0.27, 0.60, -0.16, 0.042, 0.030, 0.15, MAT.woodLight);
      // 艇架、舷梯与甲板栏杆：作为地图用的通用舰艇示意。
      for (const z of [-0.32, 0.00]) {
        b.cyl(sx * 0.20, 0.50, z, sx * 0.30, 0.76, z, 0.009, 0.007, MAT.gunmetal, 7);
        b.cyl(sx * 0.30, 0.76, z, sx * 0.34, 0.70, z, 0.007, 0.006, MAT.gunmetal, 7);
      }
      for (let z = -1.35; z <= 1.15; z += 0.22) {
        const edge = z > 0.42 ? Math.max(0.13, 0.30 - (z - 0.42) * 0.15) : z < -1.1 ? 0.25 : 0.31;
        const deck = z > 0.42 ? 0.53 : 0.42;
        b.cyl(sx * edge, deck, z, sx * edge, deck + 0.10, z, 0.005, 0.005, MAT.brightStl, 6);
      }
      b.cyl(sx * 0.31, 0.52, -1.1, sx * 0.31, 0.52, 0.40, 0.005, 0.005, MAT.brightStl, 6);
      for (let step = 0; step < 4; step++) b.box(sx * 0.23, 0.48 + step * 0.055, 0.48, 0.018, 0.012, 0.11, MAT.gunmetal);
      // 4 座防空高炮巢 (AA Tubs)
      for (const az of [0.16, -0.52]) {
        b.cyl(sx * 0.24, 0.46, az, sx * 0.24, 0.55, az, 0.068, 0.072, MAT.navalLight, 10);
        b.cyl(sx * 0.24, 0.55, az, sx * 0.34, 0.65, az + 0.06, 0.012, 0.009, MAT.bluedSteel, 6);
      }
    }

    // A、B 背负式前双联装主炮塔 + X 舰尾双联装主炮塔（带白色防水炮衣与齐射火光）
    b.cyl(0, 0.50, 0.72, 0, 0.64, 0.72, 0.15, 0.14, MAT.navalGrey, 14); // B 炮塔高炮座
    const turrets = [
      [1.10, 0.52, 1, 0],   // A 舰首主炮塔
      [0.72, 0.64, 1, 0.2], // B 背负超射主炮塔
      [-1.12, 0.40, -1, 0.5], // X 舰尾主炮塔
    ];
    for (const [tz, ty, dir, delay] of turrets) {
      // 多面倾斜装甲炮塔室
      b.extrudeX(0, 0.135, [
        [ty, tz - dir * 0.15],
        [ty + 0.13, tz - dir * 0.13],
        [ty + 0.13, tz + dir * 0.09],
        [ty + 0.04, tz + dir * 0.17],
        [ty, tz + dir * 0.14],
      ], MAT.navalLight);
      for (const bx of [-0.046, 0.046]) {
        b.ellipsoid(bx, ty + 0.068, tz + dir * 0.15, 0.028, 0.026, 0.036, MAT.blastBag); // 防水帆布炮衣
        b.cyl(bx, ty + 0.068, tz + dir * 0.16, bx, ty + 0.092, tz + dir * 0.54, 0.020, 0.015, MAT.gunmetal, 10);
      }
      if (isFiring && dir > 0 && ((firePulse + delay) % 1.0) < 0.35) {
        const bt = ((firePulse + delay) % 1.0) / 0.35;
        b.ellipsoid(0, ty + 0.095, tz + 0.62, 0.10 * (1 - bt * 0.3), 0.10 * (1 - bt * 0.3), 0.20, MAT.flameCore);
        b.ellipsoid(0, ty + 0.095, tz + 0.56, 0.16, 0.07, 0.10, MAT.flameOuter);
      }
    }

    // 舰尾深水炸弹投放架与破浪白沫航迹
    for (const sx of [-0.09, 0.09]) b.box(sx, 0.41, -1.52, 0.05, 0.05, 0.14, MAT.armorDark);
    if (isMoving) {
      for (let w = 0; w < 6; w++) {
        const wt = ((phase * 0.85 + w * 0.16) % 1.0);
        for (const sx of [-1, 1]) {
          b.ellipsoid(sx * (0.08 + wt * 0.48), 0.03, 1.66 - wt * 2.1, 0.08, 0.026, 0.15, MAT.waterFoam);
        }
      }
    }
  }

  // ==================== 大地图火炮、坦克与飞机建模 ====================
  function buildMapArtillery(b, side = 'ccp', action = 'idle', phase = 0) {
    const gMat = side === 'ccp' ? MAT.armorSov : MAT.rocUSJacket;
    const isMarch = action === 'march' || action === 'move';
    const isFire = action === 'fire' || action === 'advance' || action === 'siege';
    const spin = isMarch ? phase * 3.2 : 0;
    const recoil = isFire && (phase % 1.0) < 0.3 ? Math.sin(((phase % 1.0) / 0.3) * Math.PI) * 0.18 : 0;

    b.wheelX(-0.48, 0.36, 0.08, 0.36, 0.13, MAT.rubber, gMat, spin);
    b.wheelX(0.48, 0.36, 0.08, 0.36, 0.13, MAT.rubber, gMat, spin);
    b.cyl(-0.46, 0.36, 0.08, 0.46, 0.36, 0.08, 0.055, 0.055, MAT.armorDark, 10);
    for (const sx of [-1, 1]) {
      b.cyl(sx * 0.20, 0.36, -0.02, sx * 0.54, 0.08, -1.25, 0.052, 0.040, gMat, 8);
      b.box(sx * 0.54, 0.09, -1.30, 0.20, 0.14, 0.14, MAT.armorDark);
    }
    b.box(0, 0.64, 0.20, 0.86, 0.66, 0.042, gMat, -0.24, 0, 0);
    if (side === 'ccp') b.emblemStar(-0.26, 0.76, 0.24, 0.068, 'Z');
    else b.emblemSun(-0.26, 0.76, 0.24, 0.064, 'Z');
    b.cyl(0, 0.60, -0.16 - recoil, 0, 0.82, 1.12 - recoil, 0.070, 0.058, MAT.gunmetal, 14);
    b.cyl(0, 0.73, -0.08, 0, 0.90, 0.66, 0.044, 0.040, MAT.brightStl, 10);
    if (recoil > 0.05) {
      b.ellipsoid(0, 0.84, 1.24, 0.14, 0.14, 0.26, MAT.flameCore);
    }
  }

  function buildMapTank(b, side = 'ccp', action = 'idle', phase = 0) {
    const mat = side === 'ccp' ? MAT.armorSov : MAT.rocUSJacket;
    const isMarch = action === 'march' || action === 'move' || action === 'advance';
    const isFire = action === 'fire' || action === 'advance';
    const spin = isMarch ? phase * 4.0 : 0;
    const bob = isMarch ? Math.sin(phase * 3.2) * 0.02 : 0;
    const recoil = isFire && (phase % 1.0) < 0.28 ? 0.14 : 0;

    for (const sx of [-1, 1]) {
      const x = sx * 0.66;
      b.box(x, 0.34 + bob, 0, 0.25, 0.46, 1.96, MAT.rubber);
      for (let i = 0; i < 5; i++) {
        b.wheelX(x + sx * 0.02, 0.24 + bob, -0.76 + i * 0.38, 0.20, 0.23, MAT.rubber, mat, spin);
      }
      b.box(x, 0.61 + bob, 0, 0.27, 0.036, 2.06, mat);
    }
    b.extrudeX(0, 0.54, [
      [0.29 + bob, -0.98], [0.71 + bob, -1.02], [0.75 + bob, -0.76],
      [0.75 + bob, 0.64], [0.48 + bob, 1.06], [0.29 + bob, 0.86],
    ], mat);
    if (side === 'ccp') {
      b.ellipsoid(0, 0.96 + bob, 0.08, 0.46, 0.24, 0.56, mat, Math.PI * 0.75);
      b.emblemStar(0.47, 0.96 + bob, 0.08, 0.082, 'X');
      b.emblemStar(-0.47, 0.96 + bob, 0.08, 0.082, '-X');
    } else {
      b.ellipsoid(0, 0.98 + bob, 0.02, 0.45, 0.25, 0.48, mat, Math.PI * 0.72);
      b.emblemSun(0.46, 0.98 + bob, 0.02, 0.078, 'X');
      b.emblemSun(-0.46, 0.98 + bob, 0.02, 0.078, '-X');
    }
    b.cyl(0, 0.97 + bob, 0.30, 0, 0.98 + bob, 1.56 - recoil, 0.056, 0.044, MAT.gunmetal, 12);
    if (recoil > 0) b.ellipsoid(0, 0.98 + bob, 1.68, 0.14, 0.14, 0.26, MAT.flameCore);
  }

  function buildMapAircraft(b, side = 'roc', action = 'idle', phase = 0) {
    const bodyMat = side === 'ccp' ? MAT.armorSov : MAT.rocUSJacket;
    const wingMat = side === 'ccp' ? MAT.ccpTunic : MAT.rocKhaki;
    // 尚无整机骨架：保持部件同一姿态，避免机翼、尾翼与徽记随动画分离。
    const bank = 0;
    b.ellipsoid(0, 0.84, 0, 0.22, 0.24, 1.22, bodyMat, Math.PI, 0, 0, bank);
    b.ellipsoid(0, 1.04, 0.08, 0.15, 0.16, 0.38, MAT.glass, Math.PI * 0.65, 0, 0, bank);
    b.box(0, 0.80, 0.12, 2.72, 0.07, 0.52, wingMat, 0, 0, bank);
    for (const wx of [-0.94, 0.94]) {
      if (side === 'ccp') b.emblemStar(wx, 0.845, 0.12, 0.15, 'Y');
      else {
        b.cyl(wx, 0.835, 0.12, wx, 0.848, 0.12, 0.16, 0.16, MAT.rocBlue, 14);
        b.cyl(wx, 0.848, 0.12, wx, 0.856, 0.12, 0.09, 0.09, MAT.rocSunWhite, 10);
      }
    }
    b.box(0, 0.90, -1.02, 1.02, 0.05, 0.28, bodyMat);
    b.box(0, 1.12, -1.04, 0.06, 0.44, 0.34, bodyMat);
    b.ellipsoid(0, 0.84, 1.24, 0.14, 0.14, 0.18, MAT.ccpStarRed);
    const pAng = phase * 10 + 0.4;
    for (let i = 0; i < 3; i++) {
      const a = pAng + (i * Math.PI * 2) / 3;
      b.box(Math.cos(a) * 0.42, 0.84 + Math.sin(a) * 0.42, 1.18, 0.08, 0.74, 0.024, MAT.armorDark, 0, 0, a - Math.PI * 0.5);
    }
  }

  function buildCarrier(b, side, action = 'idle', phase = 0) {
    const bob = action === 'march' ? Math.sin(phase) * 0.022 : 0;
    // 加大型埃塞克斯/中途岛级舰队航空母舰（全长 4.20，显著大于战列舰，严格分层杜绝船首/甲板/舰岛穿模）
    const sections = [
      [-2.05, 0.04, 0.45, 0.30, 1.04],
      [-1.55, 0.02, 0.46, 0.42, 1.08],
      [-0.85, 0.01, 0.47, 0.49, 1.12],
      [ 0.00, 0.01, 0.47, 0.50, 1.12],
      [ 0.85, 0.01, 0.47, 0.46, 1.16],
      [ 1.45, 0.02, 0.47, 0.34, 1.24],
      [ 1.90, 0.05, 0.47, 0.17, 1.32],
      [ 2.15, 0.11, 0.47, 0.05, 1.38],
    ];
    // 严格分段垂直分层：船底(0..0.14) -> 水线(0.14..0.19) -> 船舷(0.19..0.47，严格低于飞行甲板底面0.53)
    b.loftHullZ(sections, MAT.hullRed, 0.00, 0.14);
    b.loftHullZ(sections, MAT.rubber, 0.14, 0.19);
    b.loftHullZ(sections, MAT.navalGrey, 0.19, 0.47);

    // 机库层与甲板下支撑（y = 0.47 .. 0.53，内收不穿出船舷）
    b.box(0, 0.50 + bob, -0.02, 0.88, 0.06, 3.40, MAT.armorDark);
    // 宽大直通装甲飞行甲板（y = 0.53 .. 0.61，顶面严格在 0.61）
    b.box(0, 0.57 + bob, 0.02, 1.18, 0.08, 3.96, MAT.deckDark);
    b.box(0, 0.614 + bob, 0.02, 1.10, 0.008, 3.82, MAT.deckTeak);

    // 飞行甲板标线（严格浮于 y = 0.622，与甲板拉开 0.004 间隙零 Z-fighting）
    b.box(-0.10, 0.622 + bob, 0.02, 0.036, 0.006, 3.62, MAT.eyeWhite); // 主跑道中线
    b.box(-0.34, 0.622 + bob, 1.24, 0.020, 0.006, 0.92, MAT.gunmetal); // 左舷蒸汽弹射轨
    b.box( 0.08, 0.622 + bob, 1.24, 0.020, 0.006, 0.92, MAT.gunmetal); // 右舷蒸汽弹射轨
    for (const z of [-1.62, -1.46, -1.30, -1.14, -0.98]) {
      b.box(-0.10, 0.622 + bob, z, 0.72, 0.006, 0.012, MAT.rubber); // 5道阻拦索
    }
    b.box(-0.10, 0.621 + bob, 0.20, 0.40, 0.006, 0.40, MAT.armorDark); // 舯部主升降机
    b.box(-0.62, 0.58 + bob, -0.10, 0.14, 0.03, 0.44, MAT.navalLight); // 左舷舷侧外悬升降机

    // 右舷大型埃塞克斯级舰岛（严格坐落于 x = +0.46, z = -0.44..+0.44, y >= 0.62，与前后炮塔分离不穿模）
    b.box(0.46, 0.82 + bob, 0.00, 0.22, 0.40, 0.88, MAT.navalLight);
    b.box(0.46, 1.09 + bob, 0.20, 0.20, 0.16, 0.36, MAT.navalGrey); // 航海舰桥
    b.box(0.46, 1.13 + bob, 0.385, 0.17, 0.06, 0.02, MAT.glass);    // 舰桥防弹玻璃窗
    b.box(0.46, 1.12 + bob, -0.18, 0.16, 0.38, 0.34, MAT.navalGrey); // 大倾角扁长烟囱
    b.box(0.46, 1.335 + bob, -0.18, 0.17, 0.05, 0.35, MAT.rubber);   // 烟囱黑顶帽
    b.cyl(0.46, 1.17 + bob, 0.16, 0.46, 1.72 + bob, 0.12, 0.024, 0.012, MAT.brightStl, 8); // 主桅杆
    b.cyl(0.46, 1.17 + bob, 0.28, 0.46, 1.54 + bob, 0.14, 0.012, 0.008, MAT.brightStl, 6); // 撑杆
    b.box(0.46, 1.62 + bob, 0.13, 0.34, 0.15, 0.036, MAT.brass); // SK-2 大型对空网格雷达

    // 舰岛前后 4 座双联装 127mm Mk.12 高平两用炮塔（z = +0.62/+0.80 与 -0.62/-0.80，严格避开舰岛区间）
    for (const z of [0.62, 0.80, -0.62, -0.80]) {
      const dir = z > 0 ? 1 : -1;
      b.box(0.45, 0.675 + bob, z, 0.14, 0.11, 0.14, MAT.navalLight);
      b.cyl(0.43, 0.70 + bob, z + dir * 0.06, 0.43, 0.75 + bob, z + dir * 0.24, 0.014, 0.011, MAT.gunmetal, 6);
      b.cyl(0.47, 0.70 + bob, z + dir * 0.06, 0.47, 0.75 + bob, z + dir * 0.24, 0.014, 0.011, MAT.gunmetal, 6);
    }
    // 两舷 40mm 博福斯四联高炮防空平台（外悬于 x = ±0.64, y = 0.50，与飞行甲板无交叠）
    for (const z of [-1.45, -0.65, 0.55, 1.42]) {
      b.box(-0.64, 0.50 + bob, z, 0.12, 0.07, 0.22, MAT.gunmetal);
      b.box( 0.64, 0.50 + bob, z, 0.12, 0.07, 0.22, MAT.gunmetal);
    }
    // 飞行甲板列阵停放 6 架精细舰载机（F4U/F9F 涂装，严格离甲板 0.05 留起落架间隙，零穿模！）
    const deckPlanes = [
      [-0.36, -1.36], [-0.08, -1.10], [-0.36, -0.78],
      [-0.08, -0.44], [-0.34,  0.58], [ 0.08,  1.45],
    ];
    for (const [px, pz] of deckPlanes) {
      b.cyl(px, 0.665 + bob, pz - 0.16, px, 0.675 + bob, pz + 0.16, 0.032, 0.025, MAT.navalGrey, 8);
      b.box(px, 0.668 + bob, pz + 0.02, 0.36, 0.018, 0.085, MAT.navalLight);
      b.box(px, 0.715 + bob, pz - 0.13, 0.11, 0.06, 0.028, MAT.navalLight);
      b.box(px, 0.675 + bob, pz + 0.17, 0.095, 0.012, 0.012, MAT.brass);
    }
  }

  function buildBattleship(b, side, action = 'idle', phase = 0) {
    const bob = action === 'march' ? Math.sin(phase) * 0.02 : 0;
    const isFiring = action === 'attack' || action === 'fire';
    // 衣阿华级高速战列舰（严格分层：船舷上限 0.42，柚木甲板 0.42..0.445，炮座/炮塔逐层坐实零穿模）
    const sections = [
      [-1.68, 0.04, 0.40, 0.20, 1.04],
      [-1.22, 0.02, 0.41, 0.30, 1.08],
      [-0.50, 0.01, 0.41, 0.35, 1.10],
      [ 0.30, 0.01, 0.41, 0.33, 1.14],
      [ 0.95, 0.02, 0.42, 0.24, 1.24],
      [ 1.45, 0.05, 0.44, 0.11, 1.34],
      [ 1.72, 0.11, 0.45, 0.03, 1.42],
    ];
    b.loftHullZ(sections, MAT.hullRed, 0.00, 0.14);
    b.loftHullZ(sections, MAT.rubber, 0.14, 0.18);
    b.loftHullZ(sections, MAT.navalGrey, 0.18, 0.42);
    b.box(0, 0.43 + bob, -0.06, 0.56, 0.026, 2.58, MAT.deckTeak);
    // 标志性前二后一 3 座三联装 406mm Mk.7 巨炮炮塔（带独立圆柱装甲炮座，背负式零穿模）
    for (const [barbTop, ty, tz, dir] of [[0.48, 0.545, 0.88, 1], [0.58, 0.645, 0.48, 1], [0.47, 0.535, -0.98, -1]]) {
      b.cyl(0, 0.44 + bob, tz, 0, barbTop + bob, tz, 0.13, 0.13, MAT.navalGrey, 10);
      b.box(0, ty + bob, tz, 0.26, 0.13, 0.30, MAT.navalLight);
      for (const bx of [-0.075, 0, 0.075]) {
        b.cyl(bx, ty + 0.02 + bob, tz + dir * 0.14, bx, ty + 0.08 + bob, tz + dir * 0.54, 0.020, 0.015, MAT.gunmetal, 8);
        if (isFiring) b.box(bx, ty + 0.09 + bob, tz + dir * 0.60, 0.09, 0.09, 0.14, MAT.flameOuter);
      }
    }
    // 高耸装甲宝塔舰桥 + 双大倾角烟囱 + 雷达火控塔（严格坐落于 z = -0.58 .. +0.26，与炮塔分离）
    b.box(0, 0.62 + bob, 0.06, 0.32, 0.36, 0.46, MAT.navalLight);
    b.box(0, 0.92 + bob, 0.14, 0.24, 0.24, 0.26, MAT.navalGrey);
    b.box(0, 1.10 + bob, 0.14, 0.18, 0.12, 0.18, MAT.gunmetal);
    b.cyl(0, 1.16 + bob, 0.14, 0, 1.54 + bob, 0.12, 0.024, 0.010, MAT.brightStl, 8);
    b.box(0, 1.44 + bob, 0.13, 0.32, 0.04, 0.05, MAT.brass);
    // 前后双烟囱
    for (const fz of [-0.14, -0.48]) {
      b.cyl(0, 0.46 + bob, fz, 0, 0.94 + bob, fz - 0.08, 0.088, 0.074, MAT.navalGrey, 10);
      b.cyl(0, 0.94 + bob, fz - 0.08, 0, 0.99 + bob, fz - 0.09, 0.078, 0.078, MAT.rubber, 10);
    }
    // 两舷 127mm 双联副炮塔
    for (const sx of [-0.27, 0.27]) for (const z of [-0.42, -0.08, 0.22]) {
      b.box(sx, 0.49 + bob, z, 0.10, 0.09, 0.12, MAT.navalLight);
    }
    // 舰尾弹射器与水上侦察机
    b.box(0, 0.47 + bob, -1.42, 0.05, 0.03, 0.30, MAT.gunmetal);
    b.box(0, 0.51 + bob, -1.42, 0.26, 0.018, 0.06, MAT.navalLight);
  }

  // ── 高精重工坦克/战机精细子组件库（对齐国共内战最高建模精细度）──
  function addTankSuperDetails(b, bounce, bodyMat, { trackX = 0.46, hullLen = 1.54, turretY = 0.68, turretZ = 0.06, smoke = true } = {}) {
    const halfL = hullLen * 0.48;
    // 前主动轮 + 后诱导轮 + 3 对上方托带轮
    for (const sx of [-trackX, trackX]) {
      b.cyl(sx - 0.12, 0.24 + bounce,  halfL, sx + 0.12, 0.24 + bounce,  halfL, 0.13, 0.13, MAT.gunmetal, 10);
      b.cyl(sx - 0.12, 0.24 + bounce, -halfL, sx + 0.12, 0.24 + bounce, -halfL, 0.125, 0.125, MAT.gunmetal, 10);
      for (const rz of [-halfL * 0.55, 0, halfL * 0.55]) {
        b.cyl(sx - 0.11, 0.30 + bounce, rz, sx + 0.11, 0.30 + bounce, rz, 0.048, 0.048, MAT.armorDark, 8);
      }
    }
    // 车体前装甲：驾驶员观察窗 + 航向机枪球座 + 双牵引钩 + 首下备用履带
    b.box(-0.18, 0.44 + bounce, halfL * 0.96, 0.16, 0.055, 0.04, MAT.armorDark);
    b.ellipsoid(0.20, 0.42 + bounce, halfL * 0.96, 0.06, 0.06, 0.05, MAT.gunmetal);
    b.cyl(0.20, 0.42 + bounce, halfL * 0.98, 0.20, 0.42 + bounce, halfL * 0.98 + 0.22, 0.014, 0.011, MAT.bluedSteel, 6);
    for (const hx of [-0.28, 0.28]) b.box(hx, 0.32 + bounce, halfL * 1.04, 0.04, 0.05, 0.06, MAT.gunmetal);
    b.box(0, 0.28 + bounce, halfL * 1.02, 0.44, 0.08, 0.04, MAT.rubber); // 首下备用履带板
    // 炮塔尾储物箱 + 两侧 3 联烟雾弹发射器
    b.box(0, turretY + 0.02 + bounce, turretZ - 0.42, 0.38, 0.16, 0.16, MAT.armorDark);
    if (smoke) {
      for (const sx of [-0.34, 0.34]) {
        b.cyl(sx, turretY + 0.02 + bounce, turretZ + 0.18, sx * 1.15, turretY + 0.10 + bounce, turretZ + 0.30, 0.024, 0.022, MAT.gunmetal, 6);
        b.cyl(sx, turretY + 0.00 + bounce, turretZ + 0.10, sx * 1.15, turretY + 0.08 + bounce, turretZ + 0.22, 0.024, 0.022, MAT.gunmetal, 6);
      }
    }
  }

  function addPlaneSuperDetails(b, yBase, wingSpan, wingZ, bodyMat, { pilotZ = 0.08, underBombs = true } = {}) {
    // 透明座舱内飞行员头盔与座椅靠背 + 防眩仪表台
    b.ellipsoid(0, yBase + 0.15, pilotZ, 0.052, 0.058, 0.052, MAT.leather);
    b.box(0, yBase + 0.11, pilotZ - 0.07, 0.08, 0.11, 0.03, MAT.armorDark);
    b.box(0, yBase + 0.12, pilotZ + 0.14, 0.10, 0.04, 0.06, MAT.rubber);
    // 左右主翼后缘副翼/襟翼线 + 翼下挂弹/油箱挂架 + 空速管
    const wHalf = wingSpan * 0.46;
    b.box(-wHalf * 0.65, yBase - 0.01, wingZ - 0.20, wHalf * 0.52, 0.022, 0.07, MAT.armorDark);
    b.box( wHalf * 0.65, yBase - 0.01, wingZ - 0.20, wHalf * 0.52, 0.022, 0.07, MAT.armorDark);
    b.cyl(wHalf * 0.85, yBase - 0.02, wingZ + 0.20, wHalf * 0.85, yBase - 0.02, wingZ + 0.44, 0.007, 0.004, MAT.brightStl, 6); // 空速管
    if (underBombs) {
      for (const sx of [-wHalf * 0.42, wHalf * 0.42]) {
        b.box(sx, yBase - 0.05, wingZ, 0.025, 0.07, 0.16, MAT.gunmetal);
        b.cyl(sx, yBase - 0.10, wingZ - 0.14, sx, yBase - 0.10, wingZ + 0.18, 0.038, 0.022, MAT.armorDark, 8);
      }
    }
  }

  function buildJetFighter(b, side, action = 'idle', phase = 0, variant = '') {
    const isMig = variant === 'mig15' || (variant !== 'f86' && side === 'ccp');
    const hover = 0.88 + Math.sin(phase * 1.6) * 0.05;
    const body = MAT.brightStl;
    const trim = isMig ? MAT.hullRed : MAT.brass; // 米格-15 红鼻红星 / F-86 佩刀经典黄黑识别带
    // 圆柱流线型喷气机身（机头进气道 + 中段 + 渐缩尾喷口）
    b.cyl(0, hover, 0.78, 0, hover, 0.15, 0.13, 0.155, body, 14);
    b.cyl(0, hover, 0.15, 0, hover, -0.82, 0.155, 0.10, body, 14);
    b.cyl(0, hover, 0.82, 0, hover, 0.72, 0.125, 0.132, trim, 14); // 机头涂装环
    b.cyl(0, hover, 0.84, 0, hover, 0.80, 0.078, 0.078, MAT.rubber, 12); // 进气口黑洞
    if (isMig) {
      b.box(0, hover, 0.83, 0.015, 0.15, 0.04, body); // 米格-15 标志性进气道垂直隔板
      b.cyl(0.05, hover - 0.12, 0.82, 0.05, hover - 0.12, 0.96, 0.014, 0.012, MAT.gunmetal, 6); // 37mm 航炮
      b.cyl(-0.05, hover - 0.12, 0.80, -0.05, hover - 0.12, 0.91, 0.010, 0.009, MAT.gunmetal, 6); // 23mm 航炮
    } else {
      // F-86 佩刀经典中机身黄黑条纹识别带
      b.cyl(0, hover, -0.18, 0, hover, -0.34, 0.145, 0.135, MAT.brass, 14);
      b.cyl(0, hover, -0.34, 0, hover, -0.38, 0.135, 0.132, MAT.rubber, 14);
    }
    b.cyl(0, hover, -0.82, 0, hover, -0.90, 0.095, 0.08, MAT.gunmetal, 12); // 尾喷口
    if (action !== 'idle') {
      b.cyl(0, hover, -0.90, 0, hover, -1.25, 0.07, 0.02, MAT.flameOuter, 10);
      b.cyl(0, hover, -0.90, 0, hover, -1.12, 0.045, 0.01, MAT.flameCore, 8);
    }
    // 气泡水滴座舱盖
    b.cyl(0, hover + 0.12, 0.44, 0, hover + 0.12, -0.02, 0.075, 0.068, MAT.glass, 10);
    // 35° 后掠主翼（6 段平滑后掠 + 翼下副油箱 + 米格-15 翼刀）
    for (let s = 1; s <= 6; s++) {
      const x = s * 0.165, z = 0.24 - s * 0.115, chord = 0.36 - s * 0.032;
      b.box( x, hover - 0.02, z, 0.18, 0.032, chord, s === 5 ? trim : body);
      b.box(-x, hover - 0.02, z, 0.18, 0.032, chord, s === 5 ? trim : body);
    }
    if (isMig) {
      for (const sx of [-1, 1]) {
        b.box(sx * 0.42, hover + 0.01, 0.00, 0.012, 0.045, 0.26, MAT.gunmetal); // 翼刀 1
        b.box(sx * 0.72, hover + 0.01, -0.20, 0.012, 0.045, 0.20, MAT.gunmetal); // 翼刀 2
      }
    }
    for (const sx of [-0.48, 0.48]) {
      b.cyl(sx, hover - 0.09, 0.08, sx, hover - 0.09, -0.24, 0.035, 0.028, body, 8); // 副油箱
    }
    // 后掠垂尾 + 高位平尾（米格-15 为 T 尾，F-86 为低置后掠平尾）
    for (let v = 0; v < 4; v++) {
      b.box(0, hover + 0.16 + v * 0.11, -0.58 - v * 0.06, 0.032, 0.12, 0.32 - v * 0.04, body);
    }
    const tailY = isMig ? hover + 0.44 : hover + 0.04;
    const tailZ = isMig ? -0.76 : -0.68;
    for (let t = 1; t <= 3; t++) {
      b.box( t * 0.12, tailY, tailZ - t * 0.06, 0.13, 0.025, 0.16 - t * 0.02, body);
      b.box(-t * 0.12, tailY, tailZ - t * 0.06, 0.13, 0.025, 0.16 - t * 0.02, body);
    }
    addPlaneSuperDetails(b, hover, 2.0, -0.04, body, { pilotZ: 0.22, underBombs: false });
  }

  function buildB29(b, action = 'idle', phase = 0) {
    const hover = 0.90 + Math.sin(phase * 1.1) * 0.03;
    // B-29 超级空中堡垒修长圆柱机身 + 透明温室机头 + 金属框条 + 机腹弹舱门
    b.cyl(0, hover, 1.05, 0, hover, -1.08, 0.145, 0.11, MAT.brightStl, 16);
    b.cyl(0, hover, 1.24, 0, hover, 1.02, 0.075, 0.145, MAT.glass, 14);
    b.box(0, hover + 0.06, 1.12, 0.16, 0.016, 0.22, MAT.armorDark); // 机头温室骨架
    b.box(0, hover - 0.13, 0.10, 0.14, 0.02, 0.62, MAT.armorDark); // 弹舱门线
    // 超长高展弦比主翼 + 4 台 R-3350 发动机短舱与旋转四叶螺旋桨 + 翼徽
    b.box(0, hover + 0.02, 0.10, 2.70, 0.045, 0.34, MAT.brightStl);
    b.box(0, hover + 0.02, 0.04, 2.40, 0.042, 0.24, MAT.navalLight);
    for (const ex of [-0.88, -0.44, 0.44, 0.88]) {
      b.cyl(ex, hover - 0.01, 0.32, ex, hover - 0.01, -0.08, 0.065, 0.055, MAT.navalGrey, 12);
      b.cyl(ex, hover - 0.01, 0.33, ex, hover - 0.01, 0.30, 0.058, 0.058, MAT.rubber, 10); // 发动机进气口
      const ang = action !== 'idle' ? phase * 6 : 0.4;
      const dx = Math.cos(ang) * 0.16, dy = Math.sin(ang) * 0.16;
      b.cyl(ex - dx, hover - dy, 0.35, ex + dx, hover + dy, 0.35, 0.011, 0.011, MAT.rubber, 6);
      b.cyl(ex + dy, hover - dx, 0.35, ex - dy, hover + dx, 0.35, 0.011, 0.011, MAT.rubber, 6);
      b.ellipsoid(ex, hover - 0.01, 0.36, 0.022, 0.022, 0.022, MAT.brightStl); // 桨毂
    }
    // 机背双联遥控炮塔（前后 2 座）+ 机尾炮手舱 + 高耸垂尾与水平尾翼
    b.cyl(0, hover + 0.15, 0.35, 0, hover + 0.21, 0.35, 0.065, 0.05, MAT.gunmetal, 8);
    b.cyl(0, hover + 0.14, -0.35, 0, hover + 0.20, -0.35, 0.060, 0.045, MAT.gunmetal, 8);
    b.box(0, hover + 0.28, -0.94, 0.04, 0.46, 0.34, MAT.brightStl);
    b.box(0, hover + 0.04, -0.96, 0.96, 0.032, 0.20, MAT.brightStl);
    addPlaneSuperDetails(b, hover, 2.65, 0.10, MAT.brightStl, { pilotZ: 0.96, underBombs: false });
  }

  function buildHistoricalTank(b, variant = 't34', action = 'idle', phase = 0) {
    const isT34 = variant === 't34';
    const isFiring = action === 'attack' || action === 'fire';
    const armor = isT34 ? MAT.armorSov : MAT.armorGrn;
    const bounce = action === 'march' ? Math.sin(phase * 3) * 0.015 : 0;
    // 两侧履带 + 负重轮（T-34 为 5 对大负重轮，M26 潘兴为 6 对小负重轮）
    for (const sx of [-0.46, 0.46]) {
      b.box(sx, 0.19 + bounce, 0, 0.22, 0.26, 1.62, MAT.rubber);
      const wheels = isT34 ? 5 : 6;
      for (let w = 0; w < wheels; w++) {
        const wz = -0.60 + (w * 1.20) / (wheels - 1);
        b.cyl(sx - 0.12, 0.16 + bounce, wz, sx + 0.12, 0.16 + bounce, wz, isT34 ? 0.125 : 0.10, isT34 ? 0.125 : 0.10, MAT.gunmetal, 10);
      }
    }
    // 倾斜装甲车体（T-34 标志性大倾角首上 + 车尾双圆桶副油箱）
    b.box(0, 0.34 + bounce, -0.02, 0.84, 0.24, 1.54, armor);
    b.box(0, 0.34 + bounce, 0.72, 0.80, 0.18, 0.28, armor, -0.45, 0, 0);
    if (isT34) {
      for (const sx of [-0.46, 0.46]) {
        b.cyl(sx, 0.44 + bounce, -0.32, sx, 0.44 + bounce, -0.66, 0.075, 0.075, MAT.armorDark, 10); // 外挂圆桶油箱
      }
    }
    // 炮塔（T-34/85 圆润大炮塔 vs M26 潘兴长后部配重炮塔）
    b.cyl(0, 0.46 + bounce, 0.08, 0, 0.72 + bounce, 0.08, isT34 ? 0.34 : 0.36, isT34 ? 0.27 : 0.30, armor, 14);
    if (!isT34) b.box(0, 0.60 + bounce, -0.22, 0.42, 0.22, 0.34, armor); // 潘兴炮塔尾舱
    b.cyl(-0.10, 0.72 + bounce, -0.02, -0.10, 0.80 + bounce, -0.02, 0.10, 0.09, MAT.armorDark, 10); // 车长指挥塔
    // 主炮（T-34/85 85mm 长管 vs M26 90mm 带双室炮口制退器）
    b.cyl(0, 0.60 + bounce, 0.36, 0, 0.61 + bounce, isT34 ? 1.48 : 1.58, 0.044, 0.034, MAT.gunmetal, 10);
    if (!isT34) {
      b.box(0, 0.61 + bounce, 1.58, 0.11, 0.08, 0.14, MAT.bluedSteel); // 90mm 双室炮口制退器
      b.cyl(0.14, 0.76 + bounce, -0.12, 0.14, 0.86 + bounce, 0.18, 0.015, 0.012, MAT.gunmetal, 6); // M2 高射机枪
    }
    if (isFiring) {
      b.cyl(0, 0.61 + bounce, 1.56, 0, 0.61 + bounce, 1.98, 0.14, 0.03, MAT.flameOuter, 10);
      b.cyl(0, 0.61 + bounce, 1.56, 0, 0.61 + bounce, 1.82, 0.08, 0.02, MAT.flameCore, 8);
    }
    addTankSuperDetails(b, bounce, armor, { trackX: 0.46, hullLen: 1.56, turretY: 0.60, turretZ: 0.08 });
  }

  function buildKatyusha(b, action = 'idle', phase = 0) {
    const isFiring = action === 'attack' || action === 'fire';
    // 苏式 ZIS-151 6x6 军用卡车底盘 + 驾驶室 + 引擎盖
    b.box(0, 0.28, -0.08, 0.62, 0.14, 1.72, MAT.armorDark); // 车架
    b.box(0, 0.56, 0.34, 0.66, 0.44, 0.48, MAT.armorSov); // 驾驶室
    b.box(0, 0.62, 0.58, 0.54, 0.16, 0.04, MAT.glass); // 前挡风玻璃
    b.box(0, 0.46, 0.74, 0.54, 0.28, 0.42, MAT.armorSov); // 引擎盖
    for (const sx of [-0.36, 0.36]) for (const wz of [0.68, -0.34, -0.74]) {
      b.cyl(sx - 0.07, 0.18, wz, sx + 0.07, 0.18, wz, 0.17, 0.17, MAT.rubber, 12);
      b.cyl(sx - 0.08, 0.18, wz, sx + 0.08, 0.18, wz, 0.08, 0.08, MAT.armorDark, 8);
    }
    // 倾斜高扬的 BM-13 喀秋莎滑轨发射架 + 双排 16 枚 132mm M-13 火箭弹
    b.box(0, 0.64, -0.44, 0.58, 0.10, 0.96, MAT.gunmetal, -0.42, 0, 0);
    for (let r = 0; r < 8; r++) {
      const rx = -0.28 + r * 0.08;
      b.cyl(rx, 0.50, -0.82, rx, 0.96, 0.14, 0.022, 0.022, MAT.armorDark, 8); // 上排火箭弹
      b.cyl(rx, 0.96, 0.14, rx, 1.00, 0.22, 0.022, 0.008, MAT.hullRed, 6); // 红色弹头
      b.cyl(rx, 0.40, -0.80, rx, 0.86, 0.16, 0.022, 0.022, MAT.gunmetal, 8); // 下排火箭弹
      if (isFiring && r % 2 === 0) {
        b.cyl(rx, 0.46, -0.84, rx, 0.26, -1.24, 0.055, 0.015, MAT.flameOuter, 8);
      }
    }
  }

  function buildYamato(b, action = 'idle', phase = 0) {
    const isFiring = action === 'attack' || action === 'fire';
    // 日本大和级超弩级战列舰：超宽防雷鼓包放样舰体 + 金色菊花纹章 + 高耸宝塔桅楼 + 3座三联460mm主炮
    const hull = [
      [-2.10, 0.05, 0.42, 0.24, 1.05],
      [-1.50, 0.02, 0.45, 0.44, 1.12],
      [-0.50, 0.01, 0.47, 0.54, 1.16],
      [ 0.55, 0.01, 0.48, 0.52, 1.18],
      [ 1.35, 0.03, 0.52, 0.34, 1.25],
      [ 1.85, 0.06, 0.57, 0.16, 1.35],
      [ 2.18, 0.12, 0.62, 0.02, 1.44],
    ];
    b.loftHullZ(hull, MAT.hullRed, 0.0, 0.14);
    b.loftHullZ(hull, MAT.navalGrey, 0.14, 0.72);
    b.box(0, 0.48, 0.0, 0.86, 0.04, 3.35, MAT.deckTeak); // 宽大桧木甲板
    b.cyl(0, 0.54, 2.14, 0, 0.54, 2.19, 0.048, 0.048, MAT.brass, 10); // 舰首金色菊花纹章
    // 标志性高耸宝塔舰桥 + 单斜置大烟囱 + 后桅杆
    b.box(0, 0.74, 0.10, 0.42, 0.48, 0.56, MAT.navalLight);
    b.box(0, 1.10, 0.14, 0.30, 0.34, 0.36, MAT.navalGrey);
    b.box(0, 1.34, 0.15, 0.38, 0.10, 0.18, MAT.navalLight); // 15米光学测距仪
    b.cyl(0, 1.38, 0.15, 0, 1.66, 0.15, 0.025, 0.014, MAT.gunmetal, 8);
    b.cyl(0, 0.66, -0.34, 0, 1.24, -0.52, 0.14, 0.12, MAT.navalGrey, 12); // 大和标志性后倾大烟囱
    b.cyl(0, 1.20, -0.51, 0, 1.27, -0.53, 0.13, 0.12, MAT.rubber, 12);
    // 3 座三联装 460mm 巨炮塔（前二背负 + 后一）
    const turrets = [[0, 0.58, 1.26, 0], [0, 0.74, 0.78, 0], [0, 0.60, -1.16, Math.PI]];
    for (const [tx, ty, tz, dir] of turrets) {
      b.box(tx, ty, tz, 0.44, 0.22, 0.42, MAT.navalLight);
      const sgn = dir === 0 ? 1 : -1;
      for (const bx of [-0.11, 0, 0.11]) {
        b.cyl(tx + bx, ty + 0.04, tz + sgn * 0.20, tx + bx, ty + 0.12, tz + sgn * 0.86, 0.030, 0.024, MAT.gunmetal, 8);
        if (isFiring) b.cyl(tx + bx, ty + 0.12, tz + sgn * 0.86, tx + bx, ty + 0.17, tz + sgn * 1.26, 0.10, 0.025, MAT.flameOuter, 8);
      }
    }
    // 舷侧 155mm 副炮、127mm 高平两用炮群、救生艇、舰桥观测窗、21号雷达网与舰尾水上侦察机
    b.box(0, 1.18, 0.33, 0.28, 0.055, 0.03, MAT.glass); // 舰桥全景防弹观测窗
    b.box(0, 1.54, 0.15, 0.24, 0.12, 0.03, MAT.brass); // 21号电探对空雷达栅格
    for (const sx of [-0.36, 0.36]) {
      for (const pz of [-0.18, 0.18, -0.54]) {
        b.box(sx, 0.56, pz, 0.14, 0.10, 0.14, MAT.navalLight);
        b.cyl(sx, 0.58, pz, sx + (sx > 0 ? 0.18 : -0.18), 0.62, pz, 0.015, 0.012, MAT.gunmetal, 6);
      }
      b.ellipsoid(sx * 1.04, 0.52, -0.82, 0.055, 0.04, 0.16, MAT.eyeWhite); // 舰侧救生艇
    }
    b.box(0, 0.54, -1.78, 0.18, 0.04, 0.42, MAT.gunmetal); // 舰尾水上机弹射滑轨
    b.box(0, 0.60, -1.76, 0.32, 0.025, 0.08, MAT.armorGrn); // 停放零式水侦机翼
  }

  function buildPropFighter(b, kind = 'zero', action = 'idle', phase = 0) {
    const isZero = kind === 'zero';
    const isFiring = action === 'attack' || action === 'fire';
    const bank = Math.sin(phase) * 0.08;
    const bodyMat = isZero ? MAT.navalLight : MAT.armorGrn;
    const wingMat = isZero ? MAT.navalLight : MAT.armorSov;
    // 流线活塞机身 + 引擎整流罩 + 旋转三叶螺旋桨 + 侧面排气管
    b.cyl(0, 0.84, -1.05, 0, 0.84, 0.96, 0.12, 0.17, bodyMat, 14);
    b.cyl(0, 0.84, 0.96, 0, 0.84, 1.12, 0.16, 0.06, isZero ? MAT.rubber : MAT.brass, 12);
    for (const sx of [-0.15, 0.15]) {
      b.box(sx, 0.84, 0.68, 0.03, 0.04, 0.28, MAT.gunmetal); // 发动机侧面排气歧管
    }
    const spin = phase * 3.5;
    for (let k = 0; k < 3; k++) {
      const a = spin + k * (Math.PI * 2 / 3);
      b.cyl(0, 0.84, 1.13, Math.cos(a) * 0.42, 0.84 + Math.sin(a) * 0.42, 1.14, 0.028, 0.012, MAT.gunmetal, 6);
    }
    // 气泡水滴座舱盖 + 金属座舱框架条 + 无线电桅杆
    b.ellipsoid(0, 0.99, 0.05, 0.11, 0.11, 0.34, MAT.glass);
    b.box(0, 1.07, 0.12, 0.14, 0.018, 0.03, MAT.armorDark);
    b.cyl(0, 1.04, -0.26, 0, 1.24, -0.30, 0.012, 0.008, MAT.gunmetal, 6);
    // 主翼：零战长直微后掠翼+日之丸红日；喷火经典椭圆翼 + 翼前缘机炮管 + 翼尖航行灯
    b.box(0, 0.80, 0.16, isZero ? 2.48 : 2.30, 0.045, isZero ? 0.48 : 0.56, wingMat, 0, 0, bank);
    if (!isZero) {
      b.ellipsoid(-1.05, 0.80, 0.16, 0.32, 0.032, 0.22, wingMat);
      b.ellipsoid(1.05, 0.80, 0.16, 0.32, 0.032, 0.22, wingMat);
    }
    const tipX = isZero ? 1.24 : 1.32;
    b.ellipsoid(-tipX, 0.80, 0.16, 0.032, 0.024, 0.032, MAT.hullRed); // 左翼尖红航行灯
    b.ellipsoid( tipX, 0.80, 0.16, 0.032, 0.024, 0.032, MAT.armorGrn); // 右翼尖绿航行灯
    for (const sx of [-0.48, 0.48]) {
      b.cyl(sx, 0.80, 0.38, sx, 0.80, 0.58, 0.016, 0.013, MAT.bluedSteel, 6); // 翼前缘20mm航炮炮管
    }
    for (const sx of [-0.72, 0.72]) {
      b.cyl(sx, 0.828, 0.16, sx, 0.842, 0.16, 0.14, 0.14, isZero ? MAT.hullRed : MAT.brass, 12);
      if (!isZero) b.cyl(sx, 0.838, 0.16, sx, 0.848, 0.16, 0.075, 0.075, MAT.hullRed, 10);
    }
    // 水平尾翼与垂直尾翼 + 尾轮 + 机腹副油箱
    b.box(0, 0.86, -0.96, 0.84, 0.035, 0.24, wingMat, 0, 0, bank);
    b.box(0, 1.04, -0.96, 0.04, 0.34, 0.28, bodyMat);
    b.cyl(0, 0.74, -0.94, 0, 0.66, -0.94, 0.022, 0.022, MAT.rubber, 6); // 尾轮
    if (isZero) b.cyl(0, 0.68, -0.10, 0, 0.68, 0.42, 0.065, 0.055, MAT.navalGrey, 10);
    if (isFiring) {
      for (const sx of [-0.48, 0.48]) {
        b.cyl(sx, 0.80, 0.58, sx, 0.80, 1.44, 0.032, 0.012, MAT.flameOuter, 8);
      }
    }
    addPlaneSuperDetails(b, 0.84, isZero ? 2.48 : 2.30, 0.16, bodyMat, { pilotZ: 0.05, underBombs: !isZero });
  }

  function buildWW2Tank(b, kind = 'sherman', action = 'idle', phase = 0) {
    const isFiring = action === 'attack' || action === 'fire';
    const bounce = action === 'march' ? Math.sin(phase * 2) * 0.025 : 0;
    const isTiger = kind === 'tiger';
    const isCharB1 = kind === 'charb1';
    const bodyMat = isTiger ? MAT.navalGrey : isCharB1 ? MAT.armorSov : MAT.armorGrn;
    // 履带、负重轮与侧裙护泥板
    for (const sx of [-0.48, 0.48]) {
      b.box(sx, 0.20 + bounce, 0, isTiger ? 0.26 : 0.20, 0.26, isCharB1 ? 1.72 : 1.54, MAT.rubber);
      b.box(sx, 0.35 + bounce, 0, isTiger ? 0.29 : 0.23, 0.045, isCharB1 ? 1.74 : 1.58, bodyMat); // 侧裙翼子板
      const wheels = isTiger ? 6 : 5;
      for (let w = 0; w < wheels; w++) {
        const wz = -0.58 + w * (1.16 / (wheels - 1));
        b.cyl(sx - 0.11, 0.16 + bounce, wz, sx + 0.11, 0.16 + bounce, wz, isTiger ? 0.14 : 0.12, isTiger ? 0.14 : 0.12, MAT.armorDark, 10);
        b.cyl(sx - 0.12, 0.16 + bounce, wz, sx + 0.12, 0.16 + bounce, wz, 0.045, 0.045, MAT.gunmetal, 8); // 轮毂盖
      }
    }
    // 前照大灯与车尾发动机散热格栅 + 鞭状无线电天线
    b.cyl(-0.34, 0.48 + bounce, 0.75, -0.34, 0.48 + bounce, 0.82, 0.042, 0.042, MAT.brass, 8);
    b.box(0, 0.56 + bounce, -0.52, 0.58, 0.03, 0.34, MAT.armorDark); // 发动机百叶散热栅
    b.cyl(-0.32, 0.56 + bounce, -0.58, -0.36, 1.38 + bounce, -0.68, 0.008, 0.004, MAT.gunmetal, 6); // 鞭状天线
    if (isCharB1) {
      b.box(0, 0.40 + bounce, 0.0, 0.82, 0.34, 1.62, bodyMat);
      b.cyl(0.22, 0.38 + bounce, 0.72, 0.22, 0.38 + bounce, 1.12, 0.046, 0.042, MAT.bluedSteel, 8);
      b.cyl(-0.08, 0.56 + bounce, 0.16, -0.08, 0.82 + bounce, 0.16, 0.26, 0.22, bodyMat, 12);
      b.box(-0.08, 0.70 + bounce, 0.36, 0.18, 0.14, 0.08, MAT.armorDark); // 炮盾
      b.cyl(-0.08, 0.70 + bounce, 0.36, -0.08, 0.70 + bounce, 1.04, 0.032, 0.026, MAT.bluedSteel, 8);
    } else if (isTiger) {
      b.box(0, 0.40 + bounce, 0.0, 1.06, 0.32, 1.52, bodyMat);
      b.box(0, 0.68 + bounce, 0.06, 0.68, 0.28, 0.74, bodyMat);
      b.box(0, 0.68 + bounce, 0.44, 0.54, 0.18, 0.10, MAT.armorDark); // 虎式厚重防盾
      b.cyl(-0.18, 0.82 + bounce, -0.06, -0.18, 0.92 + bounce, -0.06, 0.12, 0.11, MAT.armorDark, 10); // 车长指挥塔
      for (const ex of [-0.26, 0.26]) b.cyl(ex, 0.36 + bounce, -0.78, ex, 0.58 + bounce, -0.78, 0.052, 0.048, MAT.gunmetal, 8); // 虎式双排气管
      b.cyl(0, 0.68 + bounce, 0.46, 0, 0.68 + bounce, 1.68, 0.044, 0.036, MAT.bluedSteel, 10);
      b.box(0, 0.68 + bounce, 1.70, 0.11, 0.09, 0.12, MAT.gunmetal);
    } else {
      b.box(0, 0.42 + bounce, 0.0, 0.88, 0.36, 1.48, bodyMat);
      b.box(0, 0.38 + bounce, 0.72, 0.84, 0.26, 0.30, bodyMat, 0.48, 0, 0);
      b.ellipsoid(0, 0.72 + bounce, 0.08, 0.34, 0.20, 0.40, bodyMat);
      b.box(0, 0.72 + bounce, 0.44, 0.32, 0.16, 0.09, MAT.armorDark); // 谢尔曼铸造炮盾
      b.cyl(-0.12, 0.88 + bounce, -0.02, -0.12, 0.96 + bounce, -0.02, 0.10, 0.10, MAT.armorDark, 10); // 车长舱盖
      b.cyl(0, 0.72 + bounce, 0.44, 0, 0.72 + bounce, 1.44, 0.038, 0.032, MAT.bluedSteel, 10);
      b.cyl(0.14, 0.86 + bounce, -0.10, 0.14, 0.96 + bounce, 0.18, 0.015, 0.012, MAT.gunmetal, 6);
    }
    if (isFiring) {
      const mz = isTiger ? 1.76 : isCharB1 ? 1.08 : 1.48;
      const my = isTiger ? 0.68 : isCharB1 ? 0.70 : 0.72;
      b.cyl(0, my + bounce, mz, 0, my + bounce, mz + 0.46, 0.14, 0.03, MAT.flameOuter, 10);
      b.cyl(0, my + bounce, mz, 0, my + bounce, mz + 0.30, 0.08, 0.02, MAT.flameCore, 8);
    }
    addTankSuperDetails(b, bounce, bodyMat, { trackX: 0.48, hullLen: isCharB1 ? 1.66 : 1.52, turretY: isTiger ? 0.68 : 0.72, turretZ: 0.08 });
  }

  function buildExtraWW2Vehicles(b, kind, action = 'idle', phase = 0) {
    const isFiring = action === 'attack' || action === 'fire';
    const bounce = action === 'march' ? Math.sin(phase * 2) * 0.025 : 0;
    if (kind === 'churchill') {
      // 英国丘吉尔重型步兵坦克：标志性超长全包环绕履带 + 方形高大重甲炮塔 + 75mm炮
      for (const sx of [-0.50, 0.50]) {
        b.box(sx, 0.30 + bounce, 0, 0.24, 0.42, 1.84, MAT.rubber);
        b.box(sx, 0.36 + bounce, 0, 0.26, 0.14, 1.80, MAT.ukBrodie); // 上部全包护泥装甲板
      }
      b.box(0, 0.38 + bounce, 0.0, 0.78, 0.34, 1.54, MAT.ukBrodie);
      b.box(0, 0.70 + bounce, 0.08, 0.56, 0.30, 0.62, MAT.ukBrodie);
      b.box(0, 0.70 + bounce, 0.40, 0.34, 0.16, 0.08, MAT.armorDark); // 丘吉尔厚炮盾
      b.cyl(-0.14, 0.85 + bounce, 0.0, -0.14, 0.93 + bounce, 0.0, 0.11, 0.10, MAT.armorDark, 10); // 车长指挥塔
      b.cyl(-0.26, 0.54 + bounce, -0.58, -0.30, 1.32 + bounce, -0.66, 0.008, 0.004, MAT.gunmetal, 6); // 无线电天线
      b.cyl(0, 0.70 + bounce, 0.42, 0, 0.70 + bounce, 1.38, 0.036, 0.030, MAT.bluedSteel, 8);
      if (isFiring) b.cyl(0, 0.70 + bounce, 1.40, 0, 0.70 + bounce, 1.82, 0.12, 0.025, MAT.flameOuter, 8);
    } else if (kind === 'chiha') {
      // 日本九七式中战车改（Chi-Ha）：低矮铆接车体 + 标志性炮塔环绕式马蹄无线电天线 + 47mm高速炮 + 炮盾与车尾油桶
      for (const sx of [-0.42, 0.42]) {
        b.box(sx, 0.18 + bounce, 0, 0.18, 0.22, 1.44, MAT.rubber);
        b.box(sx, 0.31 + bounce, 0, 0.20, 0.035, 1.46, MAT.jpnHelm);
        for (let w = 0; w < 6; w++) b.cyl(sx - 0.10, 0.14 + bounce, -0.52 + w * 0.21, sx + 0.10, 0.14 + bounce, -0.52 + w * 0.21, 0.10, 0.10, MAT.armorDark, 8);
      }
      b.box(0, 0.36 + bounce, 0, 0.76, 0.26, 1.38, MAT.jpnHelm);
      b.box(0, 0.58 + bounce, 0.04, 0.48, 0.24, 0.56, MAT.jpnHelm);
      b.box(0, 0.58 + bounce, 0.33, 0.24, 0.14, 0.07, MAT.armorDark); // 炮盾
      b.cyl(0, 0.70 + bounce, 0.0, 0, 0.78 + bounce, 0.0, 0.10, 0.10, MAT.armorDark, 8); // 指挥塔
      b.cyl(-0.22, 0.40 + bounce, -0.72, 0.22, 0.40 + bounce, -0.72, 0.08, 0.08, MAT.armorDark, 8); // 车尾圆柱备用油桶
      b.box(0, 0.80 + bounce, -0.02, 0.58, 0.022, 0.64, MAT.brass);
      b.cyl(0, 0.58 + bounce, 0.34, 0, 0.58 + bounce, 1.24, 0.028, 0.022, MAT.bluedSteel, 8);
      if (isFiring) b.cyl(0, 0.58 + bounce, 1.26, 0, 0.58 + bounce, 1.62, 0.10, 0.02, MAT.flameOuter, 8);
    } else if (kind === 'stuka' || kind === 'il2' || kind === 'p40') {
      const bank = Math.sin(phase) * 0.08;
      const bodyMat = kind === 'stuka' ? MAT.gerFeldgrau : kind === 'il2' ? MAT.armorSov : MAT.usaOlive;
      b.cyl(0, 0.86, -1.08, 0, 0.86, 0.96, 0.12, 0.17, bodyMat, 14);
      // 螺旋桨
      const spin = phase * 3.6;
      for (let k = 0; k < 3; k++) {
        const a = spin + k * (Math.PI * 2 / 3);
        b.cyl(0, 0.86, 1.12, Math.cos(a) * 0.42, 0.86 + Math.sin(a) * 0.42, 1.13, 0.028, 0.012, MAT.gunmetal, 6);
      }
      if (kind === 'p40') {
        // 中国飞虎队 P-40 标志性机头下颌散热器 + 红白鲨鱼嘴涂装！
        b.cyl(0, 0.86, 0.96, 0, 0.86, 1.12, 0.16, 0.07, MAT.hullRed, 12);
        b.box(0, 0.72, 0.84, 0.22, 0.10, 0.34, MAT.hullRed);
        b.box(0, 0.72, 0.92, 0.23, 0.04, 0.20, MAT.eyeWhite); // 鲨鱼白牙
      } else {
        b.cyl(0, 0.86, 0.96, 0, 0.86, 1.12, 0.16, 0.06, MAT.rubber, 12);
      }
      b.ellipsoid(0, 1.02, 0.04, 0.12, 0.12, 0.42, MAT.glass);
      if (kind === 'stuka') {
        // 德军 Ju 87 斯图卡标志性倒鸥翼 + 固定流线起落架 + 机腹 500kg 航弹
        b.box(-0.36, 0.72, 0.18, 0.62, 0.045, 0.50, bodyMat, 0, 0, -0.28);
        b.box( 0.36, 0.72, 0.18, 0.62, 0.045, 0.50, bodyMat, 0, 0,  0.28);
        b.box(-1.02, 0.76, 0.18, 0.86, 0.042, 0.42, bodyMat, 0, 0,  0.16);
        b.box( 1.02, 0.76, 0.18, 0.86, 0.042, 0.42, bodyMat, 0, 0, -0.16);
        for (const sx of [-0.56, 0.56]) {
          b.cyl(sx, 0.66, 0.24, sx, 0.38, 0.28, 0.04, 0.05, bodyMat, 8); // 斯图卡标志性固定起落架裤腿
        }
        b.cyl(0, 0.60, -0.10, 0, 0.60, 0.46, 0.08, 0.03, MAT.armorDark, 8); // 机腹重磅航弹
      } else {
        b.box(0, 0.82, 0.16, kind === 'il2' ? 2.52 : 2.28, 0.048, 0.52, bodyMat, 0, 0, bank);
        if (kind === 'il2') {
          for (const sx of [-0.62, -0.44, 0.44, 0.62]) b.cyl(sx, 0.74, -0.05, sx, 0.74, 0.42, 0.025, 0.015, MAT.hullRed, 6); // 翼下RS-82火箭弹
        }
      }
      b.box(0, 0.88, -0.98, 0.86, 0.035, 0.24, bodyMat, 0, 0, bank);
      b.box(0, 1.06, -0.98, 0.04, 0.34, 0.28, bodyMat);
      if (isFiring) {
        for (const sx of [-0.46, 0.46]) b.cyl(sx, 0.80, 0.44, sx, 0.80, 1.42, 0.035, 0.012, MAT.flameOuter, 8);
      }
    } else if (kind === 'uboat') {
      // 德国 U-VII 型狼群远洋潜艇：狭长灰黑雪茄耐压艇体 + 中部司令塔 + 88mm甲板炮 + 潜望镜
      const hull = [
        [-2.05, 0.10, 0.34, 0.04, 1.0],
        [-1.30, 0.05, 0.38, 0.22, 1.05],
        [ 0.00, 0.04, 0.40, 0.27, 1.08],
        [ 1.30, 0.05, 0.39, 0.21, 1.12],
        [ 2.08, 0.12, 0.42, 0.02, 1.18],
      ];
      b.loftHullZ(hull, MAT.armorDark, 0.0, 0.20);
      b.loftHullZ(hull, MAT.navalGrey, 0.20, 0.75);
      b.box(0, 0.62, 0.08, 0.24, 0.42, 0.62, MAT.navalGrey); // 指挥司令塔
      b.cyl(0, 0.82, 0.18, 0, 1.18, 0.18, 0.022, 0.016, MAT.gunmetal, 8); // 潜望镜
      b.cyl(0, 0.46, 0.76, 0, 0.48, 1.24, 0.026, 0.020, MAT.bluedSteel, 8); // 88mm甲板炮
      if (isFiring) b.cyl(0, 0.22, 2.06, 0, 0.22, 2.65, 0.06, 0.02, MAT.waterFoam, 8); // 鱼雷尾迹
    }
  }

  function buildKindScene(kind, side, action = 'idle', phase = 0, variant = '') {
    const b = createBuilder();
    if (kind === 'carrier') buildCarrier(b, side, action, phase);
    else if (kind === 'battleship') buildBattleship(b, side, action, phase);
    else if (kind === 'yamato') buildYamato(b, action, phase);
    else if (kind === 'jet' || kind === 'mig15' || kind === 'f86') buildJetFighter(b, side, action, phase, kind === 'jet' ? variant : kind);
    else if (kind === 'b29') buildB29(b, action, phase);
    else if (kind === 'zero' || kind === 'spitfire') buildPropFighter(b, kind, action, phase);
    else if (kind === 't34' || kind === 'm26') buildHistoricalTank(b, kind, action, phase);
    else if (kind === 'sherman' || kind === 'charb1' || kind === 'tiger') buildWW2Tank(b, kind, action, phase);
    else if (['churchill', 'chiha', 'stuka', 'il2', 'p40', 'uboat'].includes(kind)) buildExtraWW2Vehicles(b, kind, action, phase);
    else if (kind === 'katyusha') buildKatyusha(b, action, phase);
    else if (kind === 'ship' || kind === 'warship') buildWarship(b, side, action, phase);
    else if (kind === 'tank') buildMapTank(b, side, action, phase);
    else if (kind === 'artillery') buildMapArtillery(b, side, action, phase);
    else if (kind === 'aircraft') buildMapAircraft(b, side, action, phase);
    else if (kind.startsWith('soldier_')) addSoldier(b, { side: kind === 'soldier_ussr' || kind === 'soldier_pva' || kind === 'soldier_kpa' ? 'ccp' : 'roc', variant: kind.slice(8), action, phase });
    else addSoldier(b, { side, variant, action, phase });
    return b.finish();
  }

  // ==================== 兼容旧网格接口 & 比例换算函数 ====================
  function createMesh(kind = 'human') {
    const built = buildKindScene(kind, 'ccp', 'idle', 0, '');
    const d = built.data;
    const vertCount = d.length / 11;
    const positions = new Float32Array(vertCount * 3);
    const normals = new Float32Array(vertCount * 3);
    const indices = new Uint32Array(vertCount);
    for (let i = 0; i < vertCount; i++) {
      const o = i * 11, p = i * 3;
      positions[p] = d[o]; positions[p + 1] = d[o + 1]; positions[p + 2] = d[o + 2];
      normals[p] = d[o + 3]; normals[p + 1] = d[o + 4]; normals[p + 2] = d[o + 5];
      indices[i] = i;
    }
    return { positions, normals, indices };
  }

  function iconCount(strength) {
    const value = Math.max(0, Number(strength) || 0);
    return value > 0 ? Math.ceil(value / PEOPLE_PER_ICON) : 0;
  }

  function tankIcons(tanks) {
    const value = Math.max(0, Number(tanks) || 0);
    return value > 0 ? Math.ceil(value / TANKS_PER_ICON) : 0;
  }

  function artilleryIcons(guns) {
    const value = Math.max(0, Number(guns) || 0);
    return value > 0 ? Math.ceil(value / ARTILLERY_PER_ICON) : 0;
  }

  function regimentCount(units) {
    return tankIcons(units);
  }

  function airIcons(planes) {
    const value = Math.max(0, Number(planes) || 0);
    return value > 0 ? Math.ceil(value / PLANES_PER_ICON) : 0;
  }

  function airRegiments(planes) {
    return airIcons(planes);
  }

  function unitTanks(unit) {
    if (!unit || unit.strength <= 0) return 0;
    if (Number.isFinite(unit.tanks)) return Math.max(0, Math.round(unit.tanks));
    const branch = unit.profile || unit.branch || 'infantry';
    const armorSup = Number(unit.support?.armor) || 0;
    if (branch === 'mobile' || branch === 'armor') return Math.max(5, Math.round((unit.strength / 1000) * 0.85));
    if (armorSup >= 22) return Math.max(5, Math.round((armorSup - 15) * 0.45));
    return 0;
  }

  function unitArtillery(unit) {
    if (!unit || unit.strength <= 0) return 0;
    if (Number.isFinite(unit.guns)) return Math.max(0, Math.round(unit.guns));
    const branch = unit.profile || unit.branch || 'infantry';
    const artSup = Number(unit.support?.artillery) || 0;
    if (branch === 'artillery') return Math.max(12, Math.round((unit.strength / 1000) * 2.2));
    if (artSup >= 28) return Math.round(artSup * 0.45);
    return 0;
  }

  function troopTotals(units = []) {
    const parents = new Set(units.map(unit => unit.parent).filter(Boolean));
    const totals = new Map();
    for (const unit of units) {
      if (parents.has(unit.id) || unit.inactive || (Number(unit.strength) || 0) <= 0) continue;
      const key = unit.city + '|' + unit.side;
      totals.set(key, (totals.get(key) || 0) + Number(unit.strength));
    }
    return totals;
  }

  // 按上级部队和实际驻地归集基层兵员；跨城分兵不在上级驻地重复计数。
  function formationStrengthByCity(units = []) {
    const byId = new Map(units.map(unit => [unit.id, unit]));
    const parents = new Set(units.map(unit => unit.parent).filter(Boolean));
    const result = new Map();
    for (const leaf of units) {
      if (parents.has(leaf.id) || leaf.inactive || !(Number(leaf.strength) > 0)) continue;
      let current = leaf;
      const seen = new Set();
      while (current && !seen.has(current.id)) {
        seen.add(current.id);
        const key = current.id + '|' + leaf.city;
        result.set(key, (result.get(key) || 0) + Number(leaf.strength));
        current = byId.get(current.parent);
      }
    }
    return result;
  }

  function supportIcons(state = {}) {
    const units = state.units || [];
    const parents = new Set(units.map(unit => unit.parent).filter(Boolean));
    const byCity = new Map();
    for (const unit of units) {
      if (parents.has(unit.id) || unit.inactive || (Number(unit.strength) || 0) <= 0) continue;
      const key = unit.city + '|' + unit.side;
      if (!byCity.has(key)) byCity.set(key, { artillery: 0, armor: 0 });
      const cur = byCity.get(key);
      cur.armor += unitTanks(unit);
      cur.artillery += unitArtillery(unit);
    }
    return byCity;
  }

  function fleetIcons(navy = {}) {
    const total = Math.max(0, Math.floor(Number(navy.warships) || 0));
    const zones = Object.entries(navy.zones || {}).filter(([, item]) => item?.mission);
    if (!zones.length) return { total, reserve: total, zones: new Map() };
    const weights = zones.map(([zone, item]) => [zone, Math.max(1, Number(item.strength) || 1)]);
    const sum = weights.reduce((acc, [, weight]) => acc + weight, 0);
    let rest = total;
    const allocated = new Map();
    weights.forEach(([zone, weight], index) => {
      const count = index === weights.length - 1 ? rest : Math.min(rest, Math.round(total * weight / sum));
      rest -= count;
      allocated.set(zone, Math.ceil(count / SHIPS_PER_ICON));
    });
    return { total, reserve: 0, zones: allocated };
  }

  function orderAction(unit = {}, activeBattle = false, nightMode = false) {
    const order = unit.order;
    const moving = Array.isArray(order?.route) && order.route.length > 1 && unit.city !== order.target;
    if (!order) return nightMode ? 'sleep' : 'idle';
    if (order.type === 'rest') return moving ? 'march' : nightMode ? 'sleep' : 'rest';
    if (order.type === 'entrench') return moving ? 'march' : 'entrench';
    if (order.type === 'move') return 'march';
    if (order.type === 'advance') return moving && !activeBattle && order.route.length > 2 ? 'march' : 'fire';
    if (order.type === 'siege') return moving && !activeBattle && order.route.length > 2 ? 'march' : 'siege';
    if (order.type === 'defend') return moving ? 'march' : 'defend';
    if (order.type === 'intercept') return moving ? 'march' : 'intercept';
    if (order.type === 'hold') return nightMode ? 'sleep' : 'hold';
    if (order.type === 'bombard') return 'bombard';
    return nightMode ? 'sleep' : 'idle';
  }

  function equipmentAction(action) {
    return action === 'march' ? 'march' : ['fire', 'siege', 'bombard'].includes(action) ? 'fire' : 'idle';
  }

  // ==================== 高清离屏 WebGL 精灵渲染缓存器 ====================
  function mat4Perspective(fov, aspect, near, far) {
    const f = 1.0 / Math.tan(fov / 2), nf = 1 / (near - far);
    return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]);
  }
  function mat4LookAt(eye, center, up) {
    const z = vNorm(vSub(eye, center)), x = vNorm(vCross(up, z)), y = vCross(z, x);
    return new Float32Array([
      x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0,
      -vDot(x, eye), -vDot(y, eye), -vDot(z, eye), 1
    ]);
  }

  function createRenderer({ resolution = 256 } = {}) {
    if (typeof document === 'undefined') return null;
    const SPRITE = Math.max(64, Math.min(640, Math.round(Number(resolution) || 256)));
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = SPRITE;
    const gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: false, powerPreference: 'high-performance' });
    if (!gl) return null;

    const vsSrc = `
      attribute vec3 aPos;
      attribute vec3 aNorm;
      attribute vec3 aCol;
      attribute vec2 aMat;
      uniform mat4 uProj;
      uniform mat4 uView;
      varying vec3 vPos;
      varying vec3 vNorm;
      varying vec3 vCol;
      varying vec2 vMat;
      void main() {
        vec4 wp = vec4(aPos, 1.0);
        vPos = wp.xyz;
        vNorm = aNorm;
        vCol = aCol;
        vMat = aMat;
        gl_Position = uProj * uView * wp;
      }
    `;
    const fsSrc = `
      precision mediump float;
      varying vec3 vPos;
      varying vec3 vNorm;
      varying vec3 vCol;
      varying vec2 vMat;
      uniform vec3 uCam;
      uniform float uNight;
      void main() {
        vec3 N = normalize(vNorm);
        vec3 V = normalize(uCam - vPos);
        vec3 L1 = normalize(vec3(0.52, 0.80, 0.56));
        vec3 L2 = normalize(vec3(-0.65, 0.42, -0.45));
        float ndl1 = max(dot(N, L1), 0.0);
        float ndl2 = max(dot(N, L2), 0.0);
        float hemi = N.y * 0.5 + 0.5;
        float ao = clamp(0.68 + vPos.y * 0.34, 0.62, 1.0);
        vec3 amb = mix(vec3(0.28, 0.27, 0.24), vec3(0.50, 0.53, 0.56), hemi) * ao;
        float metal = vMat.x;
        float rough = clamp(vMat.y, 0.08, 0.98);
        vec3 H1 = normalize(L1 + V);
        float spec = pow(max(dot(N, H1), 0.0), mix(96.0, 8.0, rough)) * mix(0.18, 0.92, metal);
        vec3 specCol = mix(vec3(1.0), vCol * 1.3, metal);
        float emissive = rough < 0.20 && metal < 0.05 ? 0.82 : 0.0;
        float rim = pow(1.0 - max(dot(N, V), 0.0), 2.8) * 0.22;
        vec3 diffCol = vCol * (1.0 - metal * 0.36);
        vec3 sunTint = uNight > 0.5 ? vec3(0.58, 0.68, 0.92) : vec3(1.06, 1.00, 0.92);
        vec3 color = diffCol * (amb * (uNight > 0.5 ? 0.72 : 1.0) + ndl1 * sunTint + ndl2 * vec3(0.32, 0.36, 0.44))
          + specCol * spec + vCol * emissive + vec3(0.75, 0.80, 0.86) * rim;
        color = pow(clamp(color, 0.0, 1.0), vec3(0.90));
        gl_FragColor = vec4(color, 1.0);
      }
    `;

    const compile = (type, src) => {
      const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    };
    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, vsSrc));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fsSrc));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
    gl.useProgram(prog);
    gl.enable(gl.DEPTH_TEST);

    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    for (const [name, sz, off] of [['aPos', 3, 0], ['aNorm', 3, 12], ['aCol', 3, 24], ['aMat', 2, 36]]) {
      const loc = gl.getAttribLocation(prog, name);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, sz, gl.FLOAT, false, 44, off);
    }
    const uProj = gl.getUniformLocation(prog, 'uProj');
    const uView = gl.getUniformLocation(prog, 'uView');
    const uCam = gl.getUniformLocation(prog, 'uCam');
    const uNight = gl.getUniformLocation(prog, 'uNight');

    const spriteCache = new Map();
    const MAX_CACHE = 320;

    function cameraFor(kind, action, side) {
      const dir = side === 'ccp' ? 1 : -1;
      if (kind === 'carrier' || kind === 'battleship' || kind === 'yamato' || kind === 'uboat') {
        return { eye: [dir * 3.9, 2.2, 4.0], center: [0, 0.58, 0.0], fov: 0.98 };
      }
      if (kind === 'jet' || kind === 'mig15' || kind === 'f86' || kind === 'b29' || kind === 'zero' || kind === 'spitfire' || kind === 'stuka' || kind === 'il2' || kind === 'p40' || kind === 'aircraft') {
        return { eye: [dir * 3.6, 2.3, 3.6], center: [0, 0.88, 0.02], fov: 1.0 };
      }
      if (kind === 't34' || kind === 'm26' || kind === 'sherman' || kind === 'charb1' || kind === 'tiger' || kind === 'churchill' || kind === 'chiha' || kind === 'katyusha') {
        return { eye: [dir * 3.2, 1.8, 3.2], center: [0, 0.52, 0.06], fov: 0.96 };
      }
      if (kind === 'ship' || kind === 'warship') {
        return { eye: [dir * 3.4, 1.9, 3.5], center: [0, 0.56, 0.06], fov: 0.98 };
      }
      if (kind === 'tank') {
        return { eye: [dir * 3.5, 1.9, 3.5], center: [0, 0.66, 0.08], fov: 0.98 };
      }
      if (kind === 'artillery') {
        return { eye: [dir * 3.5, 1.9, 3.5], center: [0, 0.56, 0.0], fov: 1.04 };
      }
      if (kind === 'aircraft') {
        return { eye: [dir * 3.7, 2.8, 3.5], center: [0, 0.84, 0.05], fov: 1.0 };
      }
      if (action === 'sleep') {
        return { eye: [dir * 3.0, 2.2, 2.9], center: [-0.08, 0.22, 0.04], fov: 0.98 };
      }
      if (action === 'rest') {
        return { eye: [dir * 2.8, 1.8, 3.1], center: [-0.06, 0.62, 0.08], fov: 0.98 };
      }
      if (action === 'entrench' || action === 'defend' || action === 'siege' || action === 'intercept') {
        return { eye: [dir * 2.9, 1.9, 3.1], center: [0, 0.68, 0.16], fov: 1.02 };
      }
      return { eye: [dir * 2.8, 1.8, 3.4], center: [0, 0.84, 0.04], fov: 0.98 };
    }

    function frame(side, moving = false, timeMs = 0, kind = 'human', action = moving ? 'march' : 'idle', variant = '', orbit = 0) {
      const normalizedSide = side === 'ccp' ? 'ccp' : 'roc';
      const normalizedKind = kind === 'warship' ? 'ship' : kind;
      const isStatic = !moving && ['idle', 'hold'].includes(action);
      const step = isStatic ? 0 : Math.floor((Math.max(0, Number(timeMs) || 0)) / 110) % 10;
      const orbitStep = Math.round((Number(orbit) || 0) / (Math.PI / 4));
      const key = `${normalizedSide}|${variant}|${normalizedKind}|${action}|${step}|${orbitStep}`;
      if (spriteCache.has(key)) return spriteCache.get(key);

      const phase = step * (Math.PI * 2 / 10);
      const built = buildKindScene(normalizedKind, normalizedSide, action, phase, variant);
      const cam = cameraFor(normalizedKind, action, normalizedSide);
      if (orbitStep) {
        const angle = orbitStep * Math.PI / 4, dx = cam.eye[0] - cam.center[0], dz = cam.eye[2] - cam.center[2];
        cam.eye[0] = cam.center[0] + dx * Math.cos(angle) + dz * Math.sin(angle);
        cam.eye[2] = cam.center[2] - dx * Math.sin(angle) + dz * Math.cos(angle);
      }

      gl.viewport(0, 0, SPRITE, SPRITE);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
      gl.bufferData(gl.ARRAY_BUFFER, built.data, gl.STREAM_DRAW);

      gl.uniformMatrix4fv(uProj, false, mat4Perspective(cam.fov, 1.0, 0.1, 25.0));
      gl.uniformMatrix4fv(uView, false, mat4LookAt(cam.eye, cam.center, [0, 1, 0]));
      gl.uniform3fv(uCam, cam.eye);
      gl.uniform1f(uNight, action === 'sleep' ? 1.0 : 0.0);
      gl.drawArrays(gl.TRIANGLES, 0, built.tris * 3);

      const outCanvas = document.createElement('canvas');
      outCanvas.width = outCanvas.height = SPRITE;
      outCanvas.getContext('2d').drawImage(canvas, 0, 0);
      if (spriteCache.size >= MAX_CACHE) {
        const oldest = spriteCache.keys().next().value;
        spriteCache.delete(oldest);
      }
      spriteCache.set(key, outCanvas);
      return outCanvas;
    }

    return { frame, canvas };
  }

  globalThis.CivilWarHuman3D = {
    PEOPLE_PER_ICON, TANKS_PER_ICON, ARTILLERY_PER_ICON, PLANES_PER_ICON, SHIPS_PER_ICON,
    iconCount, tankIcons, artilleryIcons, regimentCount, airIcons, airRegiments,
    unitTanks, unitArtillery, troopTotals, formationStrengthByCity, supportIcons, fleetIcons, orderAction, equipmentAction,
    createMesh, buildKindScene, createRenderer,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = globalThis.CivilWarHuman3D;
})();
