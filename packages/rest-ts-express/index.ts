import exp from "express";
import { RestTSBase, RestTSRoute, NeverOr, NeverIfUnknown } from "rest-ts";

export type HTTPMethod = "GET" | "POST" | "PUT" | "PATCH" | "HEAD" | "DELETE" | "OPTIONS";

export interface TypedRequest<T extends RestTSRoute> extends exp.Request {
  body: T["body"];
  params: Exclude<T["params"], undefined>;
  query: Exclude<T["query"], undefined>;
}

export type TypedHandler<
  API extends RestTSBase,
  Path extends Extract<keyof API, string>,
  Type extends Extract<keyof API[Path], HTTPMethod>
> = (
  req: TypedRequest<API[Path][Type]>,
  res: exp.Response,
  next: exp.NextFunction,
) => Promise<NeverIfUnknown<API[Path][Type]["response"]>>;

type Routes<API extends RestTSBase> = Extract<keyof API, string>;

type Methods<API extends RestTSBase, Path extends Routes<API>> = Extract<
  keyof API[Path],
  HTTPMethod
>;

interface Express<API extends RestTSBase> {
  get<Path extends Routes<API>, Type extends Methods<API, Path> & "GET">(
    path: NeverOr<Type, Path>,
    handler: TypedHandler<API, Path, Type>,
  ): this;
  post<Path extends Routes<API>, Type extends Methods<API, Path> & "POST">(
    path: NeverOr<Type, Path>,
    handler: TypedHandler<API, Path, Type>,
  ): this;
  put<Path extends Routes<API>, Type extends Methods<API, Path> & "PUT">(
    path: NeverOr<Type, Path>,
    handler: TypedHandler<API, Path, Type>,
  ): this;
  delete<Path extends Routes<API>, Type extends Methods<API, Path> & "DELETE">(
    path: NeverOr<Type, Path>,
    handler: TypedHandler<API, Path, Type>,
  ): this;
  patch<Path extends Routes<API>, Type extends Methods<API, Path> & "PATCH">(
    path: NeverOr<Type, Path>,
    handler: TypedHandler<API, Path, Type>,
  ): this;
  options<Path extends Routes<API>, Type extends Methods<API, Path> & "OPTIONS">(
    path: NeverOr<Type, Path>,
    handler: TypedHandler<API, Path, Type>,
  ): this;
  head<Path extends Routes<API>, Type extends Methods<API, Path> & "HEAD">(
    path: NeverOr<Type, Path>,
    handler: TypedHandler<API, Path, Type>,
  ): this;
}

const express: <T extends RestTSBase>() => Express<T> = exp;

export default express;

// const app = express<{ "/test": { POST: { body: { j: 3 }; response: string } } }>();

// app.post("/test", async (req) => {
//   return "";
// });

// app.post("/est", async (req) => {
//   return 3;
// });

// app.post("/test", async (req) => {
//   return 3 + req.params;
// });

// app.post("/test", async (req) => {
//   return "" + req.body.j * 2;
// });

// export type API = {
//   "/plant-potato": {
//     POST: {
//       body: { size: number; weight: number };
//       response: { result: "success" | "error" };
//     };
//   };
// };

// const app = express<API>();
// app.post("/plant-potato", async (req) => {
//   return {
//     result: "potato",
//   };
// });
