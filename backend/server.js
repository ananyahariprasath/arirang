import fs from "node:fs";
import path from "node:path";
import express from "express";
import dotenv from "dotenv";
import { fileURLToPath, pathToFileURL } from "node:url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const apiRoot = path.join(projectRoot, "api");
const port = Number(process.env.PORT || 3001);
const bodyLimit = process.env.BODY_LIMIT || "20mb";

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: bodyLimit }));
app.use(express.urlencoded({ extended: true, limit: bodyLimit }));

const handlerCache = new Map();

function resolveApiModule(relativeApiPath) {
  const cleanPath = String(relativeApiPath || "")
    .trim()
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");
  if (!cleanPath) return null;
  if (cleanPath.includes("..")) return null;
  const fullPath = path.join(apiRoot, `${cleanPath}.js`);
  if (!fullPath.startsWith(apiRoot)) return null;
  return fs.existsSync(fullPath) ? fullPath : null;
}

async function loadHandler(modulePath) {
  if (handlerCache.has(modulePath)) {
    return handlerCache.get(modulePath);
  }
  const moduleUrl = pathToFileURL(modulePath).href;
  const imported = await import(moduleUrl);
  if (typeof imported?.default !== "function") {
    throw new Error(`No default handler exported from ${modulePath}`);
  }
  handlerCache.set(modulePath, imported.default);
  return imported.default;
}

async function runServerlessHandler(modulePath, req, res, extraQuery = {}) {
  req.query = { ...(req.query || {}), ...extraQuery };
  const handler = await loadHandler(modulePath);
  await handler(req, res);
}

app.get("/healthz", (_req, res) => {
  res.status(200).json({ ok: true, service: "backend", timestamp: Date.now() });
});

app.all("/api/auth/:action", async (req, res) => {
  const modulePath = resolveApiModule("auth");
  if (!modulePath) {
    return res.status(404).json({ error: "Auth module not found" });
  }
  try {
    await runServerlessHandler(modulePath, req, res, { action: req.params.action });
    if (!res.headersSent) {
      return res.status(204).end();
    }
  } catch (error) {
    console.error("Backend auth route error:", error);
    if (!res.headersSent) {
      return res.status(500).json({ error: "Internal server error" });
    }
  }
});

app.all(/^\/api\/(.+)$/, async (req, res) => {
  const relativeApiPath = req.params[0];
  const modulePath = resolveApiModule(relativeApiPath);
  if (!modulePath) {
    return res.status(404).json({ error: "API route not found" });
  }
  try {
    await runServerlessHandler(modulePath, req, res);
    if (!res.headersSent) {
      return res.status(204).end();
    }
  } catch (error) {
    console.error(`Backend route error (${relativeApiPath}):`, error);
    if (!res.headersSent) {
      return res.status(500).json({ error: "Internal server error" });
    }
  }
});

app.use((req, res) => {
  res.status(404).json({
    error: "Not found",
    message: `No backend route for ${req.method} ${req.originalUrl}`,
  });
});

app.listen(port, () => {
  console.log(`[backend] running on http://localhost:${port}`);
});
