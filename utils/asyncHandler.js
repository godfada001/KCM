export function asyncHandler(controller) {
  return function wrappedController(req, res, next) {
    return Promise.resolve(
      controller(req, res, next)
    ).catch(next);
  };
}