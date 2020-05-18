# rest-ts
End-to-end REST API typings using TypeScript.

> Original idea taken from @rawrmaan [restyped](https://github.com/rawrmaan/restyped). This library offers stricter type checking, updated dependencies and incorporates [`io-ts`](https://github.com/gcanti/io-ts) for automatic boundary type-checking.

## The Idea
Define your REST API such that it can be consumed by your frontend and backend. Use simple wrappers around client libraries such as [axios](https://github.com/axios/axios) and router libraries such as [express](https://expressjs.com/) which consume your API definition and then type check your requests / route definitions during compilation time and do boundary checks during runtime.

The API definition would look something like this:

```typescript
import * as t from "io-ts";

export const API = {
  "/plant-potato": {
    POST: {
      body: t.type({
        size: t.number,
        weight: t.number,
      }),
      response: t.type({
        result: t.intersection([t.literal("one-potato"), t.literal("two-potato")]),
      }),
    },
  },
};
```

Subsequently, when defining your router, everything is type checked:

```typescript
// ERROR: Argument of type '"/plan-potato"' is not assignable to parameter of type '"/plant-potato"'.ts(2345)
router.post("/plan-potato", async (req) => {
  ...
})

router.post("/plant-potato", async (req) => {
  ...
  // ERROR Property 'height' does not exist on type '{ size: number; weight: number; }'. Did you mean 'weight'?ts(2551)
  plantPotato(req.body.height);
  ...
});

// ERROR: Type '"three-potato"' is not assignable to type '"one-potato" | "two-potato"'.ts(2345)
router.post("/plant-potato", async (req) => {
  return {
    result: "three-potato"
  }
});
```

Next, when calling your API from your client, everything is also type checked:

```typescript
// ERROR Argument of type '"/plan-potato"' is not assignable to parameter of type '"/plant-potato"'.ts(2345)
client.post("/plan-potato", { size: 2, weight: 55 });

// ERROR Property 'weight' is missing in type '{ size: number; }' but required in type '{ size: number; weight: number; }'.ts(2345)
client.post("/plant-potato", { size: 2 });

const response = await client.post("/plant-potato", { size: 2, weight: 55 });
// ERROR: This condition will always return 'false' since the types '"one-potato" | "two-potato"' and '"three-potato"' have no overlap.ts(2367)
response.data.result === "three-potato";
```

## Why use rest-ts?
> "**End-to-end typing**: Share request and response types between your client and server for ease of use and peace of mind.  
> **Unopinionated**: Works with any new or existing REST API.  
> **Universal**: Can support any server framework or REST client.  
> **~~Lightweight~~ Weightless**: Client and server implementations add no runtime code--It's Just Types™.  
> **Use existing syntax**: Declare and call your routes the same way you always have.  
> **Great for private APIs**: Keep API clients across your organization in sync with the latest changes.  
> **Great for public APIs**: Create a RESTyped definition so TypeScript users can consume your API fully typed.  
> **Easy to learn and use**: Start using RESTyped in less than one minute per route."  
> \- [`restyped`](https://github.com/rawrmaan/restyped#benefits)

The above quote isn't *exactly* accurate for this library as we explicitly perform boundary type checking during development *and* production environments. Specifically, this library is *lightweight*, not *weightless*. Anyway, what does boundary type checking mean exactly?
1. Before calling your `express` handler function, we use `io-ts` to ensure the params, query params and body are all in the correct format. If there are any issues, we immediately return a `400 Bad Request` response along with information about the malformed or missing data.
2. After receiving a response using `axios`, we use `io-ts` to ensure the response body is in the correct format. Similar to above, if there any issues, we throw an `Error` with information about the malformed or missing data.

> Check out [this great article](https://lorefnon.tech/2018/03/25/typescript-and-validations-at-runtime-boundaries/) by @lorefnon to learn more about boundary type checking 😃

## Installation & Usage
This will talk you through the steps to install and use `rest-ts`. Note that there are examples below after you complete these steps.

1. Make sure your TypeScript version is at least `3.0` as the `unknown` type is used.

2. Define your common API!
```typescript
export const RestAPI = {
  ...
};
```

> Note: [`io-ts`](https://github.com/gcanti/io-ts) and [`fp-ts`](https://github.com/gcanti/fp-ts) are both peer dependencies of `@graywolfai/rest-ts-express` and `@graywolfai/rest-ts-axios`. The exact installation method will depend on how your project(s) are structured. For example, are you only using `@graywolfai/rest-ts-express` to develop a server or are you creating a full-stack application and distributing your types using a package? There aren't any exact guidelines for now but this may change in the future.

3. Install [`@graywolfai/rest-ts-express`](http://npmjs.com/package/@graywolfai/rest-ts-express) in your backend.

```shell
npm install --save @graywolfai/rest-ts-express express body-parser
```

> Note: [`express`](https://www.npmjs.com/package/express) is a peer dependency and body-parser (or some alternative) is required to parse your JSON body.

4. Import and create your `express` router.

```typescript
import * as express from "express";
import bodyParser from "body-parser";
import { TypedAsyncRouter } from "rest-ts-express";
import { RestAPI } from "path/to/api";

const app = express();
const router = TypedAsyncRouter(RestAPI, app);
router.use(bodyParser.json());

// Define your routes like normal
router.get("/some/route", async (req) => {
  ...
  return {
    // Your response goes here
    ...
  }
});
```

> Typically, you send your response using `router.send` or `router.json` but that doesn't work that well for type checking. How can we be *sure* that you actually return the expected response? Furthermore, using `async/await` is a *pain* as you need to [explicitly catch all errors](https://zellwk.com/blog/async-await-express/) and send them using `next(error)`. We define a light wrapper around your `async` handler to remedy both of these issues (along with decoding the `params`, `query` and `body` objects in the request).

```typescript
// `api` is your defined RestAPI
// method = "get" | "post" | "put" | "delete" | "patch" | "options" | "head"
const route = api[path][method.toUpperCase()];
if (route.body) {
  const result = t.type(route.body).decode(req.body);
  if (isLeft(result)) {
    res.status(400).send({
      status: "error",
      error: "Invalid body: " + PathReporter.report(result).join("\n"),
    });
    return;
  }
}

// the `param` and `query` checks are omitted but are very similar
...

// finally, we wrap your handler with async/await helpers!
router[method](path, (req, res, next) => {
  handler(req, res, next)
    .then((result) => {
      if (!res.headersSent) {
        res.send(result);
      }
    })
    .catch(next);
});
```

5. Install [`@graywolfai/rest-ts-axios`](http://npmjs.com/package/@graywolfai/rest-ts-axios) in your frontend.

```shell
npm install --save @graywolfai/rest-ts-axios axios
```

> Note: [`axios`](https://www.npmjs.com/package/axios) is a peer dependency.

6. Import and create an `axios` instance.

```typescript
import axios from "rest-ts-axios";
import { RestAPI } from "path/to/api";

// All of the normal configuration (e.g. `baseUrl`) is supported
// See the axios documentation for more information
const client = axios.create(RestAPI, { baseUrl: "http://example.com" });

// Use the axios client like normal
const results = await client.get("/some/route");
```

As indicated above, we also wrap the axios methods such as `get`, `post`, etc and `decode` the response body the `t.Mixed` response object defined in your route. If the data doesn't match, an error will be thrown. For example, the error will look something like this: `Data validation failed for "/plant-potato": Invalid value 123 supplied to : { status: 200 }/status: 200`. See the [`Path Reporter`](https://github.com/gcanti/io-ts/blob/master/Type.md#error-reporters) information from the `io-ts` docs for more information.

> NOTE: Currently, only `express` and `axios` are supported. Other libraries can easily be added (hopefully), just create an issue and/or PR!

## Specification
Here is the specification as defined in [`@graywolfai/rest-ts`](https://npmjs.com/package/@graywolfai/rest-ts).

```typescript
import * as t from "io-ts";

// DO NOT USE THIS LIBRARY
// It is only for the router and client libraries
// You simply need to define your types such that they conform to this specification
// Please be careful defining `params` and `query` because they are really just Record<string, string>
// They are specified as t.Mixed to give you all of the flexibility you need but just be aware
// that they will *always* fail if your type isn't compatible with a string -> string map
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
    // They *must* be uppercase
    [method: string]: RestTSRoute;
  };
};
```

Here is an example API that uses `params`, `query`, `body` and `response`.
```typescript
import * as t from "io-ts";

const UserType = t.type({
  email: t.string,
  name: t.string,
});

export const SocialAPI = {
  "/users": {
    // Route name (without prefix, if you have one)
    GET: {
      // Any valid HTTP method
      query: t.partial({
        // Query string params (e.g. /users?includeProfilePics=true)
        includeProfilePics: t.string,
      }),
      response: t.array(UserType); // JSON response
    },
  },

  "/user/:id/send-message": {
    POST: {
      params: t.type({
        // Inline route params
        id: string,
      }),
      body: t.type({
        // JSON request body
        message: string,
      }),
      response: t.type({
        // JSON response
        success: boolean,
      }),
    },
  },
}
```

## Limitations
#### Discriminated Unions Issues
I've noticed issues involving [`Discriminated Unions`](https://www.typescriptlang.org/docs/handbook/advanced-types.html#discriminated-unions) when defining *more than one* route (this issues does not apply to only `Discriminated Unions` though). Here is an example!
```typescript
const RestAPI = {
  "/plant-potato/:id": {
    POST: {
      response: {
        status: t.literal(200),
      },
    },
  },
  "/potatoes": {},
}

router.post("/plant-potato/:id", async () => {
  // ERROR: Type 'number' is not assignable to type '200'.ts(2345)
  return {
    status: 200,
  };
});
```

For some reason, TypeScript does not automatically narrow your return type. If anyone has an idea why this might be happening, please let me know :) For now, just use a simple helper function to create narrowed types!

```typescript
const literal = <T extends string | number | boolean>(value: T): T => {
  return value;
};

router.post("/plant-potato/:id", async () => {
  return {
    status: literal(200),
  };
});
```

#### No route definition guards
`@graywolfai/rest-ts-express` cannot guard against unhandled routes. If you define a get request to `/users` but forget to handle your route as such:

```typescript
app.get('/users', () => {
  ...
})
```

No compile time error will be thrown!

#### Inline parameters can't be type checked on the client
`@graywolfai/rest-ts-axios` cannot type check inline route parameters. Consider the `SocialAPI` defined above and the following example using `@graywolfai/rest-ts-axios`:

```typescript
// ERROR: Argument of type '"/user/12345/send-message"' is not assignable to parameter of type 'never'.ts(2345)
client.post("/user/12345/send-message", { message: "some message" });
```

The solution, which isn't perfect, is to cast the URL with the inline param as the correct URL.

```typescript
client.post("/user/12345/send-message" as "/user/:id/send-message", { message: "some message" });
```

## Contributing
This library has been built to power the [`graywolfai`](https://www.graywolfai.com/) platform and is not *that* customizable at the moment. Please feel free to create an issue if you have any suggestions ✍

### Prerequisites
This repository uses [lerna](https://github.com/lerna/lerna). Make sure to install the dependencies before proceeding.
```
npm install
```

### Setup
Install all of the dependencies and link the packages.
```
npm run bootstrap
```

That's it! Now you can enter the packages and make modifications :) This is an interesting library since there isn't really that much code to run.

Finally, ensure the your code is correctly formatted!
```
npm run format:write
```

### Releasing
First, make sure that there is a `vX.X.X-CHANGELOG.md` in `changelogs/`. Then, bump the version of all of the packages at once!
```
npx lerna version --force-publish
```
> It is important that you add `--force-publish` as we want all packages to be updated at once.

This will push a new tag to `GitHub` which will kick off the publish workflow.

That's it 🔥
