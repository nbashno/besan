// منفذ التخزين المؤقت — يعمل بلا Redis في الـMVP (تنفيذ داخل الذاكرة)، ويُبدَّل لاحقًا
export abstract class CachePort {
  abstract get<T>(key: string): Promise<T | null>;
  abstract set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  abstract del(key: string): Promise<void>;
}
