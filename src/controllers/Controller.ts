import type { Response } from "express";

export default class Controller {
    protected respond(response: Response, status: number, data?: any, message: string = ""): Response {
        if (!response || typeof response.status !== 'function') {
            console.error('Invalid response object provided to respond method');
            throw new Error('Invalid response object');
        }

        if (data && typeof data === "string") {
            message = data;
            data = null;
        }

        return response.status(status).json({
            data: data || null,
            message: message || this.getDefaultMessage(status),
            status: status,
        });
    }

    private getDefaultMessage(status: number): string {
        const messages: Record<number, string> = {
            200: "Success",
            201: "Resource created successfully",
            400: "Bad Request",
            401: "Unauthorized",
            403: "Forbidden",
            404: "Not Found",
            409: "Conflict",
            500: "Internal Server Error",
        };
        return messages[status] || "Unknown Status";
    }

    public success(response: Response, data?: any, message?: string): Response {
        return this.respond(response, 200, data, message);
    }

    public created(response: Response, data?: any, message?: string): Response {
        return this.respond(response, 201, data, message);
    }

    public badRequest(response: Response, data?: any, message?: string): Response {
        return this.respond(response, 400, data, message);
    }

    public unauthorized(response: Response, data?: any, message?: string): Response {
        return this.respond(response, 401, data, message);
    }

    public forbidden(response: Response, data?: any, message?: string): Response {
        return this.respond(response, 403, data, message);
    }

    public notFound(response: Response, data?: any, message?: string): Response {
        return this.respond(response, 404, data, message);
    }

    public conflict(response: Response, data?: any, message?: string): Response {
        return this.respond(response, 409, data, message);
    }

    public error(response: Response, data?: any, message?: string): Response {
        return this.respond(response, 500, data, message);
    }
}
