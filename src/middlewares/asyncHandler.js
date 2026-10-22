/**
 * Wraps an async Express route handler to catch rejected promises and pass
 * them to next() — eliminating try/catch boilerplate from every controller.
 *
 * @param {(req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => Promise<void>} fn
 * @returns {import("express").RequestHandler}
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
