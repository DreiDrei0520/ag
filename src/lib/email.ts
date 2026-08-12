import emailjs from '@emailjs/browser';

const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string | undefined;
const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID as string | undefined;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string | undefined;

export const isEmailConfigured = Boolean(PUBLIC_KEY && SERVICE_ID && TEMPLATE_ID);

export async function sendVerificationCode(email: string, code: string): Promise<void> {
  if (!isEmailConfigured || !PUBLIC_KEY || !SERVICE_ID || !TEMPLATE_ID) return;
  await emailjs.send(
    SERVICE_ID,
    TEMPLATE_ID,
    {
      to_email: email,
      to_name: email,
      code,
      subject: 'Your AG Construction Builders verification code',
    },
    { publicKey: PUBLIC_KEY }
  );
}
