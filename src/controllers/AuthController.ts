import Controller from "./Controller";
import type { Request, Response } from "express";
import { Router } from "express";
import { hashPassword } from "@helpers/Bcrypt";
import { formatPhonenumber } from "@helpers/Formatter";
import { getRefreshToken, getAccessToken, verifyRefreshToken } from "@helpers/Jwt";
import { generateOtp, sendOtp, verifyOtp, checkThrottle, checkDailyLimit } from "@helpers/Otp";
import { AuthMiddleware } from "../middlewares";
import { UserResource } from "@resources/index";
import { prisma } from "@helpers/Prisma";
import Joi from "joi";
import { joiValidate } from "@helpers/Joi";
import { autobind } from "@utils/Autobind";

class AuthController extends Controller {
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
        this.router.post("/register", this.register);
        this.router.post("/login", this.login);
        this.router.post("/verify-otp", this.verifyOtp);
        this.router.post("/logout", AuthMiddleware, this.logout);
        this.router.post("/refresh", this.refreshAccessToken);
    }

    public register = async (req: Request, res: Response): Promise<Response> => {
        try {
            const validationErrors = await joiValidate(
                req,
                Joi.object({
                    name: Joi.string().required(),
                    phonenumber: Joi.string().required(),
                })
            );
            if (validationErrors) return super.badRequest(res, validationErrors);

            const { name, phonenumber } = req.body;

            const userExists = await prisma.user.findFirst({
                where: {
                    phonenumber: formatPhonenumber(phonenumber),
                },
            });
            if (userExists) return super.badRequest(res, "Nomor telepon sudah terdaftar");

            const user = await prisma.user.create({
                data: {
                    name: name,
                    phonenumber: formatPhonenumber(phonenumber),
                    password: await hashPassword("12345678"),
                },
            });

            const otp = generateOtp();
            sendOtp(user.phonenumber, otp, "login");

            return super.success(res, { user: new UserResource().get(user), otp: otp });
        } catch (error: any) {
            console.error("Register error:", error.message);
            return super.error(res);
        }
    };

    public async login(req: Request, res: Response): Promise<Response> {
        try {
            const validationErrors = await joiValidate(
                req,
                Joi.object({
                    phonenumber: Joi.string().required(),
                })
            );
            if (validationErrors) return super.badRequest(res, validationErrors);

            const { phonenumber } = req.body;
            const user = await prisma.user.findFirst({
                where: {
                    phonenumber: formatPhonenumber(phonenumber),
                },
            });
            if (!user) return super.notFound(res, "User Not Found");

            if (await checkDailyLimit(user.phonenumber, "login")) return super.badRequest(res, "Batas percobaan harian telah tercapai");

            const { throttling, remaining } = await checkThrottle(user.phonenumber, "login");
            if (throttling) return super.badRequest(res, `Batas percobaan telah tercapai, silahkan coba lagi dalam ${remaining} detik`);

            const otp = generateOtp();
            sendOtp(user.phonenumber, otp, "login");

            return super.success(res, { otp: otp });
        } catch (error: any) {
            console.error(error.message);
            return super.error(res);
        }
    }

    public async verifyOtp(req: Request, res: Response): Promise<Response> {
        try {
            const validationErrors = await joiValidate(
                req,
                Joi.object({
                    phonenumber: Joi.string().required(),
                    otp: Joi.string().required(),
                })
            );
            if (validationErrors) return super.badRequest(res, validationErrors);

            const { phonenumber, otp } = req.body;

            const user = await prisma.user.findFirst({
                where: {
                    phonenumber: formatPhonenumber(phonenumber),
                },
            });
            if (!user) return super.notFound(res, "User Not Found");

            await verifyOtp(user.id, "login", otp);

            const refreshToken = getRefreshToken({
                phonenumber: user.phonenumber,
            });

            const accessToken = getAccessToken({
                phonenumber: user.phonenumber,
            });

            await prisma.token.create({
                data: {
                    user: {
                        connect: {
                            id: user.id,
                        },
                    },
                    accessToken: accessToken,
                    refreshToken: refreshToken,
                },
            });

            return super.success(res, {
                accessToken,
                refreshToken,
            });
        } catch (error: any) {
            console.error(error.message);
            return super.error(res);
        }
    }

    public async logout(req: Request, res: Response): Promise<Response> {
        try {
            const { user, token } = req.body;
            const dbtoken = await prisma.token.findFirst({
                where: {
                    user_id: user.id,
                    accessToken: token,
                },
            });
            if (!dbtoken) return super.notFound(res, "Token Not Found");

            await prisma.token.delete({
                where: {
                    id: dbtoken.id,
                },
            });
            return super.success(res);
        } catch (error: any) {
            console.error(error.message);
            return super.error(res);
        }
    }

    public async refreshAccessToken(req: Request, res: Response): Promise<Response> {
        try {
            const { refreshToken } = req.body;
            const decoded = verifyRefreshToken(refreshToken);
            if (!decoded) return super.unauthorized(res, "Unauthorized");

            const user = await prisma.user.findFirst({
                where: {
                    phonenumber: decoded.phonenumber,
                },
            });
            if (!user) return super.unauthorized(res, "Unauthorized");

            const dbtoken = await prisma.token.findFirst({
                where: {
                    user_id: user.id,
                    refreshToken: refreshToken,
                },
            });
            if (!dbtoken) return super.unauthorized(res, "Unauthorized");

            const newAccessToken = getAccessToken({
                phonenumber: user.phonenumber,
            });

            await prisma.token.update({
                where: {
                    id: dbtoken.id,
                },
                data: {
                    accessToken: newAccessToken,
                },
            });

            return super.success(res, {
                accessToken: newAccessToken,
            });
        } catch (error: any) {
            console.error(error.message);
            return super.error(res, "error", error);
        }
    }
}

export default new AuthController().getRouter();
