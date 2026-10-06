import type { Request, Response, NextFunction } from "express";

export function notFoundMiddleware(
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: "Route not found",
    },
  });
}
