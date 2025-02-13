import { Server as SocketIOServer } from "socket.io";
import type { Server as HTTPServer } from "http";

export class SocketService {
    private static io: SocketIOServer;

    static init(server: HTTPServer): void {
        this.io = new SocketIOServer(server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"],
            },
        });

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
