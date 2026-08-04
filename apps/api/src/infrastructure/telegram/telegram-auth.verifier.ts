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

    const params = new URLSearchParams(initData);
    const hash = params.get("hash");
    if (!hash) {
      throw new UnauthorizedException("hash missing");
    }
    params.delete("hash");

    const dataCheckString = [...params.entries()]
      .map(([k, v]) => `${k}=${v}`)
      .sort()
      .join("\n");

    const secret = crypto
      .createHmac("sha256", "WebAppData")
      .update(botToken)
      .digest();

    const computed = crypto
      .createHmac("sha256", secret)
      .update(dataCheckString)
      .digest("hex");

    if (computed !== hash) {
      throw new UnauthorizedException("invalid init data signature");
    }

    const maxAge = Number(this.config.get<string>("TELEGRAM_INITDATA_MAX_AGE") ?? "86400");
    const authDate = Number(params.get("auth_date") ?? "0");
    const now = Math.floor(Date.now() / 1000);
    if (maxAge > 0 && now - authDate > maxAge) {
      throw new UnauthorizedException("init data expired");
    }

    const userRaw = params.get("user");
    if (!userRaw) {
      throw new UnauthorizedException("user data missing");
    }
    return JSON.parse(userRaw) as TelegramUser;
  }
}