#!/usr/bin/env node
'use strict';

// 战图 · 国共内战 · 静态服务器
// 用法：node scripts/serve.cjs [端口]
// 只读取游戏目录内的文件，不依赖任何第三方包，可在任意装有 Node.js 的电脑上运行。

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const root = path.resolve(__dirname, '..');
const port = Number(process.argv[2]) || 8099;
const host = process.env.HOST || '0.0.0.0';

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.map': 'application/json; charset=utf-8',
};

function resolve(urlPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath.split('?')[0]);
  } catch {
    return null;
  }
  if (decoded === '/' || decoded === '') decoded = '/index.html';
  const target = path.join(root, path.normalize(decoded));
  if (!target.startsWith(root + path.sep) && target !== root) return null;
  return target;
}

const server = http.createServer((request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' });
    response.end('Method Not Allowed');
    return;
  }
  const file = resolve(request.url || '/');
  if (!file) {
    response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('路径无效');
    return;
  }
  fs.stat(file, (error, stat) => {
    if (error || !stat.isFile()) {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('未找到该文件：' + request.url);
      return;
    }
    const type = types[path.extname(file).toLowerCase()] || 'application/octet-stream';
    const headers = {
      'Content-Type': type,
      'Content-Length': stat.size,
      'Cache-Control': type.startsWith('text/html') ? 'no-cache' : 'public, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
    };
    response.writeHead(200, headers);
    if (request.method === 'HEAD') {
      response.end();
      return;
    }
    fs.createReadStream(file).on('error', () => response.destroy()).pipe(response);
  });
});

server.listen(port, host, () => {
  const addresses = ['http://localhost:' + port];
  for (const list of Object.values(os.networkInterfaces())) {
    for (const item of list || []) {
      if (item.family === 'IPv4' && !item.internal) addresses.push('http://' + item.address + ':' + port);
    }
  }
  console.log('战图 · 国共内战 已启动');
  console.log('游戏目录：' + root);
  console.log('本机访问：' + addresses[0]);
  for (const address of addresses.slice(1)) console.log('局域网访问：' + address);
  console.log('按 Ctrl+C 停止。');
});

server.on('error', (error) => {
  console.error('启动失败：' + error.message);
  process.exitCode = 1;
});
