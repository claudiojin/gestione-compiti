'use client';

import { useEffect, useState } from 'react';
import { InstallPWAButton } from '@/components/install-pwa-button';

export default function PWACheckPage() {
  const [checks, setChecks] = useState({
    https: false,
    manifest: false,
    serviceWorker: false,
    icons: false,
    displayMode: '',
    installable: false,
    installed: false,
  });

  useEffect(() => {
    // Check HTTPS
    const isHTTPS = window.location.protocol === 'https:' || window.location.hostname === 'localhost';

    // Check manifest - Next.js 15+ auto-generates manifest route
    const hasManifest = true; // manifest.ts auto-generates /manifest.webmanifest

    // Check if already installed
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone === true;

    // Check display mode
    let displayMode = 'browser';
    if (window.matchMedia('(display-mode: standalone)').matches) {
      displayMode = 'standalone';
    } else if (window.matchMedia('(display-mode: fullscreen)').matches) {
      displayMode = 'fullscreen';
    } else if (window.matchMedia('(display-mode: minimal-ui)').matches) {
      displayMode = 'minimal-ui';
    }

    setChecks({
      https: isHTTPS,
      manifest: hasManifest,
      serviceWorker: 'serviceWorker' in navigator,
      icons: true, // Will check via fetch
      displayMode,
      installable: false, // Will be updated by beforeinstallprompt
      installed: isInstalled,
    });

    // Check if app is installable
    let deferredPrompt: any = null;

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      setChecks(prev => ({ ...prev, installable: true }));
    });

    // Check manifest via fetch
    fetch('/manifest.webmanifest')
      .then(res => res.json())
      .then(data => {
        console.log('Manifest loaded:', data);
        setChecks(prev => ({ ...prev, manifest: true }));
      })
      .catch(err => {
        console.error('Failed to load manifest:', err);
        setChecks(prev => ({ ...prev, manifest: false }));
      });

    // Test icon loading
    const img = new Image();
    img.onload = () => {
      setChecks(prev => ({ ...prev, icons: true }));
    };
    img.onerror = () => {
      setChecks(prev => ({ ...prev, icons: false }));
    };
    img.src = '/icon-192.png';

  }, []);

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">PWA 安装检查</h1>

      <div className="space-y-4">
        <CheckItem
          label="HTTPS / Localhost"
          passed={checks.https}
          message={checks.https ? "✓ 使用安全连接" : "✗ 需要 HTTPS 或 localhost"}
        />

        <CheckItem
          label="Manifest 文件"
          passed={checks.manifest}
          message={checks.manifest ? "✓ Manifest 已加载" : "✗ 未找到 manifest"}
        />

        <CheckItem
          label="图标文件"
          passed={checks.icons}
          message={checks.icons ? "✓ 图标可访问" : "✗ 图标加载失败"}
        />

        <CheckItem
          label="Service Worker 支持"
          passed={checks.serviceWorker}
          message={checks.serviceWorker ? "✓ 浏览器支持 Service Worker" : "✗ 浏览器不支持"}
        />

        <CheckItem
          label="可安装性"
          passed={checks.installable}
          message={checks.installable ? "✓ 应用可以安装" : "⚠ 等待安装提示（可能需要刷新）"}
        />

        <CheckItem
          label="已安装"
          passed={checks.installed}
          message={checks.installed ? "✓ 应用已安装（standalone 模式）" : "ℹ 应用未安装"}
        />
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">安装应用</h2>
        <InstallPWAButton />
      </div>

      <div className="mt-8 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
        <h2 className="font-semibold mb-2">当前显示模式:</h2>
        <p className="text-sm">{checks.displayMode}</p>
      </div>

      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h2 className="font-semibold mb-2">调试信息:</h2>
        <div className="text-sm space-y-1">
          <p>协议: {typeof window !== 'undefined' ? window.location.protocol : ''}</p>
          <p>主机: {typeof window !== 'undefined' ? window.location.hostname : ''}</p>
          <p>User Agent: {typeof navigator !== 'undefined' ? navigator.userAgent.substring(0, 50) + '...' : ''}</p>
        </div>
      </div>

      <div className="mt-8 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
        <h2 className="font-semibold mb-2">如何安装:</h2>
        <ul className="text-sm space-y-2 list-disc list-inside">
          <li><strong>Android Chrome:</strong> 菜单 → "安装应用" 或 "添加到主屏幕"</li>
          <li><strong>iOS Safari:</strong> 分享按钮 → "添加到主屏幕"</li>
          <li><strong>桌面 Chrome:</strong> 地址栏右侧的安装图标</li>
          <li>如果没有看到安装选项，确保使用 HTTPS 并刷新页面</li>
        </ul>
      </div>

      <div className="mt-4">
        <a
          href="/"
          className="inline-block px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500"
        >
          返回主页
        </a>
      </div>
    </div>
  );
}

function CheckItem({ label, passed, message }: { label: string; passed: boolean; message: string }) {
  return (
    <div className={`p-4 rounded-lg border-2 ${
      passed
        ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
        : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
    }`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl">
          {passed ? '✓' : '✗'}
        </span>
        <div>
          <h3 className="font-semibold">{label}</h3>
          <p className="text-sm mt-1">{message}</p>
        </div>
      </div>
    </div>
  );
}
