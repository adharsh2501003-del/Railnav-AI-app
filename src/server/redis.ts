type RedisLike = { get(key: string): Promise<string | null>; set(key: string, value: string, ...args: string[]): Promise<unknown>; del(key: string): Promise<unknown> };
let client: RedisLike | undefined;
export async function getRedis(): Promise<RedisLike | undefined> {
  if (client || !process.env.REDIS_URL) return client;
  try {
    const redis = await import('redis');
    client = redis.createClient({ url: process.env.REDIS_URL }) as unknown as RedisLike;
    await (client as RedisLike & { connect(): Promise<void> }).connect();
    return client;
  } catch { return undefined; }
}
export async function cached<T>(key: string, loader: () => Promise<T>, ttlSeconds = 60): Promise<T> {
  const redis = await getRedis();
  if (!redis) return loader();
  const hit = await redis.get(key); if (hit) return JSON.parse(hit) as T;
  const value = await loader(); await redis.set(key, JSON.stringify(value), 'EX', String(ttlSeconds)); return value;
}
