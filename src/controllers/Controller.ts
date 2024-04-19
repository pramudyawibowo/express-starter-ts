import { Response } from "express";

export default class Controller {
    public success(response: Response, message: string, data: object | null = null): Response {
        return response.status(200).json({
            data: data,
            message: message,
            status: 200,
        });
    }

    public created(response: Response, message: string, data: object | null = null): Response {
        return response.status(201).json({
            data: data,
            message: message,
            status: 201,
        });
    }

    public badRequest(response: Response, message: string, data: object | null = null): Response {
        return response.status(400).json({
            data: data,
            message: message,
            status: 400,
        });
    }

    public unauthorized(response: Response, message: string, data: object | null = null): Response {
        return response.status(401).json({
            data: data,
            message: message,
            status: 401,
        });
    }

    public forbidden(response: Response, message: string, data: object | null = null): Response {
        return response.status(403).json({
            data: data,
            message: message,
            status: 403,
        });
    }

    public notFound(response: Response, message: string, data: object | null = null): Response {
        return response.status(404).json({
            data: data,
            message: message,
            status: 404,
        });
    }

    public conflict(response: Response, message: string, data: object | null = null): Response {
        return response.status(409).json({
            data: data,
            message: message,
            status: 409,
        });
    }

    public error(response: Response, message: string, data: object | null = null): Response {
        return response.status(500).json({
            data: data,
            message: message,
            status: 500,
        });
    }
}
