'use client';

interface TelegramWebApp {
  initData: string;
  colorScheme: 'light' | 'dark';
  themeParams: Record<string, string>;
  ready: () => void;
  expand: () => void;
  close: () => void;
  MainButton: {
    setText: (t: string) => void;
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
  };
  HapticFeedback?: {
    impactOccurred: (style: string) => void;
    notificationOccurred: (type: string) => void;
  };
}

declare global {
  interface Window {
    Telegram?: { WebApp: TelegramWebApp };
  }
}

export function getTelegram(): TelegramWebApp | null {
  if (typeof window === 'undefined') return null;
  return window.Telegram?.WebApp ?? null;
}

// Fallback: Telegram always passes init data in the page URL as tgWebAppData
function initDataFromUrl(): string {
  if (typeof window === 'undefined') return '';
  const parts = [
    window.location.hash.replace(/^#/, ''),
    window.location.search.replace(/^\?/, ''),
  ];
  for (const part of parts) {
    if (!part) continue;
    try {
      const raw = new URLSearchParams(part).get('tgWebAppData');
      if (raw) return raw;
    } catch {
      // ignore malformed
    }
  }
  return '';
}

export function getInitData(): string {
  const fromSdk = getTelegram()?.initData;
  if (fromSdk) return fromSdk;
  const fromUrl = initDataFromUrl();
  if (fromUrl) return fromUrl;
  return process.env.NEXT_PUBLIC_DEV_INITDATA ?? '';
}

export function initTelegram(): 'light' | 'dark' {
  const tg = getTelegram();
  if (!tg) return 'light';
  try {
    tg.ready();
    tg.expand();
  } catch {
    // ignore
  }
  return tg.colorScheme ?? 'light';
}

export function haptic(type: 'success' | 'error' | 'warning'): void {
  try {
    getTelegram()?.HapticFeedback?.notificationOccurred(type);
  } catch {
    // ignore
  }
}