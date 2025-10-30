'use client';

import { useEffect, useState } from 'react';

export function InstallPWAButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    // 检查是否已经安装
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone || isIOSStandalone);
    };

    checkInstalled();

    // 监听安装事件
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // 如果没有安装提示，显示手动安装说明
      setShowInstructions(true);
      return;
    }

    // 显示安装提示
    deferredPrompt.prompt();

    // 等待用户响应
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`用户选择: ${outcome}`);

    // 清除保存的提示
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  // 检测浏览器类型
  const isIOS = () => {
    return /iPhone|iPad|iPod/.test(navigator.userAgent);
  };

  const isSafari = () => {
    return /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
  };

  if (isInstalled) {
    return (
      <div className="rounded-lg bg-green-50 border border-green-200 p-4 dark:bg-green-900/20 dark:border-green-800">
        <div className="flex items-center gap-2">
          <span className="text-2xl">✅</span>
          <div>
            <p className="font-semibold text-green-900 dark:text-green-100">
              应用已安装
            </p>
            <p className="text-sm text-green-700 dark:text-green-300">
              你正在使用已安装的应用
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        onClick={handleInstallClick}
        className="w-full rounded-lg bg-emerald-600 px-6 py-3 text-white font-semibold shadow-lg hover:bg-emerald-500 transition-colors"
      >
        {isInstallable ? '📱 安装应用' : '📱 查看安装说明'}
      </button>

      {showInstructions && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 dark:bg-blue-900/20 dark:border-blue-800">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <span>ℹ️</span>
            如何安装 PWA
          </h3>

          {isIOS() && isSafari() ? (
            // iOS Safari 特殊说明
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-blue-900 dark:text-blue-100">
                iPhone/iPad 安装步骤：
              </p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>点击底部的 <strong>分享按钮</strong> (方框 + 向上箭头)</li>
                <li>向下滚动，找到 <strong>"添加到主屏幕"</strong></li>
                <li>点击 <strong>"添加"</strong></li>
                <li>完成！图标会出现在主屏幕上</li>
              </ol>
              <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  💡 提示：iOS 只支持在 Safari 浏览器中安装 PWA
                </p>
              </div>
            </div>
          ) : (
            // Android/Desktop 说明
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  Android Chrome/Edge：
                </p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>点击右上角 <strong>⋮</strong> (菜单)</li>
                  <li>选择 <strong>"安装应用"</strong> 或 <strong>"添加到主屏幕"</strong></li>
                  <li>点击 <strong>"安装"</strong></li>
                </ol>
              </div>

              <div>
                <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  桌面 Chrome/Edge：
                </p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>地址栏右侧会出现 <strong>⊕</strong> 安装图标</li>
                  <li>点击图标</li>
                  <li>点击 <strong>"安装"</strong></li>
                </ol>
              </div>

              <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  💡 提示：如果没有看到安装选项，尝试：
                </p>
                <ul className="list-disc list-inside ml-2 mt-1 text-xs">
                  <li>刷新页面</li>
                  <li>在页面停留 30 秒以上</li>
                  <li>使用 HTTPS 访问（或 localhost）</li>
                </ul>
              </div>
            </div>
          )}

          <button
            onClick={() => setShowInstructions(false)}
            className="mt-3 text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 font-medium"
          >
            关闭说明
          </button>
        </div>
      )}

      {!isInstallable && !showInstructions && (
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
          {isIOS() && isSafari()
            ? '点击上方按钮查看 iOS 安装说明'
            : '浏览器未触发自动安装提示，点击上方按钮查看手动安装步骤'}
        </p>
      )}
    </div>
  );
}
