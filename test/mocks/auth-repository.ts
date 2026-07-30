import type { User } from "@prisma/client";
import type { AuthRepository } from "@/modules/auth/repository.js";

export function createMemoryAuthRepository(): AuthRepository & {
  users: User[];
} {
  const users: User[] = [];
  let seq = 1;

  return {
    users,
    async create(data) {
      if (users.some((u) => u.email === data.email && !u.deletedAt)) {
        const { DomainErrors } = await import("@/domain/errors.js");
        throw DomainErrors.emailTaken();
      }
      const now = new Date();
      const user: User = {
        id: seq++,
        name: data.name,
        email: data.email,
        passwordHash: data.passwordHash,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      };
      users.push(user);
      return user;
    },
    async findByEmail(email) {
      return users.find((u) => u.email === email && !u.deletedAt) ?? null;
    },
    async findById(id) {
      return users.find((u) => u.id === id && !u.deletedAt) ?? null;
    },
  };
}
