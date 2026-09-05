import { Redis, RedisOptions } from 'ioredis';

export interface RedisConnectionConfig {
  host?: string;
  port?: number;
  password?: string;
  url?: string;
  maxRetriesPerRequest?: number | null;
  enableReadyCheck?: boolean;
}

let sharedRedisClient: Redis | null = null;

export function getRedisConnectionConfig(): RedisOptions {
  const isTest = process.env['NODE_ENV'] === 'test';
  const redisUrl = process.env['REDIS_URL'];

  const baseOptions: RedisOptions = {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    connectTimeout: isTest ? 500 : 5000,
    enableOfflineQueue: !isTest,
    retryStrategy: (times: number) => {
      return Math.min(times * 100, 3000);
    },
  };

  if (redisUrl) {
    return baseOptions;
  }

  return {
    ...baseOptions,
    host: process.env['REDIS_HOST'] || 'localhost',
    port: Number(process.env['REDIS_PORT'] || 6379),
    password: process.env['REDIS_PASSWORD'] || undefined,
  };
}

export function createRedisClient(customConfig?: RedisOptions): Redis {
  const config = customConfig || getRedisConnectionConfig();
  const redisUrl = process.env['REDIS_URL'];

  const client = redisUrl ? new Redis(redisUrl, config) : new Redis(config);

  client.on('error', (err) => {
    // Suppress spam during test runs when Redis is not running
    if (process.env['NODE_ENV'] !== 'test') {
      console.warn('[Redis] Connection warning:', err.message);
    }
  });

  return client;
}

export function getSharedRedisClient(): Redis {
  if (!sharedRedisClient) {
    sharedRedisClient = createRedisClient();
  }
  return sharedRedisClient;
}
