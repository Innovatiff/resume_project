import { NextResponse } from "next/server";

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function apiError(status: number, code: string, message: string) {
  return NextResponse.json({ ok: false, error: code, message }, { status });
}

/** Wrap a route handler so thrown ApiErrors become JSON and anything else becomes a clean 500. */
export function withHandler<Ctx>(fn: (req: Request, ctx: Ctx) => Promise<Response>) {
  return async (req: Request, ctx: Ctx): Promise<Response> => {
    try {
      return await fn(req, ctx);
    } catch (err) {
      if (err instanceof ApiError) return apiError(err.status, err.code, err.message);
      console.error("[api]", err);
      return apiError(500, "internal", "Something went wrong on our side. Try again in a moment.");
    }
  };
}

export function ok<T extends object>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, ...data }, init);
}
