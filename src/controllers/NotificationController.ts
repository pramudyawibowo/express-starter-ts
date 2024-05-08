import Controller from "./Controller"
import { Router, Request, Response } from "express"
import { body, validationResult } from "express-validator"
import { PrismaClient } from "@prisma/client"
import moment from "moment"

const prisma = new PrismaClient()

class NotificationController extends Controller {
    private router: Router

    constructor() {
        super()
        this.router = Router()
        this.routes()
    }

    public getRouter(): Router {
        return this.router
    }

    public routes(): void {
        this.router.get("/", this.index)
        this.router.get("/:id", this.show)
        this.router.post("/", this.validateStore, this.store)
        this.router.put("/:id", this.update)
        this.router.delete("/:id", this.destroy)
    }

    public async index(req: Request, res: Response): Promise<Response> {
        try {
            const { page = 1, perPage = 10} = req.query
            const notifications = await prisma.notification.findMany({
                skip: page ? (parseInt(page.toString()) - 1) * (perPage ? parseInt(perPage.toString()) : 10) : 0,
                take: perPage ? parseInt(perPage.toString()) : 10,
            })
            return super.success(res, "success", notifications)
        } catch (error) {
            console.error(error)
            return super.error(res, "error")
        }
    }

    public async show(req: Request, res: Response): Promise<Response> {
        try {
            const { id } = req.params
            const notification = await prisma.notification.findUnique({
                where: {
                    id: parseInt(id),
                },
            })
            if (!notification) return super.notFound(res, "Not Found")
            return super.success(res, "success", notification)
        } catch (error) {
            console.error(error)
            return super.error(res, "error")
        }
    }

    private validateStore = [
        body("title", "title is required").notEmpty(),
        body("message", "message is required").notEmpty(),
    ]
    public async store(req: Request, res: Response): Promise<Response> {
        try {
            const errors = validationResult(req)
            if (!errors.isEmpty())
                return super.badRequest(res, "error", errors.array())

            const { title, message } = req.body
            const notification = await prisma.notification.create({
                data: {
                    title: title,
                    message: message,
                    json: req.body.json ? req.body.json : null,
                    createdAt: moment().add(7, "hours").toISOString(),
                    updatedAt: moment().add(7, "hours").toISOString(),
                },
            })
            return super.success(res, "success", notification)
        } catch (error) {
            console.error(error)
            return super.error(res, "error")
        }
    }

    public async update(req: Request, res: Response): Promise<Response> {
        try {
            const errors = validationResult(req)
            if (!errors.isEmpty())
                return super.badRequest(res, "error", errors.array())

            const { id } = req.params
            const { title, message } = req.body

            const data: any = {}
            if (title) data.title = title
            if (message) data.message = message
            if (req.body.json) data.json = req.body.json

            const notification = await prisma.notification.update({
                where: {
                    id: parseInt(id),
                },
                data: {
                    ...data,
                    updatedAt: moment().add(7, "hours").toISOString(),
                },
            })

            return super.success(res, "success", notification)
        } catch (error) {
            console.error(error)
            return super.error(res, "error")
        }
    }

    public async destroy(req: Request, res: Response): Promise<Response> {
        try {
            const { id } = req.params
            await prisma.notification.delete({
                where: {
                    id: parseInt(id),
                },
            })
            return super.success(res, "success")
        } catch (error) {
            console.error(error)
            return super.error(res, "error")
        }
    }
}

export default new NotificationController().getRouter()
