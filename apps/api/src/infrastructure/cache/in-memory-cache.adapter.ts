import { Injectable } from '@nestjs/common';
import { CachePort } from '@application/ports/cache.port';

interface Entry { value: unknown; expiresAt: number | null; }

// تنفيذ افتراضي للـMVP — يُستبدل بمحوّل Redis لاحقًا دون تغيير المستهلكين
@Injectable()
export class InMemoryCacheAdapter extends CachePort {
  private store = new Map<string, Entry>();

  async get<T>(key: string): Promise<T | null> {
    const e = this.store.get(key);
    if (!e) return null;
    if (e.expiresAt !== null && Date.now() > e.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return e.value as T;
  }
  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
    });
  }
  async del(key: string): Promise<void> {
    this.store.delete(key);
  }
}
