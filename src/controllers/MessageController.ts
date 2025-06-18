import Controller from "./Controller";
import type { Request, Response } from "express";
import { Router } from "express";
import { prisma } from "@helpers/Prisma";
import { SocketService } from "@services/Socket";
import { autobind } from "@utils/Autobind";
import { joiValidate } from "@helpers/Joi";
import Joi from "joi";
import { saveFile } from "@helpers/File";
import { getCache } from "@helpers/Cache";

class MessageController extends Controller {
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
        this.router.get("/", this.contactIndex);
        this.router.get("/:user_id", this.index);
        this.router.post("/:user_id", this.store);
        this.router.put("/:user_id/:id", this.update);
        this.router.delete("/:user_id/:id", this.destroy);
    }

    public async contactIndex(req: Request, res: Response): Promise<Response> {
        try {
            const { page = 1, perPage = 10 } = req.query;
            const users = await prisma.user.findMany({
                skip: page ? (parseInt(page.toString()) - 1) * (perPage ? parseInt(perPage.toString()) : 10) : 0,
                take: perPage ? parseInt(perPage.toString()) : 10,
                distinct: ["id"],
                where: {
                    messagesReceived: {
                        some: {
                            sender: {
                                id: req.user.id,
                            },
                        },
                    },
                },
            });
            return super.success(
                res,
                users.map((user) => {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { password, ...userWithoutSensitiveData } = user;
                    return userWithoutSensitiveData;
                })
            );
        } catch (error: any) {
            console.error(error.message);
            return super.error(res);
        }
    }

    public async index(req: Request, res: Response): Promise<Response> {
        try {
            const { page = 1, perPage = 10 } = req.query;
            const { user_id } = req.params;
            const messages = await prisma.message.findMany({
                where: {
                    OR: [
                        { sender_id: req.user.id, receiver_id: parseInt(user_id) },
                        { sender_id: parseInt(user_id), receiver_id: req.user.id },
                    ],
                },
                skip: page ? (parseInt(page.toString()) - 1) * (perPage ? parseInt(perPage.toString()) : 10) : 0,
                take: perPage ? parseInt(perPage.toString()) : 10,
                orderBy: {
                    created_at: "asc",
                },
            });
            return super.success(res, messages);
        } catch (error: any) {
            console.error(error.message);
            return super.error(res);
        }
    }

    public async store(req: Request, res: Response): Promise<Response> {
        try {
            const { user_id } = req.params;
            const validationErrors = await joiValidate(
                req,
                Joi.object({
                    content: Joi.string().optional(),
                    medias: Joi.array().items(Joi.object()).optional(),
                })
            );
            if (validationErrors) return super.badRequest(res, validationErrors);

            if (req.body.medias && req.body.medias.length > 0) {
                const files = req.body.medias as Express.Multer.File[];
                req.body.medias = await Promise.all(
                    files.map(async (file) => {
                        const savedFile = await saveFile(file, "messages");
                        return {
                            filename: file.originalname,
                            filepath: savedFile,
                            filetype: file.mimetype,
                            filesize: file.size,
                        };
                    })
                );
            }

            const message = await prisma.message.create({
                data: {
                    sender_id: req.user.id,
                    receiver_id: parseInt(user_id),
                    content: req.body.content || null,
                    medias: req.body.medias
                        ? {
                              create: req.body.medias.map((media: any) => ({
                                  filename: media.filename,
                                  filepath: media.filepath,
                                  filetype: media.filetype,
                                  filesize: media.filesize,
                              })),
                          }
                        : undefined,
                },
                include: {
                    medias: true,
                },
            });

            const receiverSocketId = (await getCache(`socket:${user_id}`)) as string | null;
            if (receiverSocketId) {
                SocketService.getIO().to(receiverSocketId).emit("message", message);
            }

            return super.success(res);
        } catch (error: any) {
            console.error(error.message);
            return super.error(res);
        }
    }

    public async update(req: Request, res: Response): Promise<Response> {
        try {
            const { user_id, id } = req.params;
            const validationErrors = await joiValidate(
                req,
                Joi.object({
                    content: Joi.string().required(),
                })
            );
            if (validationErrors) return super.badRequest(res, validationErrors);

            if (req.body.medias && req.body.medias.length > 0) {
                const files = req.body.medias as Express.Multer.File[];
                req.body.medias = await Promise.all(
                    files.map(async (file) => {
                        const savedFile = await saveFile(file, "messages");
                        return {
                            filename: file.originalname,
                            filepath: savedFile,
                            filetype: file.mimetype,
                            filesize: file.size,
                        };
                    })
                );
            }

            const message = await prisma.message.update({
                where: {
                    id: parseInt(id),
                    sender_id: req.user.id,
                    receiver_id: parseInt(user_id),
                    content: {
                        not: null,
                    },
                },
                data: {
                    content: req.body.content || null,
                },
            });

            const receiverSocketId = (await getCache(`socket:${user_id}`)) as string | null;
            if (receiverSocketId) {
                SocketService.getIO().to(receiverSocketId).emit("message", message);
            }

            return super.success(res);
        } catch (error: any) {
            console.error(error.message);
            return super.error(res);
        }
    }

    public async destroy(req: Request, res: Response): Promise<Response> {
        try {
            const { user_id, id } = req.params;
            await prisma.message.delete({
                where: {
                    id: parseInt(id),
                    sender_id: req.user.id,
                    receiver_id: parseInt(user_id),
                },
            });

            return super.success(res);
        } catch (error: any) {
            console.error(error.message);
            return super.error(res);
        }
    }
}

export default new MessageController().getRouter();
