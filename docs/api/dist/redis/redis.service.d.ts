import type { Redis } from 'ioredis';
export declare class RedisService {
    private readonly client;
    constructor(client: Redis);
    getClient(): Redis;
    isLive(): boolean;
    get(key: string): Promise<string | null>;
    set(key: string, value: string, ttlSeconds?: number): Promise<'OK' | null>;
    setNxEx(key: string, value: string, ttlSeconds: number): Promise<boolean>;
    del(key: string): Promise<number>;
    eval(script: string, numKeys: number, ...args: (string | number)[]): Promise<unknown>;
    ping(): Promise<string>;
}
//# sourceMappingURL=redis.service.d.ts.map