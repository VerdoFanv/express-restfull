import express from "express";
import request from "supertest";
import { created, fail, ok } from "@/shared/response.js";

describe("response envelope", () => {
  it("returns success envelope", async () => {
    const app = express();
    app.get("/ok", (_req, res) => ok(res, "success", { id: 1 }));

    const res = await request(app).get("/ok");
    expect(res.body).toEqual({
      success: true,
      message: "success",
      data: { id: 1 },
    });
  });

  it("returns created envelope", async () => {
    const app = express();
    app.post("/c", (_req, res) => created(res, "created", { id: 2 }));

    const res = await request(app).post("/c");
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it("returns fail envelope", async () => {
    const app = express();
    app.get("/f", (_req, res) => fail(res, 400, "invalid input"));

    const res = await request(app).get("/f");
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ success: false, message: "invalid input" });
  });
});
