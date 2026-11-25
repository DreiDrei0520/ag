import { specFromPrompt } from '../src/lib/houseDesign.js';
import { buildHouseConceptViews } from '../src/lib/houseConceptSvg.js';

const DEFAULT_IMAGE_MODEL = 'gemini-nano-banana-2.1';
const DEFAULT_IMAGE_SIZE = '2K';
const MAX_PROMPT_CHARS = 3000;
const RENDER_DIRECTIVE = [
  'You are an architectural visualization studio. Produce a single photorealistic exterior architectural render.',
  'Preserve every specified floor, room, feature, material and finish exactly; do not simplify the design into a basic block or cartoon massing model.',
  'Use professional composition, realistic daylight, global illumination, soft shadows, ambient occlusion, PBR materials and detailed landscaping.',
].join('\n');
const RATE_LIMIT = { windowMs: 5 * 60 * 1000, max: 8 };

export const maxDuration = 60;

interface GeminiInlineData {
  mimeType?: string;
  mime_type?: string;
  data?: string;
}

interface GeminiImageResponse {
  candidates?: {
    content?: {
      parts?: { text?: string; inlineData?: GeminiInlineData; inline_data?: GeminiInlineData }[];
      finishReason?: string;
    };
    finishReason?: string;
  }[];
  promptFeedback?: { blockReason?: string };
}

const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT.windowMs);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > RATE_LIMIT.max;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
}

function conceptFallback(prompt: string) {
  const views = buildHouseConceptViews(specFromPrompt(prompt));
  return {
    image: views[0].image,
    mimeType: 'image/svg+xml',
    source: 'concept' as const,
    views,
    note: 'Live AI rendering is unavailable, so this is an AG architectural concept generated from your specs — drag to view all sides.',
  };
}

export async function POST(request: Request): Promise<Response> {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
  const limited = rateLimited(ip);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid request.' }, 400);
  }
  const prompt = typeof (body as { prompt?: unknown })?.prompt === 'string'
    ? ((body as { prompt: string }).prompt).trim().slice(0, MAX_PROMPT_CHARS)
    : '';
  if (!prompt) return json({ error: 'A design prompt is required.' }, 400);

  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && !limited) {
    const model = process.env.GEMINI_IMAGE_MODEL || DEFAULT_IMAGE_MODEL;
    const imageSize = process.env.GEMINI_IMAGE_SIZE || DEFAULT_IMAGE_SIZE;
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1/models/${encodeURIComponent(model)}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: `${RENDER_DIRECTIVE}\n\n${prompt}` }] }],
          generationConfig: {
            responseModalities: ['TEXT', 'IMAGE'],
            imageConfig: { aspectRatio: '4:3', imageSize },
          },
        }),
        signal: AbortSignal.timeout(45_000),
      });

      if (res.ok) {
        const data = (await res.json()) as GeminiImageResponse;
        const part = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data || p.inline_data?.data);
        const inline = part?.inlineData ?? part?.inline_data;
        if (inline?.data) {
          const mimeType = ('mime_type' in inline ? inline.mime_type : inline.mimeType) || 'image/png';
          return json({ image: `data:${mimeType};base64,${inline.data}`, mimeType, source: 'gemini' });
        }
        console.error('Gemini returned no image', data.promptFeedback?.blockReason ?? data.candidates?.[0]?.finishReason ?? data.candidates?.[0]?.content?.finishReason);
      } else {
        console.error('Gemini image unavailable', res.status, (await res.text()).slice(0, 500));
      }
    } catch (err) {
      console.error('Gemini image request failed', err);
    }
  }

  return json(conceptFallback(prompt));
}
