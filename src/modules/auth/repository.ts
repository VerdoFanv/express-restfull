import type { Prisma, PrismaClient, User } from "@prisma/client";
import { DomainErrors } from "@/domain/errors.js";

export type AuthRepository = {
  create(data: {
    name: string;
    email: string;
    passwordHash: string;
  }): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: number): Promise<User | null>;
};

export function createAuthRepository(prisma: PrismaClient): AuthRepository {
  return {
    async create(data) {
      try {
        return await prisma.user.create({
          data: {
            name: data.name,
            email: data.email,
            passwordHash: data.passwordHash,
          },
        });
      } catch (error) {
        if (isUniqueViolation(error)) {
          throw DomainErrors.emailTaken();
        }
        throw error;
      }
    },

    async findByEmail(email) {
      return prisma.user.findFirst({
        where: { email, deletedAt: null },
      });
    },

    async findById(id) {
      return prisma.user.findFirst({
        where: { id, deletedAt: null },
      });
    },
  };
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as Prisma.PrismaClientKnownRequestError).code === "P2002"
  );
}
