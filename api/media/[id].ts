// Serves an image uploaded by an admin. On Firebase's free Spark plan there is no Cloud Storage, so
// uploads are stored as data URLs in the Firestore `media` collection (see fbUploadAttachment).
// Uploads never change once written, so responses are cached for a year at the CDN.
import { FIREBASE_PROJECT as firebaseConfig } from '../../src/firebaseProject.js';

interface FirestoreDocument {
  fields?: { data?: { stringValue?: string } };
}

export async function GET(request: Request): Promise<Response> {
  const id = new URL(request.url).pathname.split('/').pop() ?? '';
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(id)) return new Response('Not found', { status: 404 });

  const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/media/${id}?key=${firebaseConfig.apiKey}`;
  let res: Response;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  } catch {
    return new Response('Unavailable', { status: 502 });
  }
  if (res.status === 404) return new Response('Not found', { status: 404 });
  if (!res.ok) return new Response('Unavailable', { status: 502 });

  const dataUrl = ((await res.json()) as FirestoreDocument).fields?.data?.stringValue ?? '';
  const match = /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i.exec(dataUrl);
  if (!match) return new Response('Not found', { status: 404 });

  return new Response(Buffer.from(match[2], 'base64'), {
    headers: {
      'Content-Type': match[1],
      'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
