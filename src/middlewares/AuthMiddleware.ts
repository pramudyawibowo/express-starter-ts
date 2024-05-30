import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../helpers/Jwt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const AuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token)
            return res.status(401).json({
                data: null,
                message: "Unauthenticated",
                status: 401,
            });

        const decoded = verifyAccessToken(token);
        if (!decoded)
            return res.status(401).json({
                data: null,
                message: "Unauthenticated",
                status: 401,
            });

        const dbtoken = await prisma.token.findFirst({
            where: {
                accessToken: token,
            },
        });
        if (!dbtoken)
            return res.status(401).json({
                data: null,
                message: "Unauthenticated",
                status: 401,
            });

        const user = await prisma.user.findFirst({
            where: {
                phonenumber: decoded.phonenumber,
            },
        });
        if (!user)
            return res.status(401).json({
                data: null,
                message: "Unauthenticated",
                status: 401,
            });

        req.body.user = user;
        req.body.token = token;

        next();
    } catch (error: any) {
        console.error(error.message);
        return res.status(500).json({
            data: error,
            message: "Internal Server Error",
            status: 500,
        });
    }
};

export default AuthMiddleware;
