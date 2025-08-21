class CacheService {
  private cache = new Map<string, { data: any; expires: number }>();
  
  set(key: string, data: any, ttlSeconds = 300) {
    this.cache.set(key, {
      data,
      expires: Date.now() + (ttlSeconds * 1000)
    });
  }
  
  get(key: string) {
    const item = this.cache.get(key);
    if (!item || Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    return item.data;
  }
  
  clear() {
    this.cache.clear();
  }
}

export const cache = new CacheService();