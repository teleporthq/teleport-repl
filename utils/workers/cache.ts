export class CacheService {
  cache: Record<string, unknown> = {}

  setCache(key: string, value: unknown) {
    this.cache = {
      ...this.cache,
      [key]: value,
    }
  }

  isCachedModule(key: string) {
    return Boolean(this.cache[key]) ?? false
  }

  getCache() {
    return this.cache
  }
}
