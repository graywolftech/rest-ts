import express from "express";
import * as t from "io-ts";
import request from "supertest";
import { TypedAsyncRouter } from "./index";
import bodyParser from "body-parser";

// Not a real test but it does test the types
const app = express();
app.use(bodyParser.json());

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

const router = TypedAsyncRouter(
  {
    "/plant-potato/:id": {
      POST: {
        params: t.type({
          identifier: t.string,
        }),
        response: t.type({
          status: t.literal(200),
        }),
      },
    },
    "/plant-potato": {
      POST: {
        query: t.type({
          weight: t.string,
        }),
        body: t.type({
          id: t.string,
        }),
        response: t.type({
          status: t.literal(200),
        }),
      },
    },
    "/potatoes": {
      GET: {
        response: t.type({
          status: t.literal(200),
          potatoes: t.array(t.type({ size: t.number })),
        }),
      },
    },
  },
  app,
);

const literal = <T extends string | number | boolean>(t: T): T => {
  return t;
};

router.post("/plant-potato/:id", async () => {
  return {
    status: literal(200),
  };
});

router.post("/plant-potato", async () => {
  return {
    status: 200 as 200,
  };
});

router.get("/potatoes", async () => {
  return {
    status: 200 as 200,
    potatoes: [{ size: 400 }],
  };
});

describe("io-ts", () => {
  test("should be able to perform get request", (done) => {
    request(app)
      .get("/potatoes")
      .expect("Content-Type", /json/)
      .expect("Content-Length", "40")
      .expect(200)
      .end((err, res) => {
        expect(res.body).toEqual({ status: 200, potatoes: [{ size: 400 }] });
        if (err) done(err);
        else done();
      });
  });

  test("should be able to perform runtime type check on params", (done) => {
    request(app)
      .post("/plant-potato/5")
      .expect(400)
      .end((err, res) => {
        expect(res.body).toEqual({
          status: "error",
          error:
            "Invalid params: Invalid value undefined supplied to : { identifier: string }/identifier: string",
        });
        if (err) done(err);
        else done();
      });
  });

  test("should be able to perform runtime type check on query", (done) => {
    request(app)
      .post("/plant-potato?weightttt=200")
      .send({ id: "SLKDFJLKDFJ" })
      .expect(400)
      .end((err) => {
        if (err) done(err);
        else done();
      });
  });

  test("should be able to perform runtime type check on body", (done) => {
    request(app)
      .post("/plant-potato?weight=200")
      .send({ identifier: "SLKDFJLKDFJ" })
      .expect(400)
      .end((err) => {
        if (err) done(err);
        else done();
      });
  });

  test("should be able to perform runtime type and return response", (done) => {
    request(app)
      .post("/plant-potato?weight=200")
      .send({ id: "SLKDFJLKDFJ" })
      .expect(200)
      .end((err, res) => {
        expect(res.body).toEqual({ status: 200 });
        if (err) done(err);
        else done();
      });
  });
});
