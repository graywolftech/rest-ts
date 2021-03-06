# rest-ts
End-to-end REST API typings using TypeScript.

> Original idea taken from @rawrmaan [restyped](https://github.com/rawrmaan/restyped). This library offers stricter type checking and updated dependencies. Eventually, it will also incorporate [`io-ts`](https://github.com/gcanti/io-ts) for automatic boundary type-checking.

## The Idea
Define your REST API such that it can be consumed by your frontend and backend. Use simple type wrappers around client libraries such as [axios](https://github.com/axios/axios) and router libraries such as [express](https://expressjs.com/) which consume your API definition and then type check your requests / route definitions.

The API definition would look something like this:

```typescript
export type API = {
  "/plant-potato": {
    POST: {
      body: { size: number; weight: number };
      response: { result: "one-potato" | "two-potato" };
    };
  };
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

## Why use Type REST?
> **End-to-end typing**: Share request and response types between your client and server for ease of use and peace of mind.  
> **Unopinionated**: Works with any new or existing REST API.  
> **Universal**: Can support any server framework or REST client.  
> **~~Lightweight~~ Weightless**: Client and server implementations add no runtime code--It's Just Types™.  
> **Use existing syntax**: Declare and call your routes the same way you always have.  
> **Great for private APIs**: Keep API clients across your organization in sync with the latest changes.  
> **Great for public APIs**: Create a RESTyped definition so TypeScript users can consume your API fully typed.  
> **Easy to learn and use**: Start using RESTyped in less than one minute per route.

Quote taken from [restyped](https://github.com/rawrmaan/restyped#benefits).

## Installation & Usage
This will talk you through the steps to install and use `rest-ts`. Note that there are examples below after you complete these steps.

1. Make sure your TypeScript version is at least `3.0` as the `unknown` type is used.

2. Define your common API. Ensure that you are using a `type` and not an `interface` or you will you receive a `TypeScript` error.

```typescript
export type RestAPI = {
  ...
};
```

3. Install [`@graywolfai/rest-ts-express`](http://npmjs.com/package/@graywolfai/rest-ts-express) in your backend.

```shell
npm install --save @graywolfai/rest-ts-express express
```

> Note: [`express`](https://www.npmjs.com/package/express) is a peer dependency.

4. Import and create your `express` router.

```typescript
import * as express from "express";
import { TypedAsyncRouter } from "rest-ts-express";
import { RestAPI } from "path/to/api";

const app = express();
const router = TypedAsyncRouter<RestAPI>(app);

// Define your routes like normal
router.get("/some/route", async (req) => {
  ...
  return {
    // Your response goes here
    ...
  }
});
```

> Typically, you send your response using `router.send` or `router.json` but that doesn't work that well for type checking. How can we be *sure* that you actually return the expected response? Furthermore, using `async/await` is a *pain* as you need to [explicitly catch all errors](https://zellwk.com/blog/async-await-express/) and send them using `next(error)`. We define a light wrapper around your `async` handler to remedy both of these issues.

```typescript
// method = "get" | "post" | "put" | "delete" | "patch" | "options" | "head"
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
const client = axios.create<RestAPI>();

// Use the axios client like normal
const results = await client.get("/some/route");
```

> NOTE: Currently, only `express` and `axios` are supported. Other libraries can easily be added, just create an issue and/or PR!

## Specification
Here is the specification as defined in [`@graywolfai/rest-ts`](https://npmjs.com/package/@graywolfai/rest-ts).

```typescript
export interface RestTSRoute {
  params?: { [k: string]: string };
  query?: { [k: string]: string };
  body?: any;
  response?: any;
}

// This is the type that your API must conform to.
// Note that you do NOT need to import this or use it in your code in any way.
export type RestTSBase = {
  // e.g. '/orders'
  [route: string]: {
    // 'GET' | 'POST' | 'PUT' | 'PATCH' | 'HEAD' | 'DELETE' | 'OPTIONS'
    [method: string]: RestTSRoute;
  };
};
```

Here is an example API that uses `params`, `query`, `body` and `response`.
```typescript
interface User {
  email: string;
  name: string;
}

export interface SocialAPI {
  "/users": {
    // Route name (without prefix, if you have one)
    GET: {
      // Any valid HTTP method
      query: {
        // Query string params (e.g. /users?includeProfilePics=true)
        includeProfilePics?: "true" | "false";
      };
      response: User[]; // JSON response
    };
  };

  "/user/:id/send-message": {
    POST: {
      params: {
        // Inline route params
        id: string;
      };
      body: {
        // JSON request body
        message: string;
      };
      response: {
        // JSON response
        success: boolean;
      };
    };
  };
}
```

## Limitations
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

That's it! Now you can enter the packages and make modifications :) This is an interesting library since there isn't actually any code to run.

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
