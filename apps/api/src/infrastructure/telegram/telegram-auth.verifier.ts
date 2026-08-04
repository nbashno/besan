import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as crypto from "crypto";

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

@Injectable()
export class TelegramAuthVerifier {
  constructor(private readonly config: ConfigService) {}

  verify(initData: string): TelegramUser {
    const botToken = this.config.get<string>("TELEGRAM_BOT_TOKEN");
    if (!botToken) {
      throw new UnauthorizedException("bot token missing");
    }

    // نعالج initData يدويا بدون فك ترميز القيم (Telegram وقع على القيم الخام)
    const pairs = initData.split("&");
    let hash = "";
    const dataPairs: string[] = [];

    for (const pair of pairs) {
      const idx = pair.indexOf("=");
      const key = pair.substring(0, idx);
      const value = pair.substring(idx + 1);
      if (key === "hash") {
        hash = value;
      } else {
        dataPairs.push(`${key}=${value}`);
      }
    }

    if (!hash) {
      throw new UnauthorizedException("hash missing");
    }

    // الترتيب الابجدي ثم الدمج باسطر
    dataPairs.sort();
    const dataCheckString = dataPairs.join("\n");

    // secret_key = HMAC_SHA256(bot_token, key="WebAppData")
    const secretKey = crypto
      .createHmac("sha256", "WebAppData")
      .update(botToken)
      .digest();

    const computedHash = crypto
      .createHmac("sha256", secretKey)
      .update(dataCheckString)
      .digest("hex");

    if (computedHash !== hash) {
      throw new UnauthorizedException("invalid init data signature");
    }

    // استخراج المستخدم (هنا نفك الترميز بعد التحقق)
    const userPair = dataPairs.find((p) => p.startsWith("user="));
    if (!userPair) {
      throw new UnauthorizedException("user data missing");
    }
    const userJson = decodeURIComponent(userPair.substring("user=".length));
    const user = JSON.parse(userJson) as TelegramUser;

    return user;
  }
}