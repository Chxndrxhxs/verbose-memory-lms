import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const HOST = process.env.STATIC_HOST ?? "0.0.0.0";
const PORT = Number(process.env.STATIC_PORT ?? 8001);

const MOUNTS = [
  { prefix: "/teach", dir: path.join(root, "frontend-instructor", "dist") },
  { prefix: "/admin", dir: path.join(root, "frontend-admin", "dist") },
  { prefix: "", dir: path.join(root, "frontend-learner", "dist") },
];

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
  ".map": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".pdf": "application/pdf",
};

function resolveFile(dir, sub) {
  const normalized = path.normalize(path.join(dir, sub));
  if (!normalized.startsWith(dir)) return null;
  try {
    const stat = fs.statSync(normalized);
    if (stat.isFile()) return normalized;
  } catch {
    return null;
  }
  return null;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://x");
  let pathname = decodeURIComponent(url.pathname);

  const mount = MOUNTS.find((m) => (m.prefix ? pathname === m.prefix || pathname.startsWith(m.prefix + "/") : true)) ?? MOUNTS[MOUNTS.length - 1];
  let sub = mount.prefix ? pathname.slice(mount.prefix.length) || "/" : pathname;

  let file = resolveFile(mount.dir, "." + sub);
  if (!file) file = path.join(mount.dir, "index.html");

  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404, { "content-type": "text/plain" });
      res.end("not found");
      return;
    }
    res.writeHead(200, {
      "content-type": TYPES[path.extname(file)] ?? "application/octet-stream",
      "cache-control": file.endsWith("index.html") ? "no-cache" : "public, max-age=86400",
    });
    res.end(data);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`static serving on http://${HOST}:${PORT} (/, /teach, /admin)`);
});
