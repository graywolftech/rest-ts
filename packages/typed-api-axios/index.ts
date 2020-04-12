import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  CancelStatic,
  CancelTokenStatic,
  Method,
} from "axios";

import { RestypedIndexedBase, RestypedRoute, NeverOr, NeverIfUnknown } from "typed-api";

export interface TypedAxiosRequestConfig<
  API extends RestypedIndexedBase,
  Path extends Extract<keyof API, string>,
  Type extends Extract<keyof API[Path], Method>,
  RouteDef extends RestypedRoute = API[Path][Type]
> extends AxiosRequestConfig {
  url?: Type;
  method?: Method;
  params?: NeverIfUnknown<RouteDef["query"]>;
  data?: NeverIfUnknown<RouteDef["body"]>;
}

export interface TypedAxiosResponse<
  API extends RestypedIndexedBase,
  Path extends Extract<keyof API, string>,
  Type extends Extract<keyof API[Path], Method>,
  RouteDef extends RestypedRoute = API[Path][Method]
> extends AxiosResponse {
  data: RouteDef["response"];
  config: TypedAxiosRequestConfig<API, Path, Type>;
}

export interface TypedAxiosInstance<API extends RestypedIndexedBase> {
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
    url: NeverOr<Path, Type>,
    data?: API[Path]["POST"]["body"],
    config?: TypedAxiosRequestConfig<API, Path, Type>,
  ): Promise<TypedAxiosResponse<API, Path, Type>>;

  put<
    Path extends Extract<keyof API, string>,
    Type extends Extract<keyof API[Path], Method> & "PUT"
  >(
    url: NeverOr<Type, Path>,
    data?: API[Path]["PUT"]["body"],
    config?: TypedAxiosRequestConfig<API, Path, Type>,
  ): Promise<TypedAxiosResponse<API, Path, Type>>;

  patch<
    Path extends Extract<keyof API, string>,
    Type extends Extract<keyof API[Path], Method> & "PATCH"
  >(
    url: NeverOr<Type, Path>,
    data?: API[Path]["PATCH"]["body"],
    config?: TypedAxiosRequestConfig<API, Path, Type>,
  ): Promise<TypedAxiosResponse<API, Path, Type>>;
}

export interface TypedAxiosStatic extends TypedAxiosInstance<any> {
  create<T extends RestypedIndexedBase>(config?: AxiosRequestConfig): TypedAxiosInstance<T>;
  Cancel: CancelStatic;
  CancelToken: CancelTokenStatic;
  isCancel(value: any): boolean;
  all<T>(values: (T | Promise<T>)[]): Promise<T[]>;
  spread<T, R>(callback: (...args: T[]) => R): (array: T[]) => R;
}

const TypedAxios: TypedAxiosStatic = axios;

const t = TypedAxios.create<{ "/test": { GET: { body: { id: string } } } }>({});
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

export default TypedAxios;
