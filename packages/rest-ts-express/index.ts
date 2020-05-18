import core from "express-serve-static-core";
import * as t from "io-ts";
import { RestTSBase, RestTSRoute, NeverOr, NeverIfUnknown } from "@graywolfai/rest-ts";
import { isLeft } from "fp-ts/lib/Either";
import { PathReporter } from "io-ts/lib/PathReporter";

/**
 * A helper function to access types of your routes.
 * @since 0.3.0
 */
export type TypeOf<C extends t.Any> = t.TypeOf<C>;

/**
 * @since 0.1.0
 */
export type HTTPMethod = "GET" | "POST" | "PUT" | "PATCH" | "HEAD" | "DELETE" | "OPTIONS";

/**
 * @since 0.1.0
 */
export type TypedRequest<T extends RestTSRoute> = core.Request<
  t.TypeOf<Exclude<T["params"], undefined>>,
  never,
  t.TypeOf<Exclude<T["body"], undefined>>,
  t.TypeOf<Exclude<T["query"], undefined>>
>;

/**
 * @since 0.1.0
 */
export type TypedResponse = core.Response<never>;

/**
 * @since 0.1.0
 */
export type TypedHandler<
  API extends RestTSBase,
  Path extends Extract<keyof API, string>,
  Type extends Extract<keyof API[Path], HTTPMethod>
> = (
  req: TypedRequest<API[Path][Type]>,
  res: TypedResponse,
  next: core.NextFunction,
) => Promise<NeverIfUnknown<t.TypeOf<API[Path][Type]["response"]>>>;

/**
 * @since 0.1.0
 */
export type Routes<API extends RestTSBase> = Extract<keyof API, string>;

/**
 * @since 0.1.0
 */
type Methods<API extends RestTSBase, Path extends Routes<API>> = Extract<
  keyof API[Path],
  HTTPMethod
>;

/**
 * @since 0.1.0
 */
export type Handlers = "get" | "post" | "put" | "delete" | "patch" | "options" | "head";

/**
 * @since 0.1.0
 */
export interface TypedRouter<API extends RestTSBase> {
  use: core.ApplicationRequestHandler<void>;
  get<Path extends Routes<API>, Type extends Methods<API, Path> & "GET">(
    path: NeverOr<Type, Path>,
    handler: TypedHandler<API, Path, Type>,
  ): void;
  post<Path extends Routes<API>, Type extends Methods<API, Path> & "POST">(
    path: NeverOr<Type, Path>,
    handler: TypedHandler<API, Path, Type>,
  ): void;
  put<Path extends Routes<API>, Type extends Methods<API, Path> & "PUT">(
    path: NeverOr<Type, Path>,
    handler: TypedHandler<API, Path, Type>,
  ): void;
  delete<Path extends Routes<API>, Type extends Methods<API, Path> & "DELETE">(
    path: NeverOr<Type, Path>,
    handler: TypedHandler<API, Path, Type>,
  ): void;
  patch<Path extends Routes<API>, Type extends Methods<API, Path> & "PATCH">(
    path: NeverOr<Type, Path>,
    handler: TypedHandler<API, Path, Type>,
  ): void;
  options<Path extends Routes<API>, Type extends Methods<API, Path> & "OPTIONS">(
    path: NeverOr<Type, Path>,
    handler: TypedHandler<API, Path, Type>,
  ): void;
  head<Path extends Routes<API>, Type extends Methods<API, Path> & "HEAD">(
    path: NeverOr<Type, Path>,
    handler: TypedHandler<API, Path, Type>,
  ): void;
}

/**
 * @since 0.1.0
 */
export const TypedAsyncRouter = <T extends RestTSBase>(
  api: T,
  router: core.Router,
): TypedRouter<T> => {
  const wrap = <Path extends Routes<T>, Type extends Methods<T, Path>>(
    path: Path,
    handler: TypedHandler<T, Path, Type>,
    method: Handlers,
  ) => {
    router[method](path, (req, res, next) => {
      const route = api[path][method.toUpperCase()];
      if (route.body) {
        const result = route.body.decode(req.body);
        if (isLeft(result)) {
          res.status(400).send({
            status: "error",
            error: "Invalid body: " + PathReporter.report(result).join("\n"),
          });
          return;
        }
      }

      if (route.params) {
        const result = route.params.decode(req.params);
        if (isLeft(result)) {
          res.status(400).send({
            status: "error",
            error: "Invalid params: " + PathReporter.report(result).join("\n"),
          });
          return;
        }
      }

      if (route.query) {
        const result = route.query.decode(req.query);
        if (isLeft(result)) {
          res.status(400).send({
            status: "error",
            error: "Invalid query: " + PathReporter.report(result).join("\n"),
          });
          return;
        }
      }

      handler(req as any, res, next)
        .then((result) => {
          if (!res.headersSent) {
            res.send(result);
          }
        })
        .catch(next);
    });
  };

  return {
    use: router.use.bind(router),
    get: (path, handler) => wrap(path, handler, "get"),
    post: (path, handler) => wrap(path, handler, "post"),
    put: (path, handler) => wrap(path, handler, "put"),
    delete: (path, handler) => wrap(path, handler, "delete"),
    patch: (path, handler) => wrap(path, handler, "patch"),
    options: (path, handler) => wrap(path, handler, "options"),
    head: (path, handler) => wrap(path, handler, "head"),
  };
};
