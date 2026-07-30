import request from "supertest";
import { AuthService } from "@/modules/auth/service.js";
import { ProductService } from "@/modules/product/service.js";
import { createTestApp } from "../helpers/app.js";
import { testConfig } from "../helpers/config.js";
import { createMemoryAuthRepository } from "../mocks/auth-repository.js";
import { createMemoryProductRepository } from "../mocks/product-repository.js";

async function registerAndToken(app: ReturnType<typeof createTestApp>, apiKey: string) {
  const res = await request(app)
    .post("/api/v1/authentication/register")
    .set("apikey", apiKey)
    .send({
      name: "Andi",
      email: `andi-${Date.now()}@example.com`,
      password: "secret1",
    });
  return res.body.data.tokens.accessToken as string;
}

describe("product API", () => {
  const cfg = testConfig();
  let app = createTestApp({
    cfg,
    authService: new AuthService(createMemoryAuthRepository(), cfg),
    productService: new ProductService(
      createMemoryProductRepository(),
      null,
      null,
      cfg,
    ),
  });

  beforeEach(() => {
    app = createTestApp({
      cfg,
      authService: new AuthService(createMemoryAuthRepository(), cfg),
      productService: new ProductService(
        createMemoryProductRepository(),
        null,
        null,
        cfg,
      ),
    });
  });

  it("full CRUD", async () => {
    const token = await registerAndToken(app, cfg.apiKey);

    const create = await request(app)
      .post("/api/v1/products")
      .set("apikey", cfg.apiKey)
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Kopi Susu",
        description: "Iced",
        price: 28000,
        stock: 10,
      });

    expect(create.status).toBe(201);
    const id = create.body.data.id as number;

    const list = await request(app)
      .get("/api/v1/products")
      .set("apikey", cfg.apiKey)
      .set("Authorization", `Bearer ${token}`);
    expect(list.status).toBe(200);
    expect(list.body.data).toHaveLength(1);

    const get = await request(app)
      .get(`/api/v1/products/${id}`)
      .set("apikey", cfg.apiKey)
      .set("Authorization", `Bearer ${token}`);
    expect(get.status).toBe(200);
    expect(get.body.data.name).toBe("Kopi Susu");

    const update = await request(app)
      .put(`/api/v1/products/${id}`)
      .set("apikey", cfg.apiKey)
      .set("Authorization", `Bearer ${token}`)
      .send({ price: 30000 });
    expect(update.status).toBe(200);
    expect(update.body.data.price).toBe(30000);

    const del = await request(app)
      .delete(`/api/v1/products/${id}`)
      .set("apikey", cfg.apiKey)
      .set("Authorization", `Bearer ${token}`);
    expect(del.status).toBe(200);
  });

  it("requires bearer token", async () => {
    const res = await request(app)
      .get("/api/v1/products")
      .set("apikey", cfg.apiKey);

    expect(res.status).toBe(401);
  });
});
