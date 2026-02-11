import Redis from 'ioredis';

export class CacheService {
  private client: Redis | null = null;
  private isEnabled: boolean = false;

  constructor() {
    // Don't initialize in constructor - do it asynchronously later
  }

  async initialize(): Promise<void> {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      const cacheEnabled = process.env.CACHE_ENABLED !== 'false'; // Default to true

      if (!cacheEnabled) {
        console.log('🔄 Cache is disabled via CACHE_ENABLED=false');
        return;
      }

      this.client = new Redis(redisUrl, {
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        connectTimeout: 5000, // 5 second timeout
        commandTimeout: 3000, // 3 second command timeout
      });

      // Test connection with timeout
      await Promise.race([
        this.client.ping(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Redis connection timeout')), 5000)
        )
      ]);

      this.isEnabled = true;
      console.log('🔄 Redis cache connected successfully');
    } catch (error) {
      console.warn('⚠️  Redis cache connection failed:', error instanceof Error ? error.message : String(error));
      this.client = null;
      this.isEnabled = false;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isEnabled || !this.client) return null;

    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.warn('Cache get error:', error instanceof Error ? error.message : String(error));
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    if (!this.isEnabled || !this.client) return;

    try {
      const serializedValue = JSON.stringify(value);
      const defaultTtl = parseInt(process.env.CACHE_TTL || '3600'); // 1 hour default
      const ttl = ttlSeconds || defaultTtl;

      await this.client.setex(key, ttl, serializedValue);
    } catch (error) {
      console.warn('Cache set error:', error instanceof Error ? error.message : String(error));
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.isEnabled || !this.client) return;

    try {
      await this.client.del(key);
    } catch (error) {
      console.warn('Cache delete error:', error instanceof Error ? error.message : String(error));
    }
  }

  async deletePattern(pattern: string): Promise<void> {
    if (!this.isEnabled || !this.client) return;

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch (error) {
      console.warn('Cache delete pattern error:', error instanceof Error ? error.message : String(error));
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.isEnabled || !this.client) return false;

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.warn('Cache exists error:', error.message);
      return false;
    }
  }

  async clear(): Promise<void> {
    if (!this.isEnabled || !this.client) return;

    try {
      await this.client.flushall();
    } catch (error) {
      console.warn('Cache clear error:', error instanceof Error ? error.message : String(error));
    }
  }

  isCacheEnabled(): boolean {
    return this.isEnabled;
  }

  async getStats(): Promise<any> {
    if (!this.isEnabled || !this.client) return { enabled: false };

    try {
      const info = await this.client.info();
      return {
        enabled: true,
        connected_clients: this.client.status === 'ready',
        info: info
      };
    } catch (error) {
      return { enabled: false, error: error.message };
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.disconnect();
      this.client = null;
      this.isEnabled = false;
    }
  }
}

// Singleton instance
let cacheServiceInstance: CacheService | null = null;

export async function initializeCache(): Promise<void> {
  if (!cacheServiceInstance) {
    cacheServiceInstance = new CacheService();
    await cacheServiceInstance.initialize();
  }
}

export function getCacheService(): CacheService | null {
  return cacheServiceInstance;
}

// Cache key generators
export const CacheKeys = {
  note: (id: string) => `note:${id}`,
  workspace: (id: string) => `workspace:${id}`,
  workspaceNotes: (workspaceId: string) => `workspace:${workspaceId}:notes`,
  userWorkspaces: (userId: string) => `user:${userId}:workspaces`,
  permission: (userId: string, resourceId: string) => `permission:${userId}:${resourceId}`,
  auditLogs: (workspaceId: string, limit: number, skip: number) => `audit:${workspaceId}:${limit}:${skip}`,
  noteVersions: (noteId: string) => `note:${noteId}:versions`,
};
