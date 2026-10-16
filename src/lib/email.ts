import emailjs from '@emailjs/browser';

const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string | undefined;
const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID as string | undefined;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string | undefined;
const REPLY_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_REPLY_TEMPLATE_ID as string | undefined;

export const isEmailConfigured = Boolean(PUBLIC_KEY && SERVICE_ID && TEMPLATE_ID);
export const isReplyEmailConfigured = Boolean(PUBLIC_KEY && SERVICE_ID && REPLY_TEMPLATE_ID);

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

/** Emails an admin's inquiry reply to the client. Template variables: to_email, to_name, subject, message, inquiry_number. */
export async function sendInquiryReply(input: {
  toEmail: string;
  toName: string;
  subject: string;
  message: string;
  inquiryNumber: string;
}): Promise<void> {
  if (!PUBLIC_KEY || !SERVICE_ID || !REPLY_TEMPLATE_ID) throw new Error('Reply email is not configured.');
  await emailjs.send(
    SERVICE_ID,
    REPLY_TEMPLATE_ID,
    {
      to_email: input.toEmail,
      to_name: input.toName,
      subject: input.subject,
      message: input.message,
      inquiry_number: input.inquiryNumber,
    },
    { publicKey: PUBLIC_KEY }
  );
}

export function replyMailtoLink(toEmail: string, subject: string, body = ''): string {
  return `mailto:${toEmail}?subject=${encodeURIComponent(subject)}${body ? `&body=${encodeURIComponent(body)}` : ''}`;
}
