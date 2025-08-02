export interface CacheEntry {
  data: any;
  expires_at: Date;
  created_at: Date;
  metadata?: Record<string, any>;
}

export class CacheManager {
  private cache: Map<string, CacheEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Store data in cache with TTL
   */
  set(key: string, data: any, ttlSeconds: number, metadata?: Record<string, any>): void {
    const expires_at = new Date();
    expires_at.setSeconds(expires_at.getSeconds() + ttlSeconds);

    const entry: CacheEntry = {
      data,
      expires_at,
      created_at: new Date(),
      metadata
    };

    this.cache.set(key, entry);
  }

  /**
   * Get data from cache if not expired
   */
  get(key: string): any | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    if (entry.expires_at < new Date()) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    if (entry.expires_at < new Date()) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete specific key
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    total_entries: number;
    expired_entries: number;
    memory_usage_mb: number;
  } {
    const now = new Date();
    let expiredCount = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expires_at < now) {
        expiredCount++;
      }
    }

    return {
      total_entries: this.cache.size,
      expired_entries: expiredCount,
      memory_usage_mb: Math.round(JSON.stringify([...this.cache.entries()]).length / 1024 / 1024)
    };
  }

  /**
   * Generate cache key from tool execution parameters
   */
  generateToolCacheKey(tool: string, target: string, options: Record<string, any> = {}): string {
    const optionsHash = JSON.stringify(options);
    return `tool:${tool}:${target}:${Buffer.from(optionsHash).toString('base64')}`;
  }

  /**
   * Generate cache key for API responses
   */
  generateApiCacheKey(service: string, endpoint: string, params: Record<string, any> = {}): string {
    const paramsHash = JSON.stringify(params);
    return `api:${service}:${endpoint}:${Buffer.from(paramsHash).toString('base64')}`;
  }

  /**
   * Cache tool execution result
   */
  cacheToolResult(tool: string, target: string, result: any, ttlSeconds: number = 300): void {
    const key = this.generateToolCacheKey(tool, target);
    this.set(key, result, ttlSeconds, {
      tool,
      target,
      type: 'tool_result'
    });
  }

  /**
   * Get cached tool result
   */
  getCachedToolResult(tool: string, target: string): any | null {
    const key = this.generateToolCacheKey(tool, target);
    return this.get(key);
  }

  /**
   * Cache API response
   */
  cacheApiResponse(service: string, endpoint: string, response: any, ttlSeconds: number = 600): void {
    const key = this.generateApiCacheKey(service, endpoint);
    this.set(key, response, ttlSeconds, {
      service,
      endpoint,
      type: 'api_response'
    });
  }

  /**
   * Get cached API response
   */
  getCachedApiResponse(service: string, endpoint: string): any | null {
    const key = this.generateApiCacheKey(service, endpoint);
    return this.get(key);
  }

  /**
   * Remove expired entries
   */
  private cleanup(): void {
    const now = new Date();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expires_at < now) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key));
    
    if (expiredKeys.length > 0) {
      console.log(`Cleaned up ${expiredKeys.length} expired cache entries`);
    }
  }

  /**
   * Get cache entries by type
   */
  getEntriesByType(type: string): Array<{ key: string; entry: CacheEntry }> {
    const entries: Array<{ key: string; entry: CacheEntry }> = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.metadata?.type === type) {
        entries.push({ key, entry });
      }
    }

    return entries;
  }

  /**
   * Cleanup on shutdown
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

// Global cache instance
export const cacheManager = new CacheManager();