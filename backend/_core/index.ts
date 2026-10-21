import "dotenv/config";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import cors from "cors";
import { runAutoMigrations } from "../db/auto-migrate";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Security headers
  const isProduction = process.env.NODE_ENV === "production";
  app.use(helmet({
    contentSecurityPolicy: isProduction ? {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "blob:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    } : false,
    crossOriginEmbedderPolicy: false,
  }));

  // CORS middleware for frontend communication
  const rawFrontendUrl = process.env.VITE_FRONTEND_URL || "https://facturas.kapital360.ao";
  const configuredOrigins = rawFrontendUrl
    .split(",")
    .map(u => u.trim().replace(/\/+$/, ""))
    .filter(Boolean);

  const allowedOrigins = Array.from(new Set([
    "https://facturas.kapital360.ao",
    "http://facturas.kapital360.ao",
    "https://www.facturas.kapital360.ao",
    "https://backfacturas.kapital360.ao",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:4173",
    ...configuredOrigins,
  ]));

  const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
      // Allow non-browser requests (curl, server-to-server, health checks)
      if (!origin) return callback(null, true);

      const cleanOrigin = origin.replace(/\/+$/, "");
      const isAllowed =
        allowedOrigins.includes(cleanOrigin) ||
        cleanOrigin.endsWith(".kapital360.ao") ||
        cleanOrigin === "https://kapital360.ao";

      if (isAllowed) {
        return callback(null, true);
      }
      console.warn(`[CORS] Blocked request from origin: ${origin}`);
      callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie", "x-trpc-source", "x-requested-with"],
    exposedHeaders: ["set-cookie"],
  };

  app.use(cors(corsOptions));
  app.options("*", cors(corsOptions));

  // Health and root status endpoints
  app.get("/", (_req, res) => {
    res.json({
      status: "ok",
      service: "Sistema de Facturação API",
      environment: process.env.NODE_ENV || "development",
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", uptime: process.uptime() });
  });

  // Rate limiting — 100 requests per minute per IP (skips OPTIONS preflight)
  const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.method === "OPTIONS",
    message: { error: "Demasiados pedidos. Tente novamente mais tarde." },
  });
  app.use("/api", limiter);

  // Stricter rate limit for auth endpoints — 10 per minute per IP (skips OPTIONS preflight)
  const authLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.method === "OPTIONS",
    message: { error: "Demasiadas tentativas de login. Aguarde um momento." },
  });
  app.use("/api/trpc/auth.login", authLimiter);
  app.use("/api/trpc/auth.register", authLimiter);

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // Auto-migrate schema to ensure all columns exist
  await runAutoMigrations();

  const rawPort = process.env.PORT;
  if (rawPort) {
    server.listen(rawPort, () => {
      console.log(`Server running on port/socket: ${rawPort}`);
    });
  } else {
    const port = await findAvailablePort(3000);
    server.listen(port, () => {
      console.log(`Server running on http://localhost:${port}/`);
    });
  }
}

startServer().catch(console.error);
