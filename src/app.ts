import express from "express";
import type { Application, Request, Response, NextFunction, RequestHandler } from "express";
import http from "http";
import { startCrons } from "@services/Crons";
import { prisma } from "@helpers/Prisma";
import { errsole, initializeErrsole } from "@services/Errsole";
import { SocketService } from "@services/Socket";
import { ApiKeyMiddleware, MulterMiddleware, MorganMiddleware, AuthMiddleware } from "@middlewares/index";
import { NotificationController, AuthController, ArticleController, ArticleCategoryController, MessageController } from "@controllers/index";
import cors from "cors";
import compression from "compression";
import helmet from "helmet";
import path from "path";
import "dotenv/config";

class App {
    public app: Application;
    public port: number;
    public server: http.Server;

    constructor(port: number) {
        this.app = express();
        this.server = http.createServer(this.app);
        this.port = port;
        this.middlewares();
        this.routes();
    }

    public middlewares(): void {
        // insert middleware here
        this.app.use("/errsole", errsole.expressProxyMiddleware());
        this.app.use(MorganMiddleware);
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use(MulterMiddleware);
        this.app.use(cors());
        this.app.use(compression());
        this.app.use(
            helmet({
                crossOriginResourcePolicy: false,
                crossOriginEmbedderPolicy: false,
            })
        );
        this.app.use("/storage", express.static(process.env.STORAGE_PATH || path.join(__dirname, "public/storage/media")));
        this.app.use(ApiKeyMiddleware);
    }

    public routes(): void {
        // insert routes here
        this.app.use("/", AuthController);
        this.app.use("/notifications", AuthMiddleware, NotificationController);
        this.app.use("/article-categories", AuthMiddleware, ArticleCategoryController);
        this.app.use("/articles", AuthMiddleware, ArticleController);
        this.app.use("/messages", AuthMiddleware, MessageController); // Import MessageController dynamically

        // Handle unknown routes (catch-all route)
        const notFoundHandler: RequestHandler = (_req: Request, res: Response, _next: NextFunction): void => {
            res.status(404).json({
                data: null,
                message: "Route not found",
                status: 404,
            });
        };

        this.app.all("*", notFoundHandler); // Use the function handler directly
    }

    public async listen(): Promise<void> {
        this.server.listen(this.port, async () => {
            console.log(`App running on port: ${this.port}`);

            try {
                await prisma.$connect();
                SocketService.init(this.server);

                const isPrimaryInstance =
                    process.env.NODE_APP_INSTANCE === "0" ||
                    process.env.PM2_INSTANCE_ID === "0" ||
                    (process.env.NODE_APP_INSTANCE === undefined && process.env.PM2_INSTANCE_ID === undefined);

                if (isPrimaryInstance) {
                    console.log("Primary worker instance detected - starting cron jobs");
                    startCrons();
                } else {
                    console.log(`Worker instance ${process.env.NODE_APP_INSTANCE || process.env.PM2_INSTANCE_ID} - skipping cron initialization`);
                }
            } catch (err) {
                console.error("Failed to initialize DB or crons:", err);
                process.exit(1);
            }
        });

        process.on("SIGTERM", this.gracefulShutdown.bind(this));
        process.on("SIGINT", this.gracefulShutdown.bind(this));

        process.on("uncaughtException", (err) => {
            console.error("Uncaught Exception:", err);
            this.gracefulShutdown();
        });

        process.on("unhandledRejection", (reason) => {
            console.error("Unhandled Promise Rejection:", reason);
            this.gracefulShutdown();
        });
    }

    private async gracefulShutdown(): Promise<void> {
        console.log("Gracefully shutting down...");

        const forcedExitTimeout = setTimeout(() => {
            console.error("Forced shutdown initiated after timeout");
            process.exit(1);
        }, 10000); // 10 seconds timeout

        try {
            await Promise.all([prisma.$disconnect()]);

            this.server.close(() => {
                console.log("Server closed successfully");
                clearTimeout(forcedExitTimeout);
                process.exit(0);
            });
        } catch (err) {
            console.error("Error during shutdown:", err);
            clearTimeout(forcedExitTimeout);
            process.exit(1);
        }
    }
}

initializeErrsole();
const app = new App(Number(process.env.APP_PORT) || 3000); // Fallback to 3000 if APP_PORT is not set
app.listen();
