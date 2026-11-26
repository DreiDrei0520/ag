const DEFAULT_IMAGE_MODEL = 'gemini-nano-banana-2.1';
const DEFAULT_IMAGE_SIZE = '1K';
const DEFAULT_ASPECT_RATIO = '16:9';
const MAX_PROMPT_CHARS = 4000;
const MAX_IMAGE_CHARS = 8_000_000;
const RATE_LIMIT = { windowMs: 5 * 60 * 1000, max: 12 };

export const maxDuration = 120;

interface GeminiInlineData {
  mimeType?: string;
  mime_type?: string;
  data?: string;
}

interface GeminiImageResponse {
  candidates?: {
    content?: { parts?: { text?: string; inlineData?: GeminiInlineData; inline_data?: GeminiInlineData }[] };
    finishReason?: string;
  }[];
  promptFeedback?: { blockReason?: string };
  output_image?: { data?: string; mimeType?: string; mime_type?: string };
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

function imageFrom(data: GeminiImageResponse): string | null {
  const output = data.output_image;
  if (output?.data) {
    const mimeType = output.mimeType || output.mime_type || 'image/png';
    return `data:${mimeType};base64,${output.data}`;
  }

  for (const candidate of data.candidates ?? []) {
    for (const part of candidate.content?.parts ?? []) {
      const inline = part.inlineData ?? part.inline_data;
      if (inline?.data) {
        const mimeType = inline.mimeType || inline.mime_type || 'image/png';
        return `data:${mimeType};base64,${inline.data}`;
      }
    }
  }
  return null;
}

export async function POST(request: Request): Promise<Response> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return json({ error: 'AI rendering is not set up yet.' }, 503);

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
  if (rateLimited(ip)) return json({ error: 'Too many render requests. Please wait a few minutes and try again.' }, 429);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid render request.' }, 400);
  }

  const image = typeof (body as { image?: unknown })?.image === 'string' ? (body as { image: string }).image : '';
  const match = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/i.exec(image);
  if (!match || !match[2] || match[2].length > MAX_IMAGE_CHARS) {
    return json({ error: 'A valid PNG, JPEG, or WebP screenshot is required.' }, 400);
  }

  const prompt = typeof (body as { prompt?: unknown })?.prompt === 'string'
    ? (body as { prompt: string }).prompt.trim().slice(0, MAX_PROMPT_CHARS)
    : '';
  if (!prompt) return json({ error: 'A render prompt is required.' }, 400);

  const model = process.env.GEMINI_IMAGE_MODEL || DEFAULT_IMAGE_MODEL;
  const imageSize = process.env.GEMINI_IMAGE_SIZE || DEFAULT_IMAGE_SIZE;
  const aspectRatio = process.env.GEMINI_IMAGE_ASPECT_RATIO || DEFAULT_ASPECT_RATIO;
  let res: Response;

  try {
    res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [
            { text: prompt },
            { inlineData: { mimeType: `image/${match[1].toLowerCase()}`, data: match[2] } },
          ],
        }],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE'],
          imageConfig: { aspectRatio, imageSize },
        },
      }),
      signal: AbortSignal.timeout(90_000),
    });
  } catch (err) {
    console.error('Gemini image request failed', err);
    return json({ error: 'The AI renderer is unavailable right now.' }, 502);
  }

  if (!res.ok) {
    console.error('Gemini image error', res.status, (await res.text()).slice(0, 500));
    return json({ error: 'The AI renderer is unavailable right now. Please try again shortly.' }, 502);
  }

  const data = (await res.json()) as GeminiImageResponse;
  const rendered = imageFrom(data);
  if (!rendered) {
    console.error('Gemini returned no image', data.promptFeedback?.blockReason ?? data.candidates?.[0]?.finishReason);
    return json({ error: 'The AI renderer could not create this view. Please try again.' }, 502);
  }

  return json({ image: rendered, source: 'gemini' });
}
