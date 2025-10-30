# PWA 配置指南

你的应用现在已经配置为 PWA（Progressive Web App），可以像原生应用一样安装和使用！

## 已完成的配置

✅ PWA Manifest 文件 (`/public/manifest.json`)
✅ 应用图标（占位符）
✅ Meta 标签配置（在 `app/layout.tsx`）
✅ 主题颜色和状态栏样式

## 如何使用

### 在手机上安装（类似 App）

#### Android (Chrome/Edge)
1. 在手机浏览器中打开你的网站
2. 点击浏览器菜单（三个点）
3. 选择"添加到主屏幕"或"安装应用"
4. 应用图标会出现在主屏幕上
5. 点击图标启动，看起来就像原生应用！

#### iOS (Safari)
1. 在 Safari 中打开你的网站
2. 点击底部的"分享"按钮
3. 向下滚动，选择"添加到主屏幕"
4. 点击"添加"
5. 应用图标会出现在主屏幕上

### 桌面版本

#### Chrome/Edge/Brave
1. 打开网站
2. 地址栏右侧会出现"安装"图标
3. 点击安装
4. 应用会作为独立窗口运行

## 自定义图标

当前使用的是占位符图标。要替换成真实图标：

1. 创建你的应用图标（PNG 格式）
2. 生成不同尺寸：
   - 192x192 像素 → 保存为 `public/icon-192.png`
   - 512x512 像素 → 保存为 `public/icon-512.png`

### 快速生成图标的工具

- **在线工具**: https://realfavicongenerator.net/
- **PWA Builder**: https://www.pwabuilder.com/imageGenerator

## PWA 的优势

- ✅ **离线访问**（未来可以添加 Service Worker）
- ✅ **全屏体验**：没有浏览器地址栏，看起来像原生应用
- ✅ **添加到主屏幕**：像 App 一样启动
- ✅ **推送通知**（可选，需要额外配置）
- ✅ **无需应用商店**：直接通过网址安装
- ✅ **自动更新**：刷新页面即可获得最新版本

## 下一步（可选）

### 添加 Service Worker（离线支持）

如果你想让应用支持离线访问，可以：

1. 安装 next-pwa：
```bash
npm install next-pwa
```

2. 更新 `next.config.ts`：
```typescript
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development'
})

module.exports = withPWA({
  // 你的现有配置
})
```

## 测试 PWA

1. 运行开发服务器：`npm run dev`
2. 在 Chrome DevTools 中：
   - 打开 Application 标签
   - 查看 Manifest 部分
   - 测试"添加到主屏幕"功能

## 部署

PWA 需要 HTTPS 才能完全工作（开发环境除外）。确保你的生产环境使用 HTTPS。

Vercel、Netlify 等平台会自动提供 HTTPS。
