import { NextRequest, NextResponse } from "next/server";

type RouteHandler = (
  request: NextRequest,
  context?: unknown,
) => Promise<NextResponse>;

/**
 * Wraps an API route handler with consistent error handling.
 * Catches unhandled errors and returns a JSON `{ error }` response.
 */
export function withErrorHandler(
  handler: RouteHandler,
  errorMessage = "Internal server error",
): RouteHandler {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      console.error(`API error [${request.method} ${request.nextUrl.pathname}]:`, error);
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
  };
}
