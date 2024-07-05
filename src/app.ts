import "dotenv/config";
import express from "express";
import type { Application, Request, Response } from "express";
import cors from "cors";
import morgan from "morgan";
import compression from "compression";
import helmet from "helmet";
import http from "http";
import bodyParser from "body-parser";
import path from "path";
import serveIndex from "serve-index";

import { ApiKeyMiddleware, MulterMiddleware } from "./middlewares";
import { NotificationController, AuthController, ArticleController } from "./controllers";

class App {
    public app: Application;
    public port: number;
    public server: http.Server;

    constructor(port: number) {
        this.app = express();
        this.server = http.createServer(this.app);
        this.port = port;
        this.plugins();
        this.middlewares();
        this.routes();
    }

    public plugins(): void {
        // insert plugins here
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: true }));
        this.app.use(MulterMiddleware);
        this.app.use(cors());
        this.app.use(morgan("dev"));
        this.app.use(compression());
        this.app.use(helmet());
        this.app.use(
            "/storage",
            express.static(path.join(__dirname, "public/uploads")),
            serveIndex(path.join(__dirname, "public/uploads"), { icons: true })
        );
    }

    public middlewares(): void {
        // insert middleware here
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
            console.log(`App listening on the http://localhost:${this.port}`);
        });
    }
}

const app = new App(process.env.APP_PORT as unknown as number);
app.listen();
