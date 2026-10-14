import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// Serves the Vercel function in api/chat.ts during `npm run dev`, so the AI assistant works locally.
function devApi(): Plugin {
  return {
    name: 'dev-api',
    configureServer(server) {
      server.middlewares.use('/api/chat', async (req, res) => {
        try {
          const chunks: Buffer[] = [];
          for await (const chunk of req) chunks.push(chunk as Buffer);
          const request = new Request(`http://localhost${req.originalUrl ?? '/api/chat'}`, {
            method: req.method,
            headers: req.headers as Record<string, string>,
            body: req.method === 'GET' || req.method === 'HEAD' ? undefined : Buffer.concat(chunks),
          });
          const mod = await server.ssrLoadModule('/api/chat.ts');
          const response: Response =
            req.method === 'POST' ? await mod.POST(request) : new Response('Method Not Allowed', { status: 405 });
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
