import type { Request, Response, NextFunction } from "express";

export const ApiKeyMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    try {
        if (req.path.includes("/public") || req.path.includes("/storage")) {
            return next();
        }

        const apiKey = req.headers["x-api-key"] as string;
        const validApiKey = process.env.API_KEY;

        if (process.env.NODE_ENV === "development" && !validApiKey) {
            return next();
        }

        if (!apiKey) {
            res.status(401).json({
                status: 401,
                message: "API key is missing",
                data: null,
            });
            return;
        }

        if (apiKey !== validApiKey) {
            res.status(403).json({
                status: 403,
                message: "Invalid API key",
                data: null,
            });
            return;
        }

        next();
    } catch (error) {
        console.error("API Key middleware error:", error);
        res.status(500).json({
            status: 500,
            message: "Internal server error in API key validation",
            data: null,
        });
    }
};

export default ApiKeyMiddleware;