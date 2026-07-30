import type { Product as PrismaProduct } from "@prisma/client";
import type { Config } from "@/config/index.js";
import { DomainErrors } from "@/domain/errors.js";
import { EventProductCreated, type Product } from "@/domain/types.js";
import type { ProductRepository } from "@/modules/product/repository.js";
import type { RabbitMQClient } from "@/platform/rabbitmq.js";
import type { RedisClient } from "@/platform/redis.js";
import { logger } from "@/shared/logger.js";

export type CreateProductInput = {
  userId: number;
  name: string;
  description?: string;
  price: number;
  stock?: number;
};

export type UpdateProductInput = {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
};

export class ProductService {
  constructor(
    private readonly repo: ProductRepository,
    private readonly cache: RedisClient | null,
    private readonly mq: RabbitMQClient | null,
    private readonly cfg: Config,
  ) {}

  async create(input: CreateProductInput): Promise<Product> {
    const name = input.name.trim();
    const stock = input.stock ?? 0;
    if (!name || input.price < 0 || stock < 0) {
      throw DomainErrors.invalid();
    }

    const model = await this.repo.create({
      userId: input.userId,
      name,
      description: (input.description ?? "").trim(),
      price: input.price,
      stock,
    });

    const product = toDomain(model);
    await this.setCache(product);
    await this.invalidateListCache(input.userId);
    this.publishProductCreatedAsync(product);
    return product;
  }

  async getById(id: number): Promise<Product> {
    const cached = await this.getCache(id);
    if (cached) return cached;

    const model = await this.repo.findById(id);
    if (!model) throw DomainErrors.notFound();

    const product = toDomain(model);
    await this.setCache(product);
    return product;
  }

  async list(userId: number): Promise<Product[]> {
    const key = listCacheKey(userId);
    if (this.cache) {
      try {
        const raw = await this.cache.get(key);
        if (raw) {
          return JSON.parse(raw) as Product[];
        }
      } catch (error) {
        logger.warn({ err: error }, "redis get list failed");
      }
    }

    const models = await this.repo.listByUser(userId);
    const products = models.map(toDomain);

    if (this.cache) {
      try {
        await this.cache.set(
          key,
          JSON.stringify(products),
          this.cfg.productCacheTtlMs,
        );
      } catch (error) {
        logger.warn({ err: error }, "redis set list failed");
      }
    }

    return products;
  }

  async update(
    userId: number,
    id: number,
    input: UpdateProductInput,
  ): Promise<Product> {
    const model = await this.repo.findById(id);
    if (!model) throw DomainErrors.notFound();
    if (model.userId !== userId) throw DomainErrors.forbidden();

    if (input.name !== undefined) {
      const name = input.name.trim();
      if (!name) throw DomainErrors.invalid();
      model.name = name;
    }
    if (input.description !== undefined) {
      model.description = input.description.trim();
    }
    if (input.price !== undefined) {
      if (input.price < 0) throw DomainErrors.invalid();
      model.price = input.price;
    }
    if (input.stock !== undefined) {
      if (input.stock < 0) throw DomainErrors.invalid();
      model.stock = input.stock;
    }

    const updated = await this.repo.update(model);
    const product = toDomain(updated);
    await this.setCache(product);
    await this.invalidateListCache(userId);
    return product;
  }

  async delete(userId: number, id: number): Promise<void> {
    const model = await this.repo.findById(id);
    if (!model) throw DomainErrors.notFound();
    if (model.userId !== userId) throw DomainErrors.forbidden();

    await this.repo.delete(id);
    await this.deleteCache(id);
    await this.invalidateListCache(userId);
  }

  private publishProductCreatedAsync(product: Product): void {
    if (!this.mq) return;

    void (async () => {
      try {
        await this.mq!.publish(EventProductCreated, {
          type: EventProductCreated,
          payload: {
            id: product.id,
            userId: product.userId,
            name: product.name,
            price: product.price,
            stock: product.stock,
          },
        });
        logger.info({ productId: product.id }, "product.created published async");
      } catch (error) {
        logger.warn(
          { err: error, productId: product.id },
          "publish product.created failed",
        );
      }
    })();
  }

  private async getCache(id: number): Promise<Product | null> {
    if (!this.cache) return null;
    try {
      const raw = await this.cache.get(productCacheKey(id));
      if (!raw) return null;
      return reviveProduct(JSON.parse(raw) as Product);
    } catch {
      return null;
    }
  }

  private async setCache(product: Product): Promise<void> {
    if (!this.cache) return;
    try {
      await this.cache.set(
        productCacheKey(product.id),
        JSON.stringify(product),
        this.cfg.productCacheTtlMs,
      );
    } catch (error) {
      logger.warn({ err: error }, "redis set product failed");
    }
  }

  private async deleteCache(id: number): Promise<void> {
    if (!this.cache) return;
    try {
      await this.cache.del(productCacheKey(id));
    } catch (error) {
      logger.warn({ err: error }, "redis del product failed");
    }
  }

  private async invalidateListCache(userId: number): Promise<void> {
    if (!this.cache) return;
    try {
      await this.cache.del(listCacheKey(userId));
    } catch (error) {
      logger.warn({ err: error }, "redis invalidate list failed");
    }
  }
}

function productCacheKey(id: number): string {
  return `product:${id}`;
}

function listCacheKey(userId: number): string {
  return `products:user:${userId}`;
}

function toDomain(model: PrismaProduct): Product {
  return {
    id: model.id,
    userId: model.userId,
    name: model.name,
    description: model.description,
    price: model.price,
    stock: model.stock,
    createdAt: model.createdAt,
    updatedAt: model.updatedAt,
  };
}

function reviveProduct(product: Product): Product {
  return {
    ...product,
    createdAt: new Date(product.createdAt),
    updatedAt: new Date(product.updatedAt),
  };
}
