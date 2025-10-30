'use client';

import { useEffect, useState } from 'react';

export function InstallBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // 检查是否已经安装
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (window.navigator as any).standalone === true;
    const isInstalled = isStandalone || isIOSStandalone;

    // 检查是否已经关闭过横幅
    const bannerDismissed = localStorage.getItem('installBannerDismissed');

    if (!isInstalled && !bannerDismissed) {
      setShowBanner(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    const handleAppInstalled = () => {
      setShowBanner(false);
      localStorage.setItem('installBannerDismissed', 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        setShowBanner(false);
        localStorage.setItem('installBannerDismissed', 'true');
      }

      setDeferredPrompt(null);
    } else {
      // 跳转到安装说明页面
      window.location.href = '/pwa-check';
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('installBannerDismissed', 'true');
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-md">
      <div className="rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 p-4 shadow-2xl backdrop-blur">
        <div className="flex items-start gap-3">
          <span className="text-3xl">📱</span>
          <div className="flex-1">
            <h3 className="font-semibold text-white mb-1">
              Installa Task Pilot
            </h3>
            <p className="text-sm text-emerald-50 mb-3">
              Usa come App
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleInstall}
                className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50 transition-colors"
              >
                Installa
              </button>
              <button
                onClick={handleDismiss}
                className="rounded-lg bg-emerald-600/50 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600/70 transition-colors"
              >
                Dopo
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-white hover:text-emerald-100 transition-colors"
            aria-label="close"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
