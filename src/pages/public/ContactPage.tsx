import { useState } from 'react';
import toast from 'react-hot-toast';
import { Facebook, Linkedin, Mail, MapPin, MessageSquare, Phone } from 'lucide-react';
import { Card } from '../../components/ui';
import { db } from '../../backend';
import { makeInquiryNumber } from '../../lib/format';
import { notifyAdmins } from '../../lib/activity';
import { writeAuditLog } from '../../lib/activity';
import { MAIN_OFFICE_ADDRESS } from '../../lib/companyInfo';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: 'General inquiry', message: '' });
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Each message becomes an inquiry; admins reply from its page by email, phone or Messenger.
      const inquiry = await db.inquiries.create({
        inquiryNumber: makeInquiryNumber(),
        clientId: '',
        clientName: form.name.trim(),
        clientEmail: form.email.trim(),
        clientPhone: form.phone.trim() || undefined,
        subject: form.subject,
        message: form.message.trim(),
        attachments: [],
        status: 'Pending',
      });
      await notifyAdmins({
        title: `New inquiry from ${form.name}`,
        message: `${form.email}${form.phone ? ` · ${form.phone}` : ''} — ${form.subject}: ${form.message}`,
        type: 'contact',
        referenceId: inquiry.id,
        link: `/admin/inquiries/${inquiry.id}`,
      });
      await writeAuditLog({ actor: null }, 'contact_message', 'inquiry', inquiry.id, {
        name: form.name,
        email: form.email,
        phone: form.phone,
        subject: form.subject,
      });
      setSent(true);
    } catch {
      toast.error('Unable to send your message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const channels = [
    { icon: Phone, title: 'Call us', lines: ['0927-837-2757', '0926-775-2251'] },
    { icon: Mail, title: 'Email us', lines: ['agconbuilder@gmail.com'] },
    { icon: MapPin, title: 'Visit us', lines: [MAIN_OFFICE_ADDRESS, 'Serving CALABARZON & NCR'] },
  ];

  return (
    <div>
      <section className="relative overflow-hidden bg-agdark-800">
        <div className="absolute inset-0 blueprint-grid" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="eyebrow">Get in touch</p>
          <h1 className="mt-3 max-w-2xl font-display text-5xl font-extrabold uppercase tracking-wide text-white">
            Let's build something together.
          </h1>
          <p className="mt-4 max-w-xl text-agdark-200">
            Questions about a project, a quotation, or our services? Reach out — we respond within one business day.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-5">
            {channels.map(({ icon: Icon, title, lines }) => (
              <Card key={title} className="flex items-start gap-4 p-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-agorange/10 text-agorange">
                  <Icon size={20} />
                </span>
                <div>
                  <h3 className="font-display text-base font-bold uppercase tracking-wide text-agdark-800">{title}</h3>
                  {lines.map((l) => <p key={l} className="text-sm text-agdark-600">{l}</p>)}
                </div>
              </Card>
            ))}
            <Card className="p-5">
              <h3 className="font-display text-base font-bold uppercase tracking-wide text-agdark-800">Follow us</h3>
              <div className="mt-3 flex gap-3">
                <a href="#" aria-label="Facebook" className="flex h-10 w-10 items-center justify-center rounded-lg border border-agdark-100 text-agdark-500 transition-colors hover:border-agorange hover:text-agorange">
                  <Facebook size={18} />
                </a>
                <a href="#" aria-label="LinkedIn" className="flex h-10 w-10 items-center justify-center rounded-lg border border-agdark-100 text-agdark-500 transition-colors hover:border-agorange hover:text-agorange">
                  <Linkedin size={18} />
                </a>
                <a href="#" aria-label="Message us" className="flex h-10 w-10 items-center justify-center rounded-lg border border-agdark-100 text-agdark-500 transition-colors hover:border-agorange hover:text-agorange">
                  <MessageSquare size={18} />
                </a>
              </div>
            </Card>
          </div>

          <Card className="p-6 sm:p-8">
            <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-agdark-800">Send a message</h2>
            <p className="mt-1 text-sm text-agdark-500">We'll get back to you within one business day.</p>

            {sent ? (
              <div className="mt-8 rounded-xl bg-agorange/10 p-8 text-center">
                <MessageSquare size={28} className="mx-auto text-agorange" />
                <h3 className="mt-3 font-display text-xl font-bold uppercase tracking-wide text-agdark-800">Message sent</h3>
                <p className="mx-auto mt-2 max-w-sm text-sm text-agdark-500">
                  Thanks, {form.name.split(' ')[0] || 'there'}! We've received your message and will reply shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-widest text-agdark-500">Full name</span>
                  <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" className="mt-1.5 h-11 w-full rounded-lg border border-agdark-200 px-3 text-sm" />
                </label>
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-widest text-agdark-500">Email</span>
                  <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@email.com" className="mt-1.5 h-11 w-full rounded-lg border border-agdark-200 px-3 text-sm" />
                </label>
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-widest text-agdark-500">Phone</span>
                  <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Optional" className="mt-1.5 h-11 w-full rounded-lg border border-agdark-200 px-3 text-sm" />
                </label>
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-widest text-agdark-500">Subject</span>
                  <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="mt-1.5 h-11 w-full rounded-lg border border-agdark-200 bg-white px-3 text-sm">
                    <option>General inquiry</option>
                    <option>Quotation request</option>
                    <option>Project inquiry</option>
                    <option>Careers</option>
                    <option>Feedback</option>
                  </select>
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-agdark-500">Message</span>
                  <textarea required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Tell us about your project…" className="mt-1.5 w-full rounded-lg border border-agdark-200 px-3 py-2 text-sm" />
                </label>
                <div className="sm:col-span-2">
                  <button type="submit" disabled={submitting} className="btn-primary w-full sm:w-auto">
                    {submitting ? 'Sending…' : 'Send message'}
                  </button>
                </div>
              </form>
            )}
          </Card>
        </div>
      </section>
    </div>
  );
}
