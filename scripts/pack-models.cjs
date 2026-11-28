'use strict';
// 把 model-review 里的 .glb 打包成可直接被 index.html 引用的 models-3d.js
const fs = require('node:fs');
const path = require('node:path');

const SRC = 'C:/Users/21203/Desktop/国共/model-review';
const OUT = 'C:/Users/21203/Desktop/国共/国共内战策略游戏/models-3d.js';

const ASSETS = [
  'tank', 'light_tank', 'heavy_tank',
  'artillery', 'self_propelled_artillery',
  'aircraft', 'warship',
  'armored_train', 'mechanized', 'motorized',
];

const parts = [];
let total = 0;
for (const name of ASSETS) {
  const file = path.join(SRC, name + '.glb');
  const buf = fs.readFileSync(file);
  total += buf.length;
  parts.push('  ' + JSON.stringify(name) + ': ' + JSON.stringify(buf.toString('base64')));
  console.log(name.padEnd(26), String(Math.round(buf.length / 1024)).padStart(5) + ' KB');
}

const header = `/* 战图·国共内战 · 外部 3D 模型库
 * 本文件由 scripts/pack-models.cjs 从 model-review/*.glb 自动生成，请勿手改。
 * 直接内嵌 GLB 二进制（base64），双击 index.html 离线运行也能加载，无需服务器。
 * 来源模型：model-review（Blender 导出的统一兵牌模型，已剔除「统一兵牌底座」展示台）。
 * 资产：${ASSETS.join(' / ')}
 * 合计 ${Math.round(total / 1024)} KB
 */
globalThis.CivilWarModels3D = {
${parts.join(',\n')}
};
`;

fs.writeFileSync(OUT, header, 'utf8');
console.log('\n写入', OUT, Math.round(fs.statSync(OUT).size / 1024), 'KB');
