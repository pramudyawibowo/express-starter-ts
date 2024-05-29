import "dotenv/config";
import { Request, Response, NextFunction } from "express";

const ApiKeyMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const key = req.headers["api-key"];
    if (key !== process.env.API_KEY) {
        return res.status(403).json({
            data: null,
            message: "Forbidden",
            status: 403,
        });
    }
    next();
};

export default ApiKeyMiddleware;
