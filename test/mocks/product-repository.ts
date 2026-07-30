import type { Product } from "@prisma/client";
import { DomainErrors } from "@/domain/errors.js";
import type { ProductRepository } from "@/modules/product/repository.js";

export function createMemoryProductRepository(): ProductRepository & {
  products: Product[];
} {
  const products: Product[] = [];
  let seq = 1;

  return {
    products,
    async create(data) {
      const now = new Date();
      const product: Product = {
        id: seq++,
        userId: data.userId,
        name: data.name,
        description: data.description,
        price: data.price,
        stock: data.stock,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      };
      products.push(product);
      return product;
    },
    async findById(id) {
      return products.find((p) => p.id === id && !p.deletedAt) ?? null;
    },
    async listByUser(userId) {
      return products
        .filter((p) => p.userId === userId && !p.deletedAt)
        .sort((a, b) => b.id - a.id);
    },
    async update(product) {
      const idx = products.findIndex((p) => p.id === product.id);
      if (idx < 0) throw DomainErrors.notFound();
      products[idx] = { ...product, updatedAt: new Date() };
      return products[idx];
    },
    async delete(id) {
      const product = products.find((p) => p.id === id && !p.deletedAt);
      if (!product) throw DomainErrors.notFound();
      product.deletedAt = new Date();
    },
  };
}
