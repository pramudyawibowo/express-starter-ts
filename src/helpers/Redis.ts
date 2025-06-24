import "dotenv/config";
import type { RedisClientType } from "redis";
import { createClient } from "redis";

class RedisManager {
    private static instance: RedisManager;
    private client: RedisClientType;
    private isConnected: boolean = false;
    private reconnectAttempts: number = 0;
    private readonly MAX_RECONNECT_ATTEMPTS = 10;

    private constructor() {
        const user = process.env.REDIS_USER || "default";
        const pass = process.env.REDIS_PASSWORD || "";
        const host = process.env.REDIS_HOST || "127.0.0.1";
        const port = process.env.REDIS_PORT || "6379";

        const url = `redis://${host}:${port}`;

        this.client = createClient({
            url: url,
            username: user,
            password: pass,
            socket: {
                reconnectStrategy: (retries) => {
                    if (retries > this.MAX_RECONNECT_ATTEMPTS) {
                        this.isConnected = false;
                        return new Error("Redis max reconnection attempts reached");
                    }
                    return Math.min(retries * 100, 3000);
                },
            },
        });
        this.setupEventHandlers();
        this.connect();
    }

    private setupEventHandlers(): void {
        this.client.on("error", () => {
            this.isConnected = false;
        });
        this.client.on("connect", () => {
            this.isConnected = true;
            console.log("Redis connected successfully");
        });
    }

    private async connect(): Promise<void> {
        try {
            await this.client.connect();
        } catch {
            this.isConnected = false;
        }
    }

    public static getInstance(): RedisManager {
        if (!RedisManager.instance) {
            RedisManager.instance = new RedisManager();
        }
        return RedisManager.instance;
    }

    public getClient(): RedisClientType {
        return this.client;
    }

    public isRedisConnected(): boolean {
        return this.isConnected;
    }
}

export const redisManager = RedisManager.getInstance();
export const getRedisClient = (): RedisClientType => redisManager.getClient();
export const isRedisConnected = (): boolean => redisManager.isRedisConnected();
