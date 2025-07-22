export interface CacheItem {
  data: any;
  timestamp: number;
  duration: number;
}

export interface CacheOptions {
  duration?: number;
} 