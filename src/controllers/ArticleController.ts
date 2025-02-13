import type { Request, Response } from "express";
import { Router } from "express";
import Controller from "./Controller";
import { ArticleResource } from "@resources/index";
import { deleteFile, saveFile } from "@helpers/File";
import slug from "slug";
import { validate as uuidValidate } from "uuid";
import { prisma } from "@helpers/Prisma";
import { joiValidate } from "@helpers/Joi";
import Joi from "joi";

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
        this.router.get("/:parameter", this.show);
        this.router.post("/", this.store);
        this.router.put("/:parameter", this.update);
        this.router.delete("/:parameter", this.destroy);
    }

    private async index(req: Request, res: Response) {
        try {
            const { page = 1, perPage = 10, search, all, orderby = "id", order = "desc" } = req.query;
            const pageNum = parseInt(page.toString()) || 1;
            const itemsPerPage = parseInt(perPage.toString()) || 10;
            const searchTerm = search?.toString() || "";
            const showAll = all === "true" || all === "1";

            const allowedColumns = Object.keys(prisma.article.fields);
            const orderByColumn = orderby?.toString() || "id";
            if (!allowedColumns.includes(orderByColumn))
                return super.badRequest(res, `Invalid orderby parameter. Allowed values: ${allowedColumns.join(", ")}`);

            const orderValue = order?.toString().toLowerCase();
            if (orderValue !== "asc" && orderValue !== "desc") return super.badRequest(res, "Invalid order parameter. Use 'asc' or 'desc'");

            const articles = await prisma.article.findMany({
                include: { images: true },
                where: {
                    OR: [{ title: { contains: searchTerm, mode: "insensitive" } }, { content: { contains: searchTerm, mode: "insensitive" } }],
                },
                ...(showAll
                    ? {}
                    : {
                          skip: (pageNum - 1) * itemsPerPage,
                          take: itemsPerPage,
                      }),
                orderBy: {
                    [orderByColumn.toString()]: orderValue,
                },
            });
            return super.success(res, "success", new ArticleResource().collection(articles));
        } catch (error: any) {
            console.error(error.message);
            return super.error(res, error.message);
        }
    }

    private async show(req: Request, res: Response) {
        try {
            const { parameter } = req.params;
            const isValidUUID = uuidValidate(parameter);
            const article = await prisma.article.findFirst({
                include: {
                    images: true,
                },
                where: {
                    OR: [
                        { id: isNaN(+parameter) ? undefined : +parameter },
                        { slug: parameter },
                        { uuid: isValidUUID ? parameter : undefined },
                    ].filter((condition) => Object.values(condition)[0] !== undefined),
                },
            });
            if (!article) return super.notFound(res, "Not Found");
            return super.success(res, "success", new ArticleResource().get(article));
        } catch (error: any) {
            console.error(error.message);
            return super.error(res, error.message);
        }
    }

    private async store(req: Request, res: Response) {
        try {
            const validationErrors = await joiValidate(
                Joi.object({
                    title: Joi.string().required(),
                    content: Joi.string().required(),
                    image: Joi.object().optional().messages({
                        "object.base": "image harus berupa file",
                    }),
                    images: Joi.array().items(Joi.object()).optional().messages({
                        "array.base": "images harus berupa array",
                        "array.unique": "images tidak boleh memiliki elemen duplikat",
                    }),
                }),
                req
            );
            if (validationErrors) return super.badRequest(res, "Bad Request", validationErrors);

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
            const { parameter } = req.params;
            const { title, content } = req.body;

            const isValidUUID = uuidValidate(parameter);
            const existingArticle = await prisma.article.findFirst({
                where: {
                    OR: [
                        { id: isNaN(+parameter) ? undefined : +parameter },
                        { slug: parameter },
                        { uuid: isValidUUID ? parameter : undefined },
                    ].filter((condition) => Object.values(condition)[0] !== undefined),
                },
            });

            if (!existingArticle) return super.notFound(res, "Not Found");

            const updateData: { title?: string; content?: string } = {};
            if (title) updateData.title = title.toString();
            if (content) updateData.content = content.toString();

            const article = await prisma.article.update({
                where: {
                    id: existingArticle.id,
                },
                data: updateData,
                include: {
                    images: true,
                }
            });

            return super.success(res, "success", new ArticleResource().get(article));
        } catch (error: any) {
            console.error(error.message);
            return super.error(res, error.message);
        }
    }

    private async destroy(req: Request, res: Response) {
        try {
            const { parameter } = req.params;
            const isValidUUID = uuidValidate(parameter);
            const article = await prisma.article.findFirst({
                where: {
                    OR: [
                        { id: isNaN(+parameter) ? undefined : +parameter },
                        { slug: parameter },
                        { uuid: isValidUUID ? parameter : undefined },
                    ].filter((condition) => Object.values(condition)[0] !== undefined),
                },
                include: {
                    images: true,
                },
            });
            if (!article) return super.notFound(res, "Not Found");

            if (!article) return super.notFound(res, "Not Found");
            if (article.images.length > 0) {
                article.images.forEach(async (image) => {
                    deleteFile(image.path);
                });
            }

            await prisma.articleImage.deleteMany({
                where: {
                    articleId: article.id,
                },
            });
            await prisma.article.delete({
                where: {
                    id: article.id,
                },
            });

            return super.success(res, "success");
        } catch (error: any) {
            console.error(error.message);
            return super.error(res, error.message);
        }
    }
}

export default new ArticleController().getRouter();
