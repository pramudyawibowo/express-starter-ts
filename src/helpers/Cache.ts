import "dotenv/config";
import fs from "fs";
import path from "path";
import type { RedisClientType } from "redis";
import { redisManager, isRedisConnected } from "./Redis";

class CacheSystem {
    private static instance: CacheSystem;
    private client: RedisClientType;
    private readonly cacheFile: string = path.join(__dirname, "..", "public", "storage", "cache.json");
    private cacheData: Record<string, { value: any; expiresAt: number }> = {};
    private loggedFileCache: boolean = false;

    private constructor() {
        this.client = redisManager.getClient();
        this.setupEventHandlers();
        this.loadFileCache();
    }

    private setupEventHandlers(): void {
        this.client.on("error", () => {
            if (!this.loggedFileCache) {
                console.log("Using file-based cache.");
                this.loggedFileCache = true;
            }
        });
    }

    public static getInstance(): CacheSystem {
        if (!CacheSystem.instance) {
            CacheSystem.instance = new CacheSystem();
        }
        return CacheSystem.instance;
    }

    public async set(key: string, value: any, expired: number): Promise<void> {
        const data = JSON.stringify(value);
        if (isRedisConnected()) {
            await this.client.set(key, data, { EX: expired });
        } else {
            this.cacheData[key] = { value, expiresAt: Date.now() + expired * 1000 };
            this.saveFileCache();
        }
    }

    public async get<T>(key: string): Promise<T | null> {
        if (isRedisConnected()) {
            const result = await this.client.get(key);
            return result ? JSON.parse(result) : null;
        } else {
            return this.getFileCache<T>(key);
        }
    }

    public async delete(key: string): Promise<void> {
        if (isRedisConnected()) {
            await this.client.del(key);
        } else {
            delete this.cacheData[key];
            this.saveFileCache();
        }
    }

    public async flush(): Promise<void> {
        if (isRedisConnected()) {
            await this.client.flushAll();
        } else {
            this.cacheData = {};
            this.saveFileCache();
        }
    }

    public getClient(): RedisClientType {
        return this.client;
    }

    // File Cache Methods
    private loadFileCache(): void {
        try {
            if (fs.existsSync(this.cacheFile)) {
                const fileContent = fs.readFileSync(this.cacheFile, "utf-8");
                this.cacheData = JSON.parse(fileContent);
                this.cleanupExpiredCache();
            }
        } catch (error) {
            console.error("Error loading cache file:", error);
        }
    }

    private saveFileCache(): void {
        try {
            fs.mkdirSync(path.dirname(this.cacheFile), { recursive: true });
            fs.writeFileSync(this.cacheFile, JSON.stringify(this.cacheData, null, 2), "utf-8");
        } catch (error) {
            console.error("Error saving cache file:", error);
        }
    }

    private getFileCache<T>(key: string): T | null {
        const entry = this.cacheData[key];
        if (!entry || Date.now() > entry.expiresAt) {
            delete this.cacheData[key];
            this.saveFileCache();
            return null;
        }
        return entry.value as T;
    }

    private cleanupExpiredCache(): void {
        const now = Date.now();
        let modified = false;
        for (const key in this.cacheData) {
            if (this.cacheData[key].expiresAt < now) {
                delete this.cacheData[key];
                modified = true;
            }
        }
        if (modified) this.saveFileCache();
    }
}

export const cache = CacheSystem.getInstance();
export const setCache = (key: string, value: any, expired: number) => cache.set(key, value, expired);
export const getCache = <T>(key: string) => cache.get<T>(key);
export const deleteCache = (key: string) => cache.delete(key);
export const flushCache = () => cache.flush();
export const getRedisClient = (): RedisClientType => cache.getClient();