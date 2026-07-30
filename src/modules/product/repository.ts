import type { PrismaClient, Product } from "@prisma/client";
import { DomainErrors } from "@/domain/errors.js";

export type ProductRepository = {
  create(data: {
    userId: number;
    name: string;
    description: string;
    price: number;
    stock: number;
  }): Promise<Product>;
  findById(id: number): Promise<Product | null>;
  listByUser(userId: number): Promise<Product[]>;
  update(product: Product): Promise<Product>;
  delete(id: number): Promise<void>;
};

export function createProductRepository(
  prisma: PrismaClient,
): ProductRepository {
  return {
    async create(data) {
      return prisma.product.create({ data });
    },

    async findById(id) {
      return prisma.product.findFirst({
        where: { id, deletedAt: null },
      });
    },

    async listByUser(userId) {
      return prisma.product.findMany({
        where: { userId, deletedAt: null },
        orderBy: { id: "desc" },
      });
    },

    async update(product) {
      return prisma.product.update({
        where: { id: product.id },
        data: {
          name: product.name,
          description: product.description,
          price: product.price,
          stock: product.stock,
        },
      });
    },

    async delete(id) {
      const result = await prisma.product.updateMany({
        where: { id, deletedAt: null },
        data: { deletedAt: new Date() },
      });
      if (result.count === 0) {
        throw DomainErrors.notFound();
      }
    },
  };
}
