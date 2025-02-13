import "dotenv/config";
import express from "express";
import type { Application, Request, Response } from "express";
import cors from "cors";
import compression from "compression";
import helmet from "helmet";
import http from "http";
import bodyParser from "body-parser";
import path from "path";

import { startCrons } from "@services/Crons";
import { prisma } from "@helpers/Prisma";
import { errsole, initializeErrsole } from "@services/Errsole";
import { SocketService } from "@services/Socket";
import { ApiKeyMiddleware, MulterMiddleware, MorganMiddleware } from "@middlewares/index";
import { NotificationController, AuthController, ArticleController } from "@controllers/index";

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
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: true }));
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
        this.app.use("/notifications", NotificationController);
        this.app.use("/articles", ArticleController);

        // dont change this route (for unknown route, send 404 response)
        this.app.all("*", (req: Request, res: Response) => {
            return res.status(404).json({
                data: null,
                message: "Route not found",
                status: 404,
            });
        });
    }

    public listen(): void {
        this.server.listen(this.port, () => {
            console.log(`App running on port :${this.port}`);
            prisma.$connect();
            startCrons();
            initializeErrsole();
            SocketService.init(this.server);
        });
    }
}

const app = new App(process.env.APP_PORT as unknown as number);
app.listen();
