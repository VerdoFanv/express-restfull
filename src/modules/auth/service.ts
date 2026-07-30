import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { User as PrismaUser } from "@prisma/client";
import type { Config } from "@/config/index.js";
import { DomainErrors } from "@/domain/errors.js";
import type { AuthResult, AuthTokens, User } from "@/domain/types.js";
import type { JwtClaims } from "@/middleware/auth.js";
import type { AuthRepository } from "@/modules/auth/repository.js";

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export class AuthService {
  constructor(
    private readonly repo: AuthRepository,
    private readonly cfg: Config,
  ) {}

  async register(input: RegisterInput): Promise<AuthResult> {
    const name = input.name.trim();
    const email = input.email.trim().toLowerCase();
    if (!name || !email || input.password.length < 6) {
      throw DomainErrors.invalid();
    }

    const passwordHash = await bcrypt.hash(input.password, this.cfg.bcryptCost);
    const model = await this.repo.create({ name, email, passwordHash });
    const tokens = this.issueTokens(model.id);

    return { user: toDomain(model), tokens };
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const email = input.email.trim().toLowerCase();
    if (!email || !input.password) {
      throw DomainErrors.invalid();
    }

    const model = await this.repo.findByEmail(email);
    if (!model) {
      throw DomainErrors.unauthorized();
    }

    const ok = await bcrypt.compare(input.password, model.passwordHash);
    if (!ok) {
      throw DomainErrors.unauthorized();
    }

    return {
      user: toDomain(model),
      tokens: this.issueTokens(model.id),
    };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    if (!refreshToken) {
      throw DomainErrors.invalid();
    }

    let claims: JwtClaims;
    try {
      claims = jwt.verify(refreshToken, this.cfg.jwtSecret) as JwtClaims;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw DomainErrors.tokenExpired();
      }
      throw DomainErrors.unauthorized();
    }

    if (claims.type !== "refresh") {
      throw DomainErrors.unauthorized();
    }

    const user = await this.repo.findById(claims.userId);
    if (!user) {
      throw DomainErrors.unauthorized();
    }

    return this.issueTokens(claims.userId);
  }

  async me(userId: number): Promise<User> {
    const model = await this.repo.findById(userId);
    if (!model) {
      throw DomainErrors.notFound();
    }
    return toDomain(model);
  }

  private issueTokens(userId: number): AuthTokens {
    const accessToken = jwt.sign(
      { userId, type: "access" } satisfies JwtClaims,
      this.cfg.jwtSecret,
      { expiresIn: Math.floor(this.cfg.jwtAccessTtlMs / 1000) },
    );

    const refreshToken = jwt.sign(
      { userId, type: "refresh" } satisfies JwtClaims,
      this.cfg.jwtSecret,
      { expiresIn: Math.floor(this.cfg.jwtRefreshTtlMs / 1000) },
    );

    return { accessToken, refreshToken };
  }
}

function toDomain(model: PrismaUser): User {
  return {
    id: model.id,
    name: model.name,
    email: model.email,
    createdAt: model.createdAt,
    updatedAt: model.updatedAt,
  };
}
