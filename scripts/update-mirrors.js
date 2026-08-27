const axios = require('axios');
const fs = require('fs');
const path = require('path');

const MIRROR_SOURCES = [
  'https://www.moretools.app/zh-CN/github-proxy',
  'https://gh-proxy.com/'
];

// 从页面内容提取镜像URL
const extractUrls = (text) => {
  const urlRegex = /https?:\/\/[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,}(?:\/[^\s"'<>]*)?/g;
  const matches = text.match(urlRegex) || [];
  const ghUrls = matches.filter(url =>
    url.includes('github') || url.includes('ghproxy') || url.includes('gh-proxy') ||
    url.includes('gh.') || url.includes('ghp.') || url.includes('git.') ||
    url.includes('proxy') || url.includes('fastgit')
  );
  return [...new Set(ghUrls)].filter(u => !u.includes('github.com') && !u.includes('github.io'));
};

const updateMirrors = async () => {
  console.log('开始自动更新镜像列表...');
  const existing = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'mirrors.json'), 'utf-8'));
  const existingUrls = new Set(existing.mirrors.map(m => m.url));
  let newMirrors = [];

  for (const source of MIRROR_SOURCES) {
    try {
      const res = await axios.get(source, { timeout: 10000 });
      const urls = extractUrls(res.data);
      urls.forEach(url => {
        if (!existingUrls.has(url)) {
          newMirrors.push({
            name: new URL(url).hostname,
            url: url,
            type: 'file-download',
            status: 'active',
            features: ['Releases', 'Raw', 'Archive']
          });
          existingUrls.add(url);
        }
      });
      console.log(`从 ${source} 提取到 ${urls.length} 个镜像`);
    } catch (e) {
      console.log(`更新 ${source} 失败: ${e.message}`);
    }
  }

  if (newMirrors.length > 0) {
    existing.mirrors.push(...newMirrors);
    existing.lastUpdated = new Date().toISOString();
    fs.writeFileSync(path.join(__dirname, '..', 'mirrors.json'), JSON.stringify(existing, null, 2));
    console.log(`新增 ${newMirrors.length} 个镜像，总计 ${existing.mirrors.length} 个`);
  } else {
    console.log('没有发现新镜像');
  }
};

updateMirrors();