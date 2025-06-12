import { Server as SocketIOServer } from "socket.io";
import type { Server as HTTPServer } from "http";
import { createClient } from "redis";
import { createAdapter } from "@socket.io/redis-adapter";

export class SocketService {
    private static io: SocketIOServer;

    static async init(server: HTTPServer): Promise<void> {
        this.io = new SocketIOServer(server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"],
            },
        });

        const isMasterInstance = process.env.NODE_APP_INSTANCE === "0";

        let redisConnected = false;

        try {
            const host = process.env.REDIS_HOST || "127.0.0.1";
            const port = process.env.REDIS_PORT || "6379";
            const user = process.env.REDIS_USER || "default";
            const pass = process.env.REDIS_PASSWORD || "";

            // Fix URL construction logic
            const redisUrl = `redis://${host}:${port}`;

            const pubClient = createClient({
                url: redisUrl,
                username: user,
                password: pass,
            });

            const subClient = pubClient.duplicate();

            await Promise.all([pubClient.connect(), subClient.connect()]);

            this.io.adapter(createAdapter(pubClient, subClient));

            redisConnected = true;
            console.log("✅ Redis connected, adapter enabled");
        } catch (error) {
            console.error("❌ Redis connection failed, running Socket.IO only on one instance", error);
        }

        if (!redisConnected) {
            if (!isMasterInstance) {
                console.log("Socket.IO disabled on this instance (not master)");
                this.io.close();
                return;
            } else {
                console.log("Socket.IO running on master instance without Redis adapter");
            }
        }

        this.io.on("connection", (socket) => {
            console.log("Client connected:", socket.id);
            
            socket.on("disconnect", () => {
                console.log("Client disconnected:", socket.id);
            });
        });
    }

    static getIO(): SocketIOServer {
        return this.io;
    }
}
