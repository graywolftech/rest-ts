<!-- TODO change to type rest -->

# Type Rest

End-to-end REST API typings using TypeScript.

> Original idea taken from @rawrmaan [restyped](https://github.com/rawrmaan/restyped).

## Why use Type Rest?

> **End-to-end typing**: Share request and response types between your client and server for ease of use and peace of mind.  
> **Unopinionated**: Works with any new or existing REST API.  
> **Universal**: Can support any server framework or REST client.  
> **Lightweight Weightless**: Client and server implementations add no runtime code--It's Just Types™.  
> **Use existing syntax**: Declare and call your routes the same way you always have.  
> **Great for private APIs**: Keep API clients across your organization in sync with the latest changes.  
> **Great for public APIs**: Create a RESTyped definition so TypeScript users can consume your API fully typed.  
> **Easy to learn and use**: Start using RESTyped in less than one minute per route.

Quote from [restyped](https://github.com/rawrmaan/restyped#benefits):

## Installation

### Backend (Express)

```shell
# express is a peerDependency
npm install --save type-rest-express express
```

## Usage

```typescript
// Define your API
// api.d.ts
export type API = {
  "/users": {
    POST: {
      body: { id: string };
      response: { name: string };
    };
  };
};

// backend.ts
import { API } from "./api"; // import your API definition
import express from "type-rest-express";

const app = express<API>();

// Define your routes
app.post("/users", async (req) => {
  return {
    name: "" + req.body.id,
  };
});

// ERROR: Argument of type '"/user"' is not assignable to parameter of type '"/users"'.ts(2345)
app.post("/user", async (req) => {
  return {};
});

app.post("/users", async (req) => {
  // ERROR: Object is of type 'unknown'.ts(2571)
  return {
    name: req.params.name,
  };
});

// ERROR: Type 'number' is not assignable to type 'string'.ts(2345)
app.post("/users", async (req) => {
  return {
    name: 3,
  };
});
```

## Limitations

#### No route definition guards

`type-rest-express` cannot guard against unhandled routes. If you define a get request to `/users` but forget to handle your route as such:

```typescript
app.get('/users', () => {
  ...
})
```

no compile time error will be thrown!
