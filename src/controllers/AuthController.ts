import { PrismaClient } from "@prisma/client";
import Controller from "./Controller";
import { Request, Response, Router } from "express";
import { body, validationResult } from "express-validator";
import { hashPassword, comparePassword } from "../helpers/Bcrypt";
import { formatPhonenumber } from "../helpers/Formatter";
import { getRefreshToken, getAccessToken, verifyRefreshToken } from "../helpers/Jwt";
import { generateOtp, sendOtp, verifyOtp, checkThrottle, checkDailyLimit } from "../helpers/Otp";
import AuthMiddleware from "../middlewares/AuthMiddleware";
import UserResource from "../resources/UserResource";

const prisma = new PrismaClient();

class AuthController extends Controller {
    private router: Router;

    constructor() {
        super();
        this.router = Router();
        this.routes();
    }

    public getRouter(): Router {
        return this.router;
    }

    public routes(): void {
        this.router.post("/register", this.validateRegister, this.register);
        this.router.post("/login", this.validateLogin, this.login);
        this.router.post("/verify-otp", this.validateVerifyOtp, this.verifyOtp);
        this.router.post("/logout", AuthMiddleware, this.logout);
        this.router.post("/refresh", this.refreshAccessToken);
    }

    private validateRegister = [
        body("name", "Name is required").notEmpty(),
        body("phonenumber", "Phonenumber is required").notEmpty(),
        body("phonenumber").custom(async (value) => {
            const user = await prisma.user.findFirst({
                where: {
                    phonenumber: formatPhonenumber(value),
                },
            });
            if (user) return Promise.reject("Phone number already exists");
        }),
        body("password", "Password is required").notEmpty(),
    ];
    public async register(req: Request, res: Response): Promise<Response> {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return super.badRequest(res, "invalid request", errors.array());

            const { name, phonenumber, password } = req.body;
            const user = await prisma.user.create({
                data: {
                    name: name,
                    phonenumber: formatPhonenumber(phonenumber),
                    password: await hashPassword(password),
                },
            });

            const otp = generateOtp();
            sendOtp(user.phonenumber, otp, "login");

            return super.success(res, "success", { user: new UserResource().get(user), otp: otp });
        } catch (error: any) {
            console.error(error.message);
            return super.error(res, error.message);
        }
    }

    private validateLogin = [
        body("phonenumber", "Phonenumber is required").notEmpty(),
        body("password", "Password is required").notEmpty(),
    ];
    public async login(req: Request, res: Response): Promise<Response> {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return super.badRequest(res, "invalid request", errors.array());

            const { phonenumber, password } = req.body;
            const user = await prisma.user.findFirst({
                where: {
                    phonenumber: formatPhonenumber(phonenumber),
                },
            });
            if (!user) return super.notFound(res, "User Not Found");
            if (!(await comparePassword(password, user.password))) return super.unauthorized(res, "Unauthorized");

            if (await checkDailyLimit(user.phonenumber, "login"))
                return super.badRequest(res, "Batas percobaan harian telah tercapai");
            if (await checkThrottle(user.phonenumber, "login")) return super.badRequest(res, "Coba lagi dalam 1 menit");

            const otp = generateOtp();
            sendOtp(user.phonenumber, otp, "login");

            return super.success(res, "success", { otp: otp });
        } catch (error: any) {
            console.error(error.message);
            return super.error(res, error.message);
        }
    }

    private validateVerifyOtp = [
        body("phonenumber", "Phonenumber is required").notEmpty(),
        body("otp", "OTP is required").notEmpty(),
    ];
    public async verifyOtp(req: Request, res: Response): Promise<Response> {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return super.badRequest(res, "invalid request", errors.array());

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

            return super.success(res, "success", {
                accessToken,
                refreshToken,
            });
        } catch (error: any) {
            console.error(error.message);
            return super.error(res, error.message);
        }
    }

    public async logout(req: Request, res: Response): Promise<Response> {
        try {
            const { user, token } = req.body;
            const dbtoken = await prisma.token.findFirst({
                where: {
                    userId: user.id,
                    accessToken: token,
                },
            });
            if (!dbtoken) return super.notFound(res, "Token Not Found");

            await prisma.token.delete({
                where: {
                    id: dbtoken.id,
                },
            });
            return super.success(res, "success");
        } catch (error: any) {
            console.error(error.message);
            return super.error(res, error.message);
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
                    userId: user.id,
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

            return super.success(res, "success", {
                accessToken: newAccessToken,
            });
        } catch (error: any) {
            console.error(error.message);
            return super.error(res, "error", error);
        }
    }
}

export default new AuthController().getRouter();
