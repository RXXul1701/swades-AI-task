import { Context, Next } from "hono";

export async function errorHandler(c: Context, next: Next) {
  try {
    await next();
  } catch (error) {
    console.error("Error:", error);

    if (error instanceof Error) {
      return c.json(
        {
          error: error.message,
          status: "error",
        },
        500
      );
    }

    return c.json(
      {
        error: "Internal Server Error",
        status: "error",
      },
      500
    );
  }
}
