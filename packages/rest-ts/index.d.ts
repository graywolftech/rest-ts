// DO NOT USE THIS LIBRARY
// It is only for the router and client libraries
// You simply need to define your types such that they conform to this specification
export interface RestTSRoute {
  params?: { [k: string]: string };
  query?: { [k: string]: string | undefined };
  body?: any;
  response?: any;
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
