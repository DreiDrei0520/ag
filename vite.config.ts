import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// Serves the Vercel functions in api/ during `npm run dev`, so the AI assistant and uploaded images
// work locally. Maps each request path to its function file and calls the matching method export.
const DEV_ROUTES: { prefix: string; file: string }[] = [
  { prefix: '/api/chat', file: '/api/chat.ts' },
  { prefix: '/api/media/', file: '/api/media/[id].ts' },
];

function devApi(): Plugin {
  return {
    name: 'dev-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const route = DEV_ROUTES.find((r) => req.url?.startsWith(r.prefix));
        if (!route) return next();
        try {
          const chunks: Buffer[] = [];
          for await (const chunk of req) chunks.push(chunk as Buffer);
          const method = req.method ?? 'GET';
          const request = new Request(`http://localhost${req.url}`, {
            method,
            headers: req.headers as Record<string, string>,
            body: method === 'GET' || method === 'HEAD' ? undefined : Buffer.concat(chunks),
          });
          const mod = await server.ssrLoadModule(route.file);
          const handler = mod[method] as ((r: Request) => Promise<Response>) | undefined;
          const response = handler ? await handler(request) : new Response('Method Not Allowed', { status: 405 });
          res.statusCode = response.status;
          response.headers.forEach((value, key) => res.setHeader(key, value));
          res.end(Buffer.from(await response.arrayBuffer()));
        } catch (err) {
          server.config.logger.error(String(err));
          res.statusCode = 500;
          res.end();
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // Server-only secrets (no VITE_ prefix) for the dev API; they are never bundled into the client.
  const env = loadEnv(mode, process.cwd(), 'GEMINI_');
  for (const [key, value] of Object.entries(env)) process.env[key] ??= value;

  return {
    plugins: [react(), devApi()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5173,
    },
  };
});
