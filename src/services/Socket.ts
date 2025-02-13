import { Server as SocketIOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';

export class SocketService {
    private io: SocketIOServer;

    constructor(server: HTTPServer) {
        this.io = new SocketIOServer(server, {
            cors: {
                origin: '*',
                methods: ['GET', 'POST']
            }
        });

        this.setupSocketEvents();
    }

    private setupSocketEvents(): void {
        this.io.on('connection', (socket) => {
            console.log('Client connected:', socket.id);

            socket.on('disconnect', () => {
                console.log('Client disconnected:', socket.id);
            });
        });
    }

    public getIO(): SocketIOServer {
        return this.io;
    }
}