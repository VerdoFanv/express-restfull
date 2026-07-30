import { ProductService } from "@/modules/product/service.js";
import { createMemoryProductRepository } from "../../mocks/product-repository.js";
import { testConfig } from "../../helpers/config.js";

describe("ProductService", () => {
  it("creates and lists products", async () => {
    const svc = new ProductService(
      createMemoryProductRepository(),
      null,
      null,
      testConfig(),
    );

    const created = await svc.create({
      userId: 1,
      name: "Kopi Susu",
      description: "Iced",
      price: 28000,
      stock: 10,
    });

    expect(created.id).toBeGreaterThan(0);
    const list = await svc.list(1);
    expect(list).toHaveLength(1);
    expect(list[0]?.name).toBe("Kopi Susu");
  });

  it("forbids update by non-owner", async () => {
    const svc = new ProductService(
      createMemoryProductRepository(),
      null,
      null,
      testConfig(),
    );
    const created = await svc.create({
      userId: 1,
      name: "Kopi",
      price: 1000,
      stock: 1,
    });

    await expect(
      svc.update(2, created.id, { name: "Hack" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects invalid price", async () => {
    const svc = new ProductService(
      createMemoryProductRepository(),
      null,
      null,
      testConfig(),
    );

    await expect(
      svc.create({ userId: 1, name: "X", price: -1, stock: 0 }),
    ).rejects.toMatchObject({ code: "INVALID" });
  });

  it("deletes owned product", async () => {
    const svc = new ProductService(
      createMemoryProductRepository(),
      null,
      null,
      testConfig(),
    );
    const created = await svc.create({
      userId: 1,
      name: "Kopi",
      price: 1000,
      stock: 1,
    });

    await svc.delete(1, created.id);
    await expect(svc.getById(created.id)).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});
