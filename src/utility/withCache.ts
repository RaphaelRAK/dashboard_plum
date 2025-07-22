import { cacheManager } from './cacheManager';

export const withCache = <T>(
  fetchFunction: (...args: any[]) => Promise<T>,
  keyPrefix: string,
  duration?: number
) => {
  return async (...args: any[]): Promise<T> => {
    const cacheKey = `${keyPrefix}-${JSON.stringify(args)}`;
    const cachedData = cacheManager.get(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    const data = await fetchFunction(...args);
    cacheManager.set(cacheKey, data, { duration });
    return data;
  };
}; 