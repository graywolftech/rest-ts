import * as t from "io-ts";
import axios, {
  AxiosRequestConfig,
  AxiosResponse,
  CancelStatic,
  CancelTokenStatic,
  Method,
  AxiosInterceptorManager,
} from "axios";
import { PathReporter } from "io-ts/lib/PathReporter";
import { RestTSBase, RestTSRoute, NeverOr } from "@graywolfai/rest-ts";
import { isLeft } from "fp-ts/lib/Either";

export interface TypedAxiosRequestConfig<
  API extends RestTSBase,
  Path extends Extract<keyof API, string>,
  Type extends Extract<keyof API[Path], Method>,
  RouteDef extends RestTSRoute = API[Path][Type]
> extends AxiosRequestConfig {
  url?: Type;
  method?: Type;
  /**
   * This is confusing but correct. Axios params are in the url after the "?"
   * But to express those are "query" and "params" are in the url
   */
  params?: t.TypeOf<t.TypeC<Exclude<RouteDef["query"], undefined>>>;
  data?: t.TypeOf<t.TypeC<Exclude<RouteDef["body"], undefined>>>;
}

export interface TypedAxiosResponse<
  API extends RestTSBase,
  Path extends Extract<keyof API, string>,
  Type extends Extract<keyof API[Path], Method>,
  RouteDef extends RestTSRoute = API[Path][Type]
> extends AxiosResponse {
  data: t.TypeOf<t.TypeC<Exclude<RouteDef["response"], undefined>>>;
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

  interceptors: {
    request: AxiosInterceptorManager<AxiosRequestConfig>;
    response: AxiosInterceptorManager<AxiosResponse>;
  };
}

export interface TypedAxiosStatic extends TypedAxiosInstance<any> {
  create<T extends RestTSBase>(api: T, config?: AxiosRequestConfig): TypedAxiosInstance<T>;
  /**
   * This is a special function which wraps get, post, path, etc to always return a response even
   * if an error occurs (e.g. a 400).
   *
   * @param config The typical axios config object.
   */
  // createWrapped<T extends RestTSBase>(config?: AxiosRequestConfig): TypedAxiosInstance<T>;
  Cancel: CancelStatic;
  CancelToken: CancelTokenStatic;
  isCancel(value: any): boolean;
  all<T>(values: (T | Promise<T>)[]): Promise<T[]>;
  spread<T, R>(callback: (...args: T[]) => R): (array: T[]) => R;
}

const wrap = <T extends (...args: any[]) => Promise<AxiosResponse<any>>>(api: RestTSBase, f: T) => {
  return async (...args: any[]): Promise<any> => {
    const res = await f(...args);

    // This is a kinda messy if/else blocks
    // Basically if the url and method are defined (I'm not sure when this would not occur)
    // and if the route and route.response are defined, decode the incoming data and raise
    // and error if the data is not the expected format!
    // We also warn if res.config.url or res.config.method are undefined
    // Or if we can't find the route object to help us validate the response data
    if (res.config.url && res.config.method) {
      const route = api[res.config.url]
        ? api[res.config.url][res.config.method.toUpperCase()]
        : undefined;

      if (route && route.response) {
        const result = t.type(route.response).decode(res.data);
        if (isLeft(result)) {
          throw Error(
            `Data validation failed for "${res.config.url}": ${PathReporter.report(result).join(
              "\n",
            )}`,
          );
        }
      } else if (!route) {
        process.env.NODE_ENV !== "production" &&
          console.warn(
            `[rest-ts-axios] Unable to verify response for "${res.config.url}": Missing route definition!`,
          );
      }
    } else {
      process.env.NODE_ENV !== "production" &&
        console.warn("[rest-ts-axios] Unable to verify response for " + res.config.url);
    }

    return res;
  };
};

const axiosCreate = axios.create.bind(axios);

const create = <T extends RestTSBase>(
  api: T,
  config?: AxiosRequestConfig,
): TypedAxiosInstance<T> => {
  const client = axiosCreate(config);
  client.request = wrap(api, client.request);
  client.get = wrap(api, client.get);
  client.post = wrap(api, client.post);
  client.delete = wrap(api, client.delete);
  client.patch = wrap(api, client.patch);
  client.put = wrap(api, client.put);
  client.head = wrap(api, client.head);
  return client;
};

const TypedAxios: TypedAxiosStatic = Object.assign(axios, { create });

export default TypedAxios;
