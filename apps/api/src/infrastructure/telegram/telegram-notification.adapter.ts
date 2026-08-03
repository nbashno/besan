import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  NotificationPort,
  OutboundNotification,
} from '@application/ports/notification.port';

// المبدأ: البوت للإشعارات فقط؛ لا منطق أعمال هنا
@Injectable()
export class TelegramNotificationAdapter extends NotificationPort {
  private readonly logger = new Logger(TelegramNotificationAdapter.name);
  private readonly apiBase: string;

  constructor(private readonly config: ConfigService) {
    super();
    const token = this.config.getOrThrow<string>('TELEGRAM_BOT_TOKEN');
    this.apiBase = `https://api.telegram.org/bot${token}`;
  }

  async send(n: OutboundNotification): Promise<void> {
    const text = n.body ? `*${n.title}*\n${n.body}` : `*${n.title}*`;
    const body: Record<string, unknown> = {
      chat_id: n.telegramId.toString(),
      text,
      parse_mode: 'Markdown',
    };
    if (n.deepLink) {
      body.reply_markup = {
        inline_keyboard: [[{ text: 'فتح بيسان', url: n.deepLink }]],
      };
    }
    try {
      const res = await fetch(`${this.apiBase}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        this.logger.warn(`فشل إرسال إشعار Telegram: ${res.status}`);
      }
    } catch (err) {
      // الإشعار غير حرج — نسجّل ولا نُفشل العملية الأساسية
      this.logger.warn(`تعذّر إرسال إشعار Telegram: ${String(err)}`);
    }
  }
}
