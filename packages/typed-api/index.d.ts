// RESTyped implementations should take a type parameter that
// extends Base
export type NeverOr<X, Y> = X extends never ? never : Y;

export type NeverIfUnknown<X> = unknown extends X ? never : X;

export interface RestypedRoute {
  params?: any;
  query?: any;
  body?: any;
  response?: any;
}

// Here for reference. It's not recommended to extend your API
// definition from IndexedBase, because then your definition will
// not cause errors when an invalid route is defined or called
export type RestypedIndexedBase = {
  // e.g. '/orders'
  [route: string]: {
    // 'GET' | 'POST' | 'PUT' | 'PATCH' | 'HEAD' | 'DELETE' | 'OPTIONS'
    [method: string]: RestypedRoute;
  };
};
