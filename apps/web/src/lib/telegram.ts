'use client';

/**
 * غلاف حول Telegram WebApp SDK.
 * يوفّر initData للمصادقة، ويطبّق ثيم Telegram، ويتحكم بأزرار الواجهة.
 */

interface TelegramWebApp {
  initData: string;
  initDataUnsafe?: { start_param?: string };
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

export function getInitData(): string {
  const tg = getTelegram();
  // في التطوير خارج Telegram، نسمح بقيمة من متغيّر بيئة للاختبار
  if (!tg?.initData) {
    return process.env.NEXT_PUBLIC_DEV_INITDATA ?? '';
  }
  return tg.initData;
}

export function initTelegram(): 'light' | 'dark' {
  const tg = getTelegram();
  if (!tg) return 'light';
  tg.ready();
  tg.expand();
  return tg.colorScheme;
}

export function haptic(type: 'success' | 'error' | 'warning'): void {
  getTelegram()?.HapticFeedback?.notificationOccurred(type);
}

export function getStartParam(): string | null {
  if (typeof window === 'undefined') return null;
  const tg = getTelegram();
  const fromSdk = tg?.initDataUnsafe?.start_param;
  if (fromSdk) return fromSdk;
  // fallback من الرابط
  try {
    const parts = [
      window.location.hash.replace(/^#/, ''),
      window.location.search.replace(/^\?/, ''),
    ];
    for (const part of parts) {
      if (!part) continue;
      const v = new URLSearchParams(part).get('tgWebAppStartParam')
        || new URLSearchParams(part).get('startapp');
      if (v) return v;
    }
  } catch {}
  return null;
}
