import { createHmac } from 'crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface TelegramUser {
  id: bigint;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
}

export interface VerifiedInitData {
  user: TelegramUser;
  authDate: number;
}

// تنفيذ خوارزمية تحقق Telegram WebApp الرسمية:
// secret = HMAC_SHA256(key="WebAppData", msg=bot_token)
// expected = HMAC_SHA256(key=secret, msg=data_check_string)
// المقارنة بـ expected == hash القادم من العميل
@Injectable()
export class TelegramAuthVerifier {
  constructor(private readonly config: ConfigService) {}

  verify(initData: string): VerifiedInitData | null {
    const botToken = this.config.getOrThrow<string>('TELEGRAM_BOT_TOKEN');
    const maxAge = Number(
      this.config.get<string>('TELEGRAM_INITDATA_MAX_AGE') ?? '86400',
    );

    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) return null;
    params.delete('hash');

    // بناء data_check_string: المفاتيح مرتبة أبجديًا، مفصولة بسطر جديد
    const dataCheckString = [...params.entries()]
      .map(([k, v]) => `${k}=${v}`)
      .sort()
      .join('\n');

    const secret = createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();
    const expected = createHmac('sha256', secret)
      .update(dataCheckString)
      .digest('hex');

    if (expected !== hash) return null;

    // حماية ضد إعادة الإرسال: رفض البيانات القديمة
    const authDate = Number(params.get('auth_date') ?? '0');
    const nowSec = Math.floor(Date.now() / 1000);
    if (maxAge > 0 && nowSec - authDate > maxAge) return null;

    const userRaw = params.get('user');
    if (!userRaw) return null;

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(userRaw);
    } catch {
      return null;
    }
    if (typeof parsed.id !== 'number' && typeof parsed.id !== 'string') {
      return null;
    }

    return {
      authDate,
      user: {
        id: BigInt(parsed.id as number),
        first_name: String(parsed.first_name ?? ''),
        last_name: parsed.last_name ? String(parsed.last_name) : undefined,
        username: parsed.username ? String(parsed.username) : undefined,
        photo_url: parsed.photo_url ? String(parsed.photo_url) : undefined,
        language_code: parsed.language_code
          ? String(parsed.language_code)
          : undefined,
      },
    };
  }
}
