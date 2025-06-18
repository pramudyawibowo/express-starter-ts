import { Server as SocketIOServer } from "socket.io";
import type { Server as HTTPServer } from "http";
import { createClient } from "redis";
import { createAdapter } from "@socket.io/redis-adapter";
import { verifyAccessToken } from "@helpers/Jwt";
import { prisma } from "@helpers/Prisma";
import { deleteCache, setCache } from "@helpers/Cache";

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

            // Add error handlers for Redis clients
            pubClient.on("error", (err) => {
                console.error("Redis pub client error:", err);
            });

            subClient.on("error", (err) => {
                console.error("Redis sub client error:", err);
            });

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

        this.io.use(async (socket, next) => {
            const token = socket.handshake.auth.token || socket.handshake.query.token;
            if (token) {
                const decoded = await verifyAccessToken(token);
                if (!decoded) return next(new Error("Token Invalid"));
                const user = await prisma.user.findFirst({
                    where: {
                        phonenumber: decoded.phonenumber,
                    },
                });
                if (!user) return next(new Error("User Not Found"));

                (socket as any).user = user;
            }
            next();
        });

        this.io.on("connection", async (socket) => {
            if ((socket as any).user) {
                const userId = (socket as any).user.id;
                await setCache(`socket:${userId}`, socket.id, 3600);
            }

            socket.on("disconnect", async () => {
                if ((socket as any).user) {
                    const userId = (socket as any).user.id;
                    await deleteCache(`socket:${userId}`);
                }
            });
        });
    }

    static getIO(): SocketIOServer {
        return this.io;
    }
}
