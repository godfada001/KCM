/* export function validateMiddleware(schema) {
  return function validateRequest(req, res, next) {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Request validation failed",
        error: {
          code: "VALIDATION_ERROR",
          details: result.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
      });
    }

    res.locals.validated = result.data;

    next();
  };
}*/
export function validateMiddleware(schema) {
  return function validateRequest(req, res, next) {
    const result = schema.safeParse({
      body: req.body ?? {},
      params: req.params ?? {},
      query: req.query ?? {},
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Request validation failed",
        error: {
          code: "VALIDATION_ERROR",
          details: result.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
      });
    }

    res.locals.validated = result.data;

    // Controllers receive the validated request body.
    req.body = result.data.body ?? {};

    next();
  };
}