const DEFAULT_IMAGE_MODEL = 'gemini-nano-banana-2.1';
const MAX_PROMPT_CHARS = 3000;
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

export async function POST(request: Request): Promise<Response> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return json({ error: 'Image generation is not set up yet.' }, 503);

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
  if (rateLimited(ip)) return json({ error: 'Too many image requests. Please wait a few minutes and try again.' }, 429);

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

  const model = process.env.GEMINI_IMAGE_MODEL || DEFAULT_IMAGE_MODEL;
  let res: Response;
  try {
    res = await fetch(`https://generativelanguage.googleapis.com/v1/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE'],
          imageConfig: { aspectRatio: '4:3', imageSize: '1K' },
        },
      }),
      signal: AbortSignal.timeout(45_000),
    });
  } catch (err) {
    console.error('Gemini image request failed', err);
    return json({ error: 'Image generation is unavailable right now.' }, 502);
  }

  if (!res.ok) {
    console.error('Gemini image error', res.status, (await res.text()).slice(0, 500));
    return json({ error: 'Image generation is unavailable right now.' }, 502);
  }

  const data = (await res.json()) as GeminiImageResponse;
  const part = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data || p.inline_data?.data);
  const inline = part?.inlineData ?? part?.inline_data;
  if (!inline?.data) {
    console.error('Gemini returned no image', data.promptFeedback?.blockReason ?? data.candidates?.[0]?.finishReason ?? data.candidates?.[0]?.content?.finishReason);
    return json({ error: 'No image was generated. Try a more specific house design prompt.' }, 502);
  }

  const mimeType = ('mime_type' in inline ? inline.mime_type : inline.mimeType) || 'image/png';
  return json({ image: `data:${mimeType};base64,${inline.data}`, mimeType });
}
