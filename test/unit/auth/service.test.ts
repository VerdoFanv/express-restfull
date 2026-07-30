import { AuthService } from "@/modules/auth/service.js";
import { DomainErrors, isAppError } from "@/domain/errors.js";
import { createMemoryAuthRepository } from "../../mocks/auth-repository.js";
import { testConfig } from "../../helpers/config.js";

describe("AuthService", () => {
  it("registers and returns tokens", async () => {
    const svc = new AuthService(createMemoryAuthRepository(), testConfig());
    const result = await svc.register({
      name: "Andi",
      email: "andi@example.com",
      password: "secret1",
    });

    expect(result.user.email).toBe("andi@example.com");
    expect(result.tokens.accessToken).toBeTruthy();
    expect(result.tokens.refreshToken).toBeTruthy();
  });

  it("rejects short password", async () => {
    const svc = new AuthService(createMemoryAuthRepository(), testConfig());
    await expect(
      svc.register({ name: "A", email: "a@b.com", password: "123" }),
    ).rejects.toMatchObject({ code: "INVALID" });
  });

  it("logs in with valid credentials", async () => {
    const svc = new AuthService(createMemoryAuthRepository(), testConfig());
    await svc.register({
      name: "Andi",
      email: "andi@example.com",
      password: "secret1",
    });

    const result = await svc.login({
      email: "andi@example.com",
      password: "secret1",
    });
    expect(result.user.name).toBe("Andi");
  });

  it("rejects bad password", async () => {
    const svc = new AuthService(createMemoryAuthRepository(), testConfig());
    await svc.register({
      name: "Andi",
      email: "andi@example.com",
      password: "secret1",
    });

    await expect(
      svc.login({ email: "andi@example.com", password: "wrong" }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("refreshes tokens", async () => {
    const svc = new AuthService(createMemoryAuthRepository(), testConfig());
    const registered = await svc.register({
      name: "Andi",
      email: "andi@example.com",
      password: "secret1",
    });

    const tokens = await svc.refresh(registered.tokens.refreshToken);
    expect(tokens.accessToken).toBeTruthy();
  });

  it("me returns profile", async () => {
    const svc = new AuthService(createMemoryAuthRepository(), testConfig());
    const registered = await svc.register({
      name: "Andi",
      email: "andi@example.com",
      password: "secret1",
    });

    const me = await svc.me(registered.user.id);
    expect(me.email).toBe("andi@example.com");
  });

  it("duplicate email conflicts", async () => {
    const svc = new AuthService(createMemoryAuthRepository(), testConfig());
    await svc.register({
      name: "Andi",
      email: "andi@example.com",
      password: "secret1",
    });

    try {
      await svc.register({
        name: "Budi",
        email: "andi@example.com",
        password: "secret1",
      });
      throw new Error("should throw");
    } catch (error) {
      if (error instanceof Error && error.message === "should throw") {
        throw error;
      }
      expect(isAppError(error)).toBe(true);
      expect(error).toMatchObject(DomainErrors.emailTaken());
    }
  });
});
