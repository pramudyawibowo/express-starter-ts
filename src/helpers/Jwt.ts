import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";

const secret_access = process.env.JWT_SECRET_ACCESS_TOKEN || ("secret_access" as string);
const expired_access = process.env.JWT_EXPIRED_ACCESS_TOKEN || ("1d" as string);

const secret_refresh = process.env.JWT_SECRET_REFRESH_TOKEN || ("secret_refresh" as string);
const expired_refresh = process.env.JWT_EXPIRED_REFRESH_TOKEN || ("7d" as string);

type Payload = {
    phonenumber: string;
};

export const getRefreshToken = (payload: Payload): string => {
    return jwt.sign(payload, secret_refresh, { expiresIn: expired_refresh } as SignOptions);
};

export const getAccessToken = (payload: Payload): string => {
    return jwt.sign(payload, secret_access, { expiresIn: expired_access } as SignOptions);
};

export const verifyRefreshToken = (token: string): any => {
    return jwt.verify(token, secret_refresh);
};

export const verifyAccessToken = (token: string): any => {
    return jwt.verify(token, secret_access);
};
