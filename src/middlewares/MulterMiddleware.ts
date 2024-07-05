import multer from "multer";
import type { Request, Response, NextFunction } from "express";

const storage = multer.memoryStorage();
const multerMiddleware = multer({ storage });

const MulterMiddleware = (req: Request, res: Response, next: NextFunction) => {
    multerMiddleware.any()(req, res, next);
};

export default MulterMiddleware;
