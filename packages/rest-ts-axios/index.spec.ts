import axios from "./index";
import http from "http";
import express from "express";
import * as t from "io-ts";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.json());

app.get("/potatoes", (_, res) => res.send({ status: 200, potatoes: [] }));
app.post("/plant-potato", (_, res) => res.send({ status: 123 }));

const api = {
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
      body: t.type({
        size: t.number,
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
};

const client = axios.create(api, {
  baseURL: "http://localhost:5000",
});

describe("io-ts", () => {
  let server: http.Server;
  beforeAll(() => {
    server = app.listen(5000);
  });

  test("can perform basic get request", async () => {
    const result = await client.get("/potatoes");
    expect(result.data).toEqual({ status: 200, potatoes: [] });
  });

  test("catches bad response data", async () => {
    try {
      await client.post("/plant-potato", { size: 500 }, {});
      throw Error("BAD");
    } catch (e) {
      expect(e.message).toEqual(
        'Data validation failed for "/plant-potato": Invalid value 123 supplied to : { status: 200 }/status: 200',
      );
    }
  });

  afterAll(() => {
    server.close();
  });
});
