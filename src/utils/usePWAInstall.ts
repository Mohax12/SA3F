import { useEffect, useState } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    // Detect standalone mode (already installed or running inside PWA wrapper)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      localStorage.getItem('warsh_pwa_installed') === 'true';
    setIsInstalled(isStandalone);

    // Detect user agents
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(ua) && !(window as any).MSStream;
    const isAndroidDevice = /android/.test(ua);
    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowInstallBanner(false);
      try {
        localStorage.setItem('warsh_pwa_installed', 'true');
      } catch (err) {}
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Auto-prompt upon entering website (if not already installed or dismissed in this session)
    const dismissedThisSession = sessionStorage.getItem('warsh_install_dismissed');
    if (!isStandalone && !dismissedThisSession) {
      const timer = setTimeout(() => {
        setShowInstallBanner(true);
      }, 1500);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async (): Promise<boolean> => {
    if (!deferredPrompt) {
      return false;
    }
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        setShowInstallBanner(false);
        return true;
      }
    } catch (e) {
      console.warn('PWA install error:', e);
    }
    return false;
  };

  const dismissBanner = () => {
    setShowInstallBanner(false);
    try {
      sessionStorage.setItem('warsh_install_dismissed', 'true');
    } catch (e) {}
  };

  const markAsInstalled = () => {
    setIsInstalled(true);
    setDeferredPrompt(null);
    setShowInstallBanner(false);
    try {
      localStorage.setItem('warsh_pwa_installed', 'true');
    } catch (err) {}
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    isAndroid,
    showInstallBanner,
    setShowInstallBanner,
    dismissBanner,
    install,
    markAsInstalled,
  };
}
