import core from "express-serve-static-core";
import { RestTSBase, RestTSRoute, NeverOr, NeverIfUnknown } from "@graywolfai/rest-ts";

export type HTTPMethod = "GET" | "POST" | "PUT" | "PATCH" | "HEAD" | "DELETE" | "OPTIONS";

export type TypedRequest<T extends RestTSRoute> = core.Request<
  Exclude<T["params"], undefined>,
  NeverIfUnknown<T["response"]>,
  T["body"],
  Exclude<T["query"], undefined>
>;

export type TypedResponse<T extends RestTSRoute> = core.Response<NeverIfUnknown<T["response"]>>;

export type TypedHandler<
  API extends RestTSBase,
  Path extends Extract<keyof API, string>,
  Type extends Extract<keyof API[Path], HTTPMethod>
> = (
  req: TypedRequest<API[Path][Type]>,
  res: TypedResponse<API[Path][Type]>,
  next: core.NextFunction,
) => Promise<API[Path][Type]["response"]>;

type Routes<API extends RestTSBase> = Extract<keyof API, string>;

type Methods<API extends RestTSBase, Path extends Routes<API>> = Extract<
  keyof API[Path],
  HTTPMethod
>;

type Handlers = "get" | "post" | "put" | "delete" | "patch" | "options" | "head";

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

type GenericHandler = (
  req: core.Request,
  res: core.Response,
  next: core.NextFunction,
) => Promise<void>;

export const TypedAsyncRouter: <T extends RestTSBase>(router: core.Router) => TypedRouter<T> = (
  router,
) => {
  const wrap = <T>(path: core.PathParams, handler: GenericHandler, method: Handlers) => {
    router[method](path, (req, res, next) => {
      handler(req, res, next)
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
    // FIXME We are casting for now but eventually we can use io-ts to avoid this
    get: (path, handler) => wrap(path, handler as GenericHandler, "get"),
    post: (path, handler) => wrap(path, handler as GenericHandler, "post"),
    put: (path, handler) => wrap(path, handler as GenericHandler, "put"),
    delete: (path, handler) => wrap(path, handler as GenericHandler, "delete"),
    patch: (path, handler) => wrap(path, handler as GenericHandler, "patch"),
    options: (path, handler) => wrap(path, handler as GenericHandler, "options"),
    head: (path, handler) => wrap(path, handler as GenericHandler, "head"),
  };
};
