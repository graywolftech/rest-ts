import express from "express";
import { TypedAsyncRouter } from "./index";

// Not a real test but it does test the types
const app = express();
// const router = TypedAsyncRouter<{ "/test": { POST: { body: { j: 3 }; response: string } } }>(app);

// router.post("/test", async (req) => {
//   return "";
// });

// router.post("/est", async (req) => {
//   return 3;
// });

// router.post("/test", async (req) => {
//   return 3 + req.params;
// });

// router.post("/test", async (req) => {
//   return "" + req.body.j * 2;
// });

export type API = {
  "/plant-potato": {
    POST: {
      body: { size: number; weight: number };
      response: { result: "success" | "error" };
    };
  };
};

const router = TypedAsyncRouter<API>(app);
router.post("/plant-potato", async () => {
  return {
    result: "success",
  };
});
