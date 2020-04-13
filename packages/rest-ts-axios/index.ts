import axios, {
  AxiosRequestConfig,
  AxiosResponse,
  CancelStatic,
  CancelTokenStatic,
  Method,
} from "axios";

import { RestTSBase, RestTSRoute, NeverOr, NeverIfUnknown } from "rest-ts";

export interface TypedAxiosRequestConfig<
  API extends RestTSBase,
  Path extends Extract<keyof API, string>,
  Type extends Extract<keyof API[Path], Method>,
  RouteDef extends RestTSRoute = API[Path][Type]
> extends AxiosRequestConfig {
  url?: Type;
  method?: Type;
  params?: NeverIfUnknown<RouteDef["query"]>;
  data?: NeverIfUnknown<RouteDef["body"]>;
}

export interface TypedAxiosResponse<
  API extends RestTSBase,
  Path extends Extract<keyof API, string>,
  Type extends Extract<keyof API[Path], Method>,
  RouteDef extends RestTSRoute = API[Path][Type]
> extends AxiosResponse {
  data: RouteDef["response"];
  config: TypedAxiosRequestConfig<API, Path, Type>;
}

export interface TypedAxiosInstance<API extends RestTSBase> {
  request<Path extends Extract<keyof API, string>, Type extends Extract<keyof API[Path], Method>>(
    config: TypedAxiosRequestConfig<API, Path, Type>,
  ): Promise<TypedAxiosResponse<API, Path, Type>>;

  get<
    Path extends Extract<keyof API, string>,
    Type extends Extract<keyof API[Path], Method> & "GET"
  >(
    url: NeverOr<Type, Path>,
    config?: TypedAxiosRequestConfig<API, Path, Type>,
  ): Promise<TypedAxiosResponse<API, Path, Type>>;

  delete<
    Path extends Extract<keyof API, string>,
    Type extends Extract<keyof API[Path], Method> & "DELETE"
  >(
    url: NeverOr<Type, Path>,
    config?: TypedAxiosRequestConfig<API, Path, Type>,
  ): Promise<TypedAxiosResponse<API, Path, Type>>;

  head<
    Path extends Extract<keyof API, string>,
    Type extends Extract<keyof API[Path], Method> & "HEAD"
  >(
    url: NeverOr<Type, Path>,
    config?: TypedAxiosRequestConfig<API, Path, Type>,
  ): Promise<TypedAxiosResponse<API, Path, Type>>;

  post<
    Path extends Extract<keyof API, string>,
    Type extends Extract<keyof API[Path], Method> & "POST"
  >(
    url: NeverOr<Type, Path>,
    data?: API[Path][Type]["body"],
    config?: TypedAxiosRequestConfig<API, Path, Type>,
  ): Promise<TypedAxiosResponse<API, Path, Type>>;

  put<
    Path extends Extract<keyof API, string>,
    Type extends Extract<keyof API[Path], Method> & "PUT"
  >(
    url: NeverOr<Type, Path>,
    data?: API[Path][Type]["body"],
    config?: TypedAxiosRequestConfig<API, Path, Type>,
  ): Promise<TypedAxiosResponse<API, Path, Type>>;

  patch<
    Path extends Extract<keyof API, string>,
    Type extends Extract<keyof API[Path], Method> & "PATCH"
  >(
    url: NeverOr<Type, Path>,
    data?: API[Path][Type]["body"],
    config?: TypedAxiosRequestConfig<API, Path, Type>,
  ): Promise<TypedAxiosResponse<API, Path, Type>>;
}

export interface TypedAxiosStatic extends TypedAxiosInstance<any> {
  create<T extends RestTSBase>(config?: AxiosRequestConfig): TypedAxiosInstance<T>;
  Cancel: CancelStatic;
  CancelToken: CancelTokenStatic;
  isCancel(value: any): boolean;
  all<T>(values: (T | Promise<T>)[]): Promise<T[]>;
  spread<T, R>(callback: (...args: T[]) => R): (array: T[]) => R;
}

const TypedAxios: TypedAxiosStatic = axios;

// const t = TypedAxios.create<{ "/test": { GET: { body: { id: string } } } }>({});
// t.get("/test", {
//   data: {
//     id: "",
//   },
// });

// t.post("/test", {
//   data: {
//     id: "",
//   },
// });

// export type API = {
//   "/plant-potato": {
//     POST: {
//       body: { size: number; weight: number };
//       response: { result: "one-potato" | "two-potato" };
//     };
//   };
// };

// type T = TypedAxiosResponse<API, "/plant-potato", "POST">;

// interface User {
//   email: string;
//   name: string;
// }

// export type SocialAPI =  {
//   "/users": {
//     // Route name (without prefix, if you have one)
//     GET: {
//       // Any valid HTTP method
//       query: {
//         // Query string params (e.g. /me?includeProfilePics=true)
//         includeProfilePics?: boolean;
//       };
//       response: User[]; // JSON response
//     };
//   };

//   "/user/:id/send-message": {
//     POST: {
//       params: {
//         // Inline route params
//         id: string;
//       };
//       body: {
//         // JSON request body
//         message: string;
//       };
//       response: {
//         // JSON response
//         success: boolean;
//       };
//     };
//   };
// }

// const client = TypedAxios.create<SocialAPI>({ baseURL: '' });
// client.post("/user/12345/send-message" as "/user/:id/send-message", { message: "some message" });

export default TypedAxios;
