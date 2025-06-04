import type { User as PrismaUser } from "@prisma/client";

type User = PrismaUser & {
    token: string;
}

declare global {
    namespace Express {
        interface Request {
            user: User;
        }
    }
}

export {};
