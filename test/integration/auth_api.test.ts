import request from "supertest";
import { AuthService } from "@/modules/auth/service.js";
import { ProductService } from "@/modules/product/service.js";
import { createTestApp } from "../helpers/app.js";
import { testConfig } from "../helpers/config.js";
import { createMemoryAuthRepository } from "../mocks/auth-repository.js";
import { createMemoryProductRepository } from "../mocks/product-repository.js";

describe("auth API", () => {
  const cfg = testConfig();
  let authRepo = createMemoryAuthRepository();
  let app = createTestApp({
    cfg,
    authService: new AuthService(authRepo, cfg),
    productService: new ProductService(
      createMemoryProductRepository(),
      null,
      null,
      cfg,
    ),
  });

  beforeEach(() => {
    authRepo = createMemoryAuthRepository();
    app = createTestApp({
      cfg,
      authService: new AuthService(authRepo, cfg),
      productService: new ProductService(
        createMemoryProductRepository(),
        null,
        null,
        cfg,
      ),
    });
  });

  it("register → login → me", async () => {
    const register = await request(app)
      .post("/api/v1/authentication/register")
      .set("apikey", cfg.apiKey)
      .send({
        name: "Andi",
        email: "andi@example.com",
        password: "secret1",
      });

    expect(register.status).toBe(201);
    expect(register.body.success).toBe(true);
    expect(register.body.data.tokens.accessToken).toBeTruthy();

    const login = await request(app)
      .post("/api/v1/authentication/login")
      .set("apikey", cfg.apiKey)
      .send({ email: "andi@example.com", password: "secret1" });

    expect(login.status).toBe(200);
    const token = login.body.data.tokens.accessToken as string;

    const me = await request(app)
      .get("/api/v1/authentication/me")
      .set("apikey", cfg.apiKey)
      .set("Authorization", `Bearer ${token}`);

    expect(me.status).toBe(200);
    expect(me.body.data.email).toBe("andi@example.com");
  });

  it("requires api key", async () => {
    const res = await request(app)
      .post("/api/v1/authentication/login")
      .send({ email: "a@b.com", password: "secret1" });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("invalid api key");
  });

  it("validates register body", async () => {
    const res = await request(app)
      .post("/api/v1/authentication/register")
      .set("apikey", cfg.apiKey)
      .send({ name: "A", email: "bad", password: "1" });

    expect(res.status).toBe(400);
  });

  it("refreshes token", async () => {
    const register = await request(app)
      .post("/api/v1/authentication/register")
      .set("apikey", cfg.apiKey)
      .send({
        name: "Andi",
        email: "andi@example.com",
        password: "secret1",
      });

    const refresh = await request(app)
      .post("/api/v1/authentication/refresh-token")
      .set("apikey", cfg.apiKey)
      .send({ refreshToken: register.body.data.tokens.refreshToken });

    expect(refresh.status).toBe(200);
    expect(refresh.body.data.accessToken).toBeTruthy();
  });
});
