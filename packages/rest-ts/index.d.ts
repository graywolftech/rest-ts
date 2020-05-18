import * as t from "io-ts";

// DO NOT USE THIS LIBRARY
// It is only for the router and client libraries
// You simply need to define your types such that they conform to this specification
// Please be careful defining `params` and `query` because they are really just Record<string, string>
export interface RestTSRoute {
  params?: t.Mixed;
  query?: t.Mixed;
  body?: t.Mixed;
  response?: t.Mixed;
}

export type RestTSBase = {
  // e.g. '/orders'
  [route: string]: {
    // 'GET' | 'POST' | 'PUT' | 'PATCH' | 'HEAD' | 'DELETE' | 'OPTIONS'
    [method: string]: RestTSRoute;
  };
};

// Common utilities
export type NeverOr<X, Y> = X extends never ? never : Y;

export type NeverIfUnknown<X> = unknown extends X ? never : X;
