// منفذ الإشعارات — Telegram الآن، ثم Email/SMS/Push لاحقًا بلا تغيير منطق الأعمال
export interface OutboundNotification {
  telegramId: bigint;
  title: string;
  body?: string;
  deepLink?: string;
}

export abstract class NotificationPort {
  abstract send(notification: OutboundNotification): Promise<void>;
}
