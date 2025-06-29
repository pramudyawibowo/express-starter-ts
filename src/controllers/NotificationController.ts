import Controller from "./Controller";
import type { Request, Response } from "express";
import { Router } from "express";
import NotificationResource from "@resources/NotificationResource";
import { prisma } from "@helpers/Prisma";
import { SocketService } from "@services/Socket";
import { autobind } from "@utils/Autobind";
import Joi from "joi";
import { joiValidate } from "@helpers/Joi";

class NotificationController extends Controller {
    private router: Router;

    constructor() {
        super();
        this.router = Router();
        autobind(this);
        this.routes();
    }

    public getRouter(): Router {
        return this.router;
    }

    public routes(): void {
        this.router.get("/", this.index);
        this.router.get("/:id", this.show);
        this.router.post("/", this.store);
        this.router.put("/:id", this.update);
        this.router.delete("/:id", this.destroy);
    }

    public async index(req: Request, res: Response): Promise<Response> {
        try {
            const { page = 1, perPage = 10 } = req.query;
            const notifications = await prisma.notification.findMany({
                skip: page ? (parseInt(page.toString()) - 1) * (perPage ? parseInt(perPage.toString()) : 10) : 0,
                take: perPage ? parseInt(perPage.toString()) : 10,
            });
            return super.success(res, new NotificationResource().collection(notifications));
        } catch (error: any) {
            console.error(error);
            return super.error(res);
        }
    }

    public async show(req: Request, res: Response): Promise<Response> {
        try {
            const { id } = req.params;
            const notification = await prisma.notification.findUnique({
                where: {
                    id: parseInt(id),
                },
            });
            if (!notification) return super.notFound(res, "Not Found");
            return super.success(res, new NotificationResource().get(notification));
        } catch (error: any) {
            console.error(error);
            return super.error(res);
        }
    }

    public async store(req: Request, res: Response): Promise<Response> {
        try {
            const schema = Joi.object({
                title: Joi.string().required(),
                message: Joi.string().required(),
                json: Joi.object().optional(),
            });

            const validationErrors = await joiValidate(req, schema);
            if (validationErrors) return super.badRequest(res, validationErrors);

            const { title, message } = req.body;
            const notification = await prisma.notification.create({
                data: {
                    title: title,
                    message: message,
                    json: req.body.json ? req.body.json : null,
                },
            });

            const socket = SocketService.getIO();
            socket.emit("notification", notification);

            return super.success(res, new NotificationResource().get(notification));
        } catch (error: any) {
            console.error(error);
            return super.error(res);
        }
    }

    public async update(req: Request, res: Response): Promise<Response> {
        try {
            const schema = Joi.object({
                title: Joi.string().optional(),
                message: Joi.string().optional(),
                json: Joi.object().optional(),
            });
            const validationErrors = await joiValidate(req, schema);
            if (validationErrors) return super.badRequest(res, validationErrors);

            const { id } = req.params;
            const { title, message } = req.body;

            const data: any = {};
            if (title) data.title = title;
            if (message) data.message = message;
            if (req.body.json) data.json = req.body.json;

            const notification = await prisma.notification.update({
                where: {
                    id: parseInt(id),
                },
                data: {
                    ...data,
                },
            });

            return super.success(res, new NotificationResource().get(notification));
        } catch (error: any) {
            console.error(error);
            return super.error(res);
        }
    }

    public async destroy(req: Request, res: Response): Promise<Response> {
        try {
            const { id } = req.params;
            await prisma.notification.delete({
                where: {
                    id: parseInt(id),
                },
            });
            return super.success(res);
        } catch (error: any) {
            console.error(error);
            return super.error(res);
        }
    }
}

export default new NotificationController().getRouter();
