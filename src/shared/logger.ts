import pino from "pino";
import { loadConfig } from "@/config/index.js";

const cfg = loadConfig();

export const logger = pino({
  level: cfg.logLevel,
  ...(cfg.appEnv === "development" && cfg.logLevel !== "silent"
    ? {
        transport: {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "SYS:standard" },
        },
      }
    : {}),
});
