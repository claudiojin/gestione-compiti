# PWA 安装问题排查指南

## 快速诊断工具

访问 `/pwa-check` 页面来检查你的 PWA 配置状态。这个页面会自动检测：
- HTTPS 状态
- Manifest 文件
- 图标文件
- 可安装性
- 当前显示模式

## 常见问题和解决方案

### 1. 必须使用 HTTPS（最常见原因）

**问题**: PWA 安装选项不显示

**原因**: 浏览器要求 PWA 必须通过 HTTPS 访问（localhost 除外）

**解决方案**:
- ✅ **开发环境**: `localhost` 或 `127.0.0.1` 不需要 HTTPS
- ✅ **生产环境**: 必须部署到支持 HTTPS 的服务器
  - Vercel / Netlify / Railway 等平台自动提供 HTTPS
  - 自己的服务器需要配置 SSL 证书（Let's Encrypt 免费）

**测试**:
```bash
# 本地开发测试
npm run dev
# 然后访问 http://localhost:3000
```

### 2. 不同浏览器的安装方式

#### Android Chrome/Edge
1. 打开网站后，点击右上角 **⋮** (三个点菜单)
2. 查找以下选项之一：
   - "安装应用"
   - "添加到主屏幕"
   - "Install app"
3. 如果没有看到，尝试：
   - 刷新页面
   - 访问至少 30 秒
   - 确保使用 HTTPS 或 localhost

#### iOS Safari
⚠️ **重要**: iOS Safari 不显示"安装"按钮！

正确步骤：
1. 点击底部的 **分享按钮** (方框加向上箭头)
2. 向下滚动
3. 选择 "**添加到主屏幕**"
4. 点击"添加"

注意：
- iOS 只支持 Safari 浏览器安装 PWA
- Chrome/Firefox 等第三方浏览器在 iOS 上无法安装 PWA

#### 桌面 Chrome/Edge/Brave
1. 地址栏右侧会出现 **⊕** 或 **💻** 安装图标
2. 点击图标即可安装
3. 如果没有图标，确保：
   - 使用 HTTPS
   - 刷新页面
   - manifest.json 可访问

### 3. 检查 Manifest 文件

打开浏览器开发者工具：

**Chrome/Edge**:
1. 按 `F12` 打开开发者工具
2. 点击 **Application** 标签
3. 左侧找到 **Manifest** 部分
4. 检查是否有错误

**常见问题**:
- ❌ Manifest 文件 404（未找到）
- ❌ 图标路径错误
- ❌ JSON 格式错误

**解决方案**:
```bash
# 检查文件是否存在
ls -la public/manifest.json
ls -la public/icon-*.png

# 测试访问
curl http://localhost:3000/manifest.json
curl http://localhost:3000/icon-192.png
```

### 4. Service Worker（可选，但推荐）

虽然不是必须的，但有 Service Worker 会提高安装成功率。

**检查是否需要**:
- 如果 manifest 和 HTTPS 都正确，但仍无法安装
- 考虑添加 Service Worker

**简单的 Service Worker**:

创建 `public/sw.js`:
```javascript
self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating.');
});
```

注册 Service Worker (在 `app/layout.tsx` 添加):
```typescript
// 在客户端组件中
useEffect(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js');
  }
}, []);
```

### 5. 浏览器限制

某些浏览器对 PWA 有额外要求：

**Chrome/Edge 要求**:
- ✅ HTTPS 或 localhost
- ✅ 有效的 manifest.json
- ✅ 至少一个 icon (192x192 或更大)
- ✅ `start_url` 和 `display: standalone`

**Safari 限制**:
- ⚠️ 必须使用 Safari 浏览器
- ⚠️ 不显示自动安装提示
- ⚠️ 用户必须手动"添加到主屏幕"

**Firefox**:
- ⚠️ Android 版本支持较弱
- ⚠️ 可能需要 Service Worker

### 6. 调试步骤

#### 步骤 1: 访问诊断页面
```
http://localhost:3000/pwa-check
```

#### 步骤 2: 检查控制台
打开浏览器开发者工具（F12），查看 Console 是否有错误

#### 步骤 3: 检查网络
在 Network 标签中，确保：
- `manifest.json` 返回 200 状态
- `icon-192.png` 和 `icon-512.png` 返回 200 状态

#### 步骤 4: 验证 Manifest
```bash
# 访问 manifest 文件
curl http://localhost:3000/manifest.json | jq
```

应该看到类似：
```json
{
  "name": "Gestione Compiti",
  "short_name": "Compiti",
  "start_url": "/",
  "display": "standalone",
  ...
}
```

### 7. 部署注意事项

#### Vercel 部署
```bash
# 确保 vercel.json 正确配置
{
  "headers": [
    {
      "source": "/manifest.json",
      "headers": [
        {
          "key": "Content-Type",
          "value": "application/manifest+json"
        }
      ]
    }
  ]
}
```

#### Nginx 配置
```nginx
location /manifest.json {
    add_header Content-Type application/manifest+json;
}
```

### 8. 快速测试清单

- [ ] 使用 HTTPS 或 localhost
- [ ] 访问 `/pwa-check` 页面，所有项都是绿色 ✓
- [ ] 打开 DevTools → Application → Manifest（无错误）
- [ ] 图标文件可以访问（`/icon-192.png`）
- [ ] 刷新页面并等待 30 秒
- [ ] 在正确的浏览器中查找安装选项

### 9. 仍然无法安装？

如果以上都检查过了，尝试：

1. **清除浏览器缓存**
2. **使用隐身/无痕模式**
3. **尝试不同的浏览器**
4. **重启浏览器**
5. **在 Android 设备上测试**（最容易成功）

### 10. 联系支持

如果问题依然存在，收集以下信息：
- 浏览器和版本
- 操作系统
- `/pwa-check` 页面的截图
- 浏览器控制台的错误信息
- DevTools → Application → Manifest 的截图

## 成功安装后

安装成功后：
- 主屏幕会出现应用图标
- 点击图标会全屏打开（无浏览器界面）
- 应用会记住登录状态
- 可以像原生应用一样使用

## 更新应用

PWA 会自动更新：
- 用户下次打开应用时会加载新版本
- 或者用户在浏览器中刷新页面
- 无需重新安装
