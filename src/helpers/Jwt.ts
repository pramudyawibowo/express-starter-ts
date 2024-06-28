import "dotenv/config";
import jwt from "jsonwebtoken";

const secret_access = process.env.JWT_SECRET_ACCESS_TOKEN!;
const expired_access = process.env.JWT_EXPIRED_ACCESS_TOKEN!;

const secret_refresh = process.env.JWT_SECRET_REFRESH_TOKEN!;
const expired_refresh = process.env.JWT_EXPIRED_REFRESH_TOKEN!;

type Payload = {
    phonenumber: string;
};

export const getRefreshToken = (payload: Payload): string => {
    return jwt.sign(payload, secret_refresh, { expiresIn: expired_refresh });
};

export const getAccessToken = (payload: Payload): string => {
    return jwt.sign(payload, secret_access, { expiresIn: expired_access });
};

export const verifyRefreshToken = (token: string): any => {
    return jwt.verify(token, secret_refresh);
};

export const verifyAccessToken = (token: string): any => {
    return jwt.verify(token, secret_access);
};
