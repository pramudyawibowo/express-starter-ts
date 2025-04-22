import type { Request, Response } from "express";
import { Router } from "express";
import Controller from "./Controller";
import { prisma } from "@helpers/Prisma";
import { joiValidate } from "@helpers/Joi";
import Joi from "joi";

class ArticleCategoryController extends Controller {
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
        this.router.put("/:id", this.update);
        this.router.delete("/:parameter", this.destroy);
    }

    private async index(req: Request, res: Response) {
        try {
            const schema = Joi.object({
                page: Joi.number().integer().min(1).optional(),
                perPage: Joi.number().integer().min(1).optional(),
                search: Joi.string().allow("").optional(),
                all: Joi.string().valid("true", "false").optional(),
                orderby: Joi.string().optional(),
                order: Joi.string().valid("asc", "desc").optional(),
            });

            const validationErrors = await joiValidate(req, schema);
            if (validationErrors) return super.badRequest(res, "Validation failed", validationErrors);

            const { page = 1, perPage = 10, search = "", all = "false", orderby = "id", order = "desc" } = req.query;

            const filters: any = {
                name: { contains: search.toString(), mode: "insensitive" },
            };

            const categories = await prisma.articleCategory.findMany({
                where: filters,
                orderBy: { [orderby.toString()]: order.toString().toLowerCase() },
                ...(all === "true" ? {} : { skip: (+page - 1) * +perPage, take: +perPage }),
            });

            return super.success(res, "success", categories);
        } catch (error: any) {
            console.error(error.message);
            return super.error(res, error.message);
        }
    }

    private async show(req: Request, res: Response) {
        try {
            const schema = Joi.object({
                parameter: Joi.string().required(),
            });

            const validationErrors = await joiValidate(req, schema);
            if (validationErrors) return super.badRequest(res, "Validation failed", validationErrors);

            const { parameter } = req.params;
            const category = await prisma.articleCategory.findFirst({
                where: {
                    OR: [{ id: isNaN(+parameter) ? undefined : +parameter }, { slug: parameter }],
                },
            });

            if (!category) return super.notFound(res, "Category not found");

            return super.success(res, "Category retrieved successfully", category);
        } catch (error: any) {
            console.error(error.message);
            return super.error(res, error.message);
        }
    }

    private async store(req: Request, res: Response) {
        try {
            const schema = Joi.object({
                name: Joi.string().required(),
            });

            const validationErrors = await joiValidate(req, schema, { name: { prisma, model: "articleCategory", field: "name", type: "unique" } });
            if (validationErrors) return super.badRequest(res, "Validation failed", validationErrors);

            const { name } = req.body;
            const slugName = name.toLowerCase().replace(/\s+/g, "-");
            const category = await prisma.articleCategory.create({
                data: {
                    name,
                    slug: slugName,
                },
            });

            return super.success(res, "Category created successfully", category);
        } catch (error: any) {
            console.error(error.message);
            return super.error(res, error.message);
        }
    }

    private async update(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const schema = Joi.object({
                name: Joi.string().optional(),
            });

            const validationErrors = await joiValidate(req, schema, {
                name: { prisma, model: "articleCategory", field: "name", type: "unique", exceptId: +id },
            });
            if (validationErrors) return super.badRequest(res, "Validation failed", validationErrors);

            const { name } = req.body;

            const category = await prisma.articleCategory.findFirst({
                where: {
                    id: +id,
                },
            });

            if (!category) return super.notFound(res, "Category not found");

            const updatedCategory = await prisma.articleCategory.update({
                where: { id: category.id },
                data: {
                    ...(name && { name, slug: name.toLowerCase().replace(/\s+/g, "-") }),
                },
            });

            return super.success(res, "Category updated successfully", updatedCategory);
        } catch (error: any) {
            console.error(error);
            return super.error(res, error.message);
        }
    }

    private async destroy(req: Request, res: Response) {
        try {
            const schema = Joi.object({
                parameter: Joi.string().required(),
            });

            const validationErrors = await joiValidate(req, schema);
            if (validationErrors) return super.badRequest(res, "Validation failed", validationErrors);

            const { parameter } = req.params;

            const category = await prisma.articleCategory.findFirst({
                where: {
                    OR: [{ id: isNaN(+parameter) ? undefined : +parameter }, { slug: parameter }],
                },
            });

            if (!category) return super.notFound(res, "Category not found");

            await prisma.articleCategory.delete({ where: { id: category.id } });

            return super.success(res, "Category deleted successfully");
        } catch (error: any) {
            console.error(error.message);
            return super.error(res, error.message);
        }
    }
}

export default new ArticleCategoryController().getRouter();
