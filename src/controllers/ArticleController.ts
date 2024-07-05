import type { Request, Response } from "express";
import { Router } from "express";
import Controller from "./Controller";
import { PrismaClient } from "@prisma/client";
import { ArticleResource } from "../resources";
import { body, validationResult } from "express-validator";
import saveFile from "../helpers/File";
import slug from "slug";
import path from "path";
import fs from "fs";

const prisma = new PrismaClient();

class ArticleController extends Controller {
    private router: Router;

    constructor() {
        super();
        this.router = Router();
        this.routes();
    }

    public getRouter(): Router {
        return this.router;
    }

    private routes(): void {
        this.router.get("/", this.index);
        this.router.get("/:slug", this.show);
        this.router.post("/", this.validateStore, this.store);
        this.router.put("/:id", this.update);
        this.router.delete("/:id", this.destroy);
    }

    private async index(req: Request, res: Response) {
        try {
            const { page = 1, perPage = 10 } = req.query;
            const articles = await prisma.article.findMany({
                include: {
                    images: true,
                },
                skip: page ? (parseInt(page.toString()) - 1) * (perPage ? parseInt(perPage.toString()) : 10) : 0,
                take: perPage ? parseInt(perPage.toString()) : 10,
            });
            return super.success(res, "success", new ArticleResource().collection(articles));
        } catch (error: any) {
            console.error(error.message);
            return super.error(res, error.message);
        }
    }

    private async show(req: Request, res: Response) {
        try {
            const { slug } = req.params;
            const article = await prisma.article.findUnique({
                include: {
                    images: true,
                },
                where: {
                    slug: slug.toString(),
                },
            });
            if (!article) return super.notFound(res, "Not Found");
            return super.success(res, "success", new ArticleResource().get(article));
        } catch (error: any) {
            console.error(error.message);
            return super.error(res, error.message);
        }
    }

    private validateStore = [
        body("title", "title is required").notEmpty(),
        body("content", "content is required").notEmpty(),
    ];
    private async store(req: Request, res: Response) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return super.badRequest(res, "invalid request", errors.array());

            if (!req.files) return super.error(res, "Please upload a file");

            const files = req.files as Express.Multer.File[];
            const images = await Promise.all(
                files.map(async (file) => {
                    return await saveFile(file, "articles");
                })
            );

            const { title, content } = req.body;
            const newSlug = slug(title.toString(), { lower: true });

            const checkSlug = await prisma.article.findUnique({
                include: {
                    images: true,
                },
                where: {
                    slug: newSlug,
                },
            });
            if (checkSlug) return super.badRequest(res, "title already exists");

            const newArticle = await prisma.article.create({
                data: {
                    slug: newSlug,
                    title: title.toString(),
                    content: content.toString(),
                    images: {
                        createMany: {
                            data: images.map((image) => {
                                return {
                                    path: image,
                                };
                            }),
                        },
                    },
                },
            });

            const article = await prisma.article.findUnique({
                include: {
                    images: true,
                },
                where: {
                    id: newArticle.id,
                },
            });

            return super.success(res, "success", new ArticleResource().get(article));
        } catch (error: any) {
            console.error(error.message);
            return super.error(res, error.message);
        }
    }

    private async update(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { title, content } = req.body;
            const article = await prisma.article.update({
                where: {
                    id: parseInt(id),
                },
                data: {
                    title: title.toString(),
                    content: content.toString(),
                },
            });

            return super.success(res, "success", new ArticleResource().get(article));
        } catch (error: any) {
            console.error(error.message);
            return super.error(res, error.message);
        }
    }

    private async destroy(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const article = await prisma.article.findUnique({
                where: {
                    id: parseInt(id),
                },
                include: {
                    images: true,
                },
            });

            if (!article) return super.notFound(res, "Not Found");
            if (article.images.length > 0) {
                article.images.forEach(async (image) => {
                    const imagePath = path.join(__dirname, "../public/uploads", image.path);
                    if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
                });
            }

            return super.success(res, "success");
        } catch (error: any) {
            console.error(error.message);
            return super.error(res, error.message);
        }
    }
}

export default new ArticleController().getRouter();
