const DEFAULT_IMAGE_MODEL = 'gemini-nano-banana-2.1';
const FALLBACK_IMAGE_MODELS = ['gemini-3.1-flash-image', 'gemini-2.5-flash-image'];
const DEFAULT_TEXT_MODEL = 'gemini-3.5-flash-lite';
const DEFAULT_IMAGE_SIZE = '1K';
const DEFAULT_ASPECT_RATIO = '16:9';
const MAX_PROMPT_CHARS = 4000;
const MAX_IMAGE_CHARS = 8_000_000;
const MAX_SVG_CHARS = 120_000;
const RATE_LIMIT = { windowMs: 5 * 60 * 1000, max: 12 };

export const maxDuration = 120;

const hits = new Map<string, number[]>();
let imageModelsBlocked = false;

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

function findImage(value: unknown): { image: string; mimeType: string } | null {
  if (!value || typeof value !== 'object') return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findImage(item);
      if (found) return found;
    }
    return null;
  }

  const record = value as Record<string, unknown>;
  const direct = record.output_image ?? record.outputImage ?? record.inlineData ?? record.inline_data;
  if (direct && typeof direct === 'object') {
    const image = direct as Record<string, unknown>;
    const data = typeof image.data === 'string' ? image.data : '';
    const mimeType = typeof image.mime_type === 'string'
      ? image.mime_type
      : typeof image.mimeType === 'string' ? image.mimeType : 'image/png';
    if (data.length > 1000 && /^[A-Za-z0-9+/=_-]+$/.test(data)) {
      return { image: `data:${mimeType};base64,${data}`, mimeType };
    }
  }

  for (const key of ['output', 'steps', 'candidates', 'content', 'parts']) {
    const nested = record[key];
    if (nested && typeof nested === 'object') {
      const found = findImage(nested);
      if (found) return found;
    }
  }
  for (const [key, nested] of Object.entries(record)) {
    if (key === 'input' || key === 'user_input' || !nested || typeof nested !== 'object') continue;
    const found = findImage(nested);
    if (found) return found;
  }
  return null;
}

function upstreamError(text: string, status: number): string {
  let detail = text.replace(/\s+/g, ' ').trim().slice(0, 300);
  try {
    const parsed = JSON.parse(text) as { error?: { message?: string }; message?: string };
    detail = (parsed.error?.message || parsed.message || detail).slice(0, 300);
  } catch {
    detail = detail || 'unknown error';
  }
  return `AI renderer error (${status}): ${detail}`;
}

function isModelError(status: number, text: string): boolean {
  if (status === 404) return true;
  return (status === 400 || status === 403) && /model|not found|not supported|unsupported|permission|access/i.test(text);
}

function isFreeTierBlock(status: number, text: string): boolean {
  return status === 429 && /free tier/i.test(text) && /limit:\s*0|quota.*0|not available/i.test(text);
}

function responseFormat(model: string, aspectRatio: string, imageSize: string) {
  const format: Record<string, string> = { type: 'image', aspect_ratio: aspectRatio };
  if (!/2\.5-flash-image/i.test(model)) format.image_size = imageSize;
  return format;
}

function extractSvg(raw: string): string | null {
  let value = raw.trim().replace(/^```(?:svg|xml)?\s*/i, '').replace(/\s*```$/, '').trim();
  const start = value.indexOf('<svg');
  const end = value.lastIndexOf('</svg>');
  if (start === -1 || end === -1 || end < start) return null;

  let svg = value.slice(start, end + 6).trim();
  if (svg.length > MAX_SVG_CHARS) return null;
  if (/<\s*\/?\s*script\b|foreignObject|on[a-z]+\s*=|javascript:|href\s*=\s*["'](?:https?:)?\/\//i.test(svg)) return null;
  if (!/xmlns\s*=\s*["']http:\/\/www\.w3\.org\/2000\/svg["']/i.test(svg)) {
    svg = svg.replace(/<svg\b/i, '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  const openEnd = svg.indexOf('>');
  const openTag = svg.slice(0, openEnd);
  if (openEnd !== -1 && !/viewBox\s*=/i.test(openTag)) {
    svg = `${openTag} viewBox="0 0 1600 900">${svg.slice(openEnd + 1)}`;
  }
  return svg;
}

async function renderSvgConcept(apiKey: string, base64: string, mimeType: string, prompt: string): Promise<string> {
  const model = process.env.GEMINI_MODEL?.trim() || DEFAULT_TEXT_MODEL;
  const svgPrompt = [
    'You are an architectural illustrator. The attached image is a 3D massing screenshot of a house.',
    'Create a polished exterior architectural concept illustration as one self-contained SVG.',
    'Match the exact massing: same footprint, floor count, roof form, openings, balcony, carport, solar placement and camera angle.',
    'Upgrade only materials, lighting, sky, landscaping, shadows and finish quality.',
    `Rendering intent: ${prompt.slice(0, 1200)}`,
    'Return ONLY raw SVG markup. Use viewBox="0 0 1600 900", gradients, shapes, paths, filters and opacity for depth.',
    'No markdown, no prose, no external images, no scripts, no foreignObject, no text, no logos, no watermarks.',
  ].join('\n');

  let res: Response;
  try {
    res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [
            { text: svgPrompt },
            { inline_data: { mime_type: mimeType, data: base64 } },
          ],
        }],
        generationConfig: { maxOutputTokens: 8192, temperature: 0.35 },
      }),
      signal: AbortSignal.timeout(90_000),
    });
  } catch (err) {
    console.error('Gemini concept request failed', err);
    throw new Error('The free concept renderer is unavailable right now.');
  }

  const text = await res.text();
  if (!res.ok) {
    console.error('Gemini concept error', res.status, text.slice(0, 500));
    throw new Error(`Free concept renderer error (${res.status}).`);
  }

  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('The free concept renderer returned an invalid response.');
  }

  const record = data as { candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[] };
  const raw = (record.candidates?.[0]?.content?.parts ?? [])
    .filter((part) => !part.thought && part.text)
    .map((part) => part.text)
    .join('');
  const svg = extractSvg(raw);
  if (!svg) throw new Error('The free concept renderer could not produce a valid illustration.');
  return `data:image/svg+xml;base64,${Buffer.from(svg, 'utf8').toString('base64')}`;
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

  const base64 = match[2];
  const mimeType = `image/${match[1].toLowerCase()}`;
  let imageError = '';

  if (!imageModelsBlocked) {
    const configuredModel = process.env.GEMINI_IMAGE_MODEL?.trim();
    const models = configuredModel ? [configuredModel] : [DEFAULT_IMAGE_MODEL, ...FALLBACK_IMAGE_MODELS];
    const imageSize = process.env.GEMINI_IMAGE_SIZE || DEFAULT_IMAGE_SIZE;
    const aspectRatio = process.env.GEMINI_IMAGE_ASPECT_RATIO || DEFAULT_ASPECT_RATIO;
    let lastError = 'No Gemini image model is available for this key.';

    for (const model of models) {
      let res: Response;
      try {
        res = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
            'Api-Revision': '2026-05-20',
          },
          body: JSON.stringify({
            model,
            store: false,
            input: [
              { type: 'text', text: prompt },
              { type: 'image', mime_type: mimeType, data: base64 },
            ],
            response_format: responseFormat(model, aspectRatio, imageSize),
          }),
          signal: AbortSignal.timeout(90_000),
        });
      } catch (err) {
        console.error('Gemini image request failed', err);
        lastError = 'The AI renderer is unavailable right now.';
        continue;
      }

      const text = await res.text();
      if (!res.ok) {
        console.error('Gemini image error', res.status, text.slice(0, 500));
        lastError = upstreamError(text, res.status);
        if (isFreeTierBlock(res.status, text)) {
          imageModelsBlocked = true;
          break;
        }
        if (isModelError(res.status, text)) continue;
        imageError = lastError;
        break;
      }

      let data: unknown;
      try {
        data = JSON.parse(text);
      } catch {
        console.error('Gemini returned invalid JSON', text.slice(0, 500));
        imageError = 'The AI renderer returned an invalid response.';
        break;
      }

      const rendered = findImage(data);
      if (!rendered) {
        console.error('Gemini returned no image', text.slice(0, 500));
        imageError = 'The AI renderer could not create this view.';
        break;
      }
      return json({ image: rendered.image, source: 'gemini' });
    }
    imageError = imageError || lastError;
  }

  try {
    const image = await renderSvgConcept(apiKey, base64, mimeType, prompt);
    return json({ image, source: 'gemini-svg' });
  } catch (err) {
    console.error('Concept fallback failed', err);
    return json({ error: err instanceof Error ? err.message : imageError || 'Rendering failed. Please try again.' }, 502);
  }
}
