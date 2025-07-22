import { CacheItem, CacheOptions } from '../types/cacheTypes';

const DEFAULT_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

class CacheManager {
  private static instance: CacheManager;
  private cache: Map<string, CacheItem>;

  private constructor() {
    this.cache = new Map();
  }

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  set(key: string, data: any, options: CacheOptions = {}): void {
    const timestamp = Date.now();
    const duration = options.duration || DEFAULT_CACHE_DURATION;
    this.cache.set(key, { data, timestamp, duration });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    const isExpired = Date.now() - item.timestamp > item.duration;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear(): void {
    this.cache.clear();
  }
}

export const cacheManager = CacheManager.getInstance(); 