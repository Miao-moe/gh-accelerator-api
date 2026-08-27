const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// 读取镜像数据
const loadMirrors = () => {
  const data = fs.readFileSync(path.join(__dirname, 'mirrors.json'), 'utf-8');
  return JSON.parse(data);
};

// 静态文件
app.use(express.static(path.join(__dirname, 'public')));

// API: 获取所有镜像
app.get('/api/mirrors', (req, res) => {
  const data = loadMirrors();
  res.json({
    success: true,
    total: data.mirrors.length,
    lastUpdated: data.lastUpdated,
    mirrors: data.mirrors
  });
});

// API: 按类型筛选
app.get('/api/mirrors/:type', (req, res) => {
  const data = loadMirrors();
  const filtered = data.mirrors.filter(m => m.type === req.params.type);
  res.json({
    success: true,
    type: req.params.type,
    total: filtered.length,
    mirrors: filtered
  });
});

// API: 随机获取一个镜像
app.get('/api/random', (req, res) => {
  const data = loadMirrors();
  const random = data.mirrors[Math.floor(Math.random() * data.mirrors.length)];
  res.json({ success: true, mirror: random });
});

// API: 搜索镜像
app.get('/api/search', (req, res) => {
  const { q } = req.query;
  const data = loadMirrors();
  const results = data.mirrors.filter(m =>
    m.name.toLowerCase().includes(q.toLowerCase()) ||
    m.url.toLowerCase().includes(q.toLowerCase())
  );
  res.json({ success: true, query: q, total: results.length, mirrors: results });
});

// API: 获取状态统计
app.get('/api/stats', (req, res) => {
  const data = loadMirrors();
  const stats = {
    total: data.mirrors.length,
    byType: {},
    lastUpdated: data.lastUpdated
  };
  data.mirrors.forEach(m => {
    stats.byType[m.type] = (stats.byType[m.type] || 0) + 1;
  });
  res.json({ success: true, stats });
});

// 主页
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`GitHub Accelerator API running on port ${PORT}`);
});