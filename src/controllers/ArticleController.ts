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
import { autobind } from "@utils/Autobind";

class ArticleController extends Controller {
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

    private routes(): void {
        this.router.get("/", this.index);
        this.router.get("/:parameter", this.show);
        this.router.post("/", this.store);
        this.router.put("/:parameter", this.update);
        this.router.delete("/:parameter", this.destroy);
    }

    private async index(req: Request, res: Response) {
        try {
            const { page = 1, perPage = 10, search = "", all = "false", orderby = "id", order = "desc", category_slug, category_id } = req.query;

            const filters: any = {
                title: { contains: search.toString(), mode: "insensitive" },
                content: { contains: search.toString(), mode: "insensitive" },
            };

            if (category_slug) {
                const category = await prisma.articleCategory.findUnique({ where: { slug: category_slug.toString() } });
                if (!category) return super.notFound(res, "Category not found");
                filters.category_id = category.id;
            } else if (category_id) {
                filters.category_id = +category_id;
            }

            const articles = await prisma.article.findMany({
                where: filters,
                include: { images: true },
                orderBy: { [orderby.toString()]: order.toString().toLowerCase() },
                ...(all === "true" ? {} : { skip: (+page - 1) * +perPage, take: +perPage }),
            });

            return super.success(res, new ArticleResource().collection(articles));
        } catch (error: any) {
            console.error(error.message);
            return super.error(res, error.message);
        }
    }

    private async show(req: Request, res: Response) {
        try {
            const { parameter } = req.params;
            const article = await prisma.article.findFirst({
                where: {
                    OR: [
                        { id: isNaN(+parameter) ? undefined : +parameter },
                        { slug: parameter },
                        { uuid: uuidValidate(parameter) ? parameter : undefined },
                    ],
                },
                include: { images: true },
            });

            if (!article) return super.notFound(res, "Article not found");

            return super.success(res, new ArticleResource().get(article));
        } catch (error: any) {
            console.error(error.message);
            return super.error(res, error.message);
        }
    }

    private async store(req: Request, res: Response) {
        try {
            const { title, content, category_id } = req.body;

            const validationErrors = await joiValidate(req,
                Joi.object({
                    title: Joi.string().required(),
                    content: Joi.string().required(),
                    category_id: Joi.number().required(),
                }),
            );
            if (validationErrors) return super.badRequest(res, validationErrors);

            const slugTitle = slug(title, { lower: true });
            const existingSlug = await prisma.article.findUnique({ where: { slug: slugTitle } });
            if (existingSlug) return super.badRequest(res, "Title already exists");

            const files = req.files as Express.Multer.File[];
            const images = files ? await Promise.all(files.map((file) => saveFile(file, "articles"))) : [];

            const article = await prisma.article.create({
                data: {
                    title,
                    content,
                    slug: slugTitle,
                    category_id: +category_id,
                    user_id: +req.user.id,
                    images: { createMany: { data: images.map((path) => ({ path })) } },
                },
                include: { images: true },
            });

            return super.success(res, new ArticleResource().get(article));
        } catch (error: any) {
            console.error(error.message);
            return super.error(res, error.message);
        }
    }

    private async update(req: Request, res: Response) {
        try {
            const { parameter } = req.params;
            const { title, content, category_id } = req.body;

            const article = await prisma.article.findFirst({
                where: {
                    OR: [
                        { id: isNaN(+parameter) ? undefined : +parameter },
                        { slug: parameter },
                        { uuid: uuidValidate(parameter) ? parameter : undefined },
                    ],
                },
            });

            if (!article) return super.notFound(res, "Article not found");

            const updatedArticle = await prisma.article.update({
                where: { id: article.id },
                data: {
                    ...(title && { title }),
                    ...(content && { content }),
                    ...(category_id && { category_id: +category_id }),
                },
                include: { images: true },
            });

            const files = req.files as Express.Multer.File[];
            if (files) {
                const images = await Promise.all(files.map((file) => saveFile(file, "articles")));
                await prisma.articleImage.deleteMany({ where: { articleId: article.id } });
                await prisma.articleImage.createMany({
                    data: images.map((path) => ({ path, articleId: article.id })),
                });
            }

            return super.success(res, new ArticleResource().get(updatedArticle));
        } catch (error: any) {
            console.error(error.message);
            return super.error(res, error.message);
        }
    }

    private async destroy(req: Request, res: Response) {
        try {
            const { parameter } = req.params;

            const article = await prisma.article.findFirst({
                where: {
                    OR: [
                        { id: isNaN(+parameter) ? undefined : +parameter },
                        { slug: parameter },
                        { uuid: uuidValidate(parameter) ? parameter : undefined },
                    ],
                },
                include: { images: true },
            });

            if (!article) return super.notFound(res, "Article not found");

            await prisma.articleImage.deleteMany({ where: { articleId: article.id } });
            article.images.forEach((image) => deleteFile(image.path));
            await prisma.article.delete({ where: { id: article.id } });

            return super.success(res, "Article deleted successfully");
        } catch (error: any) {
            console.error(error.message);
            return super.error(res, error.message);
        }
    }
}

export default new ArticleController().getRouter();
