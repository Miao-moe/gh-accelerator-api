const express = require('express');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 3000;

const loadMirrors = () => {
  const data = fs.readFileSync(path.join(__dirname, 'mirrors.json'), 'utf-8');
  return JSON.parse(data);
};

app.use(express.static(path.join(__dirname, 'public')));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

// API: 获取所有镜像节点
app.get('/api/mirrors', (req, res) => {
  const data = loadMirrors();
  res.json({ success: true, total: data.mirrors.length, lastUpdated: data.lastUpdated, mirrors: data.mirrors });
});

// API: 只返回可用的文件加速节点
app.get('/api/proxies', (req, res) => {
  const data = loadMirrors();
  const proxies = data.mirrors.filter(m => m.status === 'active' && m.type === 'file-download').map(m => m.url);
  res.json({ success: true, total: proxies.length, proxies });
});

// API: 统计
app.get('/api/stats', (req, res) => {
  const data = loadMirrors();
  const stats = { total: data.mirrors.length, byType: {}, lastUpdated: data.lastUpdated };
  data.mirrors.forEach(m => { stats.byType[m.type] = (stats.byType[m.type] || 0) + 1; });
  res.json({ success: true, stats });
});

// 代理转发 - 实际下载文件并返回给用户
app.get('/dl/*', async (req, res) => {
  const mirrorIndex = parseInt(req.query.mirror) || 0;
  const ghPath = req.params[0];
  const ghUrl = 'https://' + ghPath;

  if (!ghPath.includes('github.com') && !ghPath.includes('raw.githubusercontent.com')) {
    return res.status(400).send('仅支持 GitHub 链接');
  }

  const data = loadMirrors();
  const proxies = data.mirrors.filter(m => m.status === 'active' && m.type === 'file-download');
  if (proxies.length === 0) return res.status(503).send('无可用节点');

  const idx = Math.min(mirrorIndex, proxies.length - 1);
  const proxyUrl = proxies[idx].url.replace(/\/$/, '') + '/' + ghPath;

  const protocol = proxyUrl.startsWith('https') ? https : http;
  protocol.get(proxyUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (proxyRes) => {
    // 跟随重定向
    if (proxyRes.statusCode >= 300 && proxyRes.statusCode < 400 && proxyRes.headers.location) {
      const redirectUrl = proxyRes.headers.location;
      const redProto = redirectUrl.startsWith('https') ? https : http;
      redProto.get(redirectUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (redRes) => {
        res.writeHead(redRes.statusCode, {
          'Content-Type': redRes.headers['content-type'] || 'application/octet-stream',
          'Content-Disposition': 'attachment',
          'Content-Length': redRes.headers['content-length'] || 0,
        });
        redRes.pipe(res);
      }).on('error', () => res.status(502).send('代理请求失败'));
      return;
    }
    // 提取文件名
    const filename = ghPath.split('/').pop();
    res.writeHead(proxyRes.statusCode, {
      'Content-Type': proxyRes.headers['content-type'] || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': proxyRes.headers['content-length'] || 0,
    });
    proxyRes.pipe(res);
  }).on('error', () => res.status(502).send('代理请求失败'));
});

// 快捷路径: /gh/owner/repo/releases/download/tag/file
app.get('/gh/:owner/:repo/releases/download/:tag/:file', (req, res) => {
  const { owner, repo, tag, file } = req.params;
  const ghPath = `github.com/${owner}/${repo}/releases/download/${tag}/${file}`;
  const mirror = req.query.mirror || 0;
  res.redirect(`/dl/${ghPath}?mirror=${mirror}`);
});

// 快捷路径: /raw/owner/repo/branch/path
app.get('/raw/:owner/:repo/:branch/*', (req, res) => {
  const { owner, repo, branch } = req.params;
  const filePath = req.params[0];
  const ghPath = `raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
  const mirror = req.query.mirror || 0;
  res.redirect(`/dl/${ghPath}?mirror=${mirror}`);
});

app.listen(PORT, () => {
  console.log(`GitHub Accelerator running on port ${PORT}`);
});
