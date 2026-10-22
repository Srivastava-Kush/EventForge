/**
 * Middleware: recursively removes any object keys that begin with '$' or contain '.'
 * to prevent NoSQL query operator injection attacks against MongoDB.
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} _res
 * @param {import("express").NextFunction} next
 */
export function sanitizeInputs(req, _res, next) {
  const clean = (target) => {
    if (!target || typeof target !== "object") return;

    for (const key of Object.keys(target)) {
      if (key.startsWith("$") || key.includes(".")) {
        delete target[key];
      } else if (typeof target[key] === "object" && target[key] !== null) {
        clean(target[key]);
      }
    }
  };

  if (req.body) clean(req.body);
  if (req.params) clean(req.params);
  if (req.query) clean(req.query);

  next();
}

export default sanitizeInputs;
