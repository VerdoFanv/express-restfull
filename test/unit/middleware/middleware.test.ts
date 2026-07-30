import express from "express";
import request from "supertest";
import { apiKey } from "@/middleware/api-key.js";
import { auth } from "@/middleware/auth.js";
import jwt from "jsonwebtoken";
import { ok } from "@/shared/response.js";

describe("middleware", () => {
  it("rejects missing api key", async () => {
    const app = express();
    app.use(apiKey("dev-api-key"));
    app.get("/x", (_req, res) => ok(res, "ok"));

    const res = await request(app).get("/x");
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("invalid api key");
  });

  it("accepts apikey header", async () => {
    const app = express();
    app.use(apiKey("dev-api-key"));
    app.get("/x", (_req, res) => ok(res, "ok", { ok: true }));

    const res = await request(app).get("/x").set("apikey", "dev-api-key");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("rejects expired access token with contract message", async () => {
    const secret = "test-secret";
    const token = jwt.sign(
      {
        userId: 1,
        type: "access",
        exp: Math.floor(Date.now() / 1000) - 60,
      },
      secret,
    );

    const app = express();
    app.get("/me", auth(secret), (req, res) =>
      ok(res, "success", { userId: req.userId }),
    );

    const res = await request(app)
      .get("/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Unauthorized: Token expired");
  });
});
