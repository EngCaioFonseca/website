import { useState } from 'react';
import { SERVICES, SITE } from '../consts';

type Status = 'idle' | 'sending' | 'ok' | 'error';

export default function ContactForm() {
  const endpoint = SERVICES.formspreeId ? `https://formspree.io/f/${SERVICES.formspreeId}` : '';
  const [status, setStatus] = useState<Status>('idle');

  if (!endpoint) {
    return (
      <div className="rounded-xl border border-border bg-surface p-5 text-sm text-muted">
        The contact form isn’t wired up yet. Email me directly at{' '}
        <a className="text-accent link-underline" href={`mailto:${SITE.email}`}>
          {SITE.email}
        </a>
        .
      </div>
    );
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        setStatus('sending');
        try {
          const res = await fetch(endpoint, {
            method: 'POST',
            body: new FormData(form),
            headers: { Accept: 'application/json' },
          });
          if (res.ok) {
            setStatus('ok');
            form.reset();
          } else {
            setStatus('error');
          }
        } catch {
          setStatus('error');
        }
      }}
      className="space-y-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block text-muted">Name</span>
          <input
            name="name"
            required
            className="w-full rounded-lg border border-border bg-transparent px-3 py-2 outline-none focus:border-accent"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-muted">Email</span>
          <input
            type="email"
            name="email"
            required
            className="w-full rounded-lg border border-border bg-transparent px-3 py-2 outline-none focus:border-accent"
          />
        </label>
      </div>
      <label className="block text-sm">
        <span className="mb-1 block text-muted">Message</span>
        <textarea
          name="message"
          required
          rows={5}
          className="w-full rounded-lg border border-border bg-transparent px-3 py-2 outline-none focus:border-accent"
        />
      </label>
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={status === 'sending'}
          className="rounded-lg bg-accent-strong px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {status === 'sending' ? 'Sending…' : 'Send message'}
        </button>
        {status === 'ok' && <p className="text-sm text-accent">Thanks — your message is on its way.</p>}
        {status === 'error' && (
          <p className="text-sm" style={{ color: '#d64545' }}>
            Something went wrong — please email me directly.
          </p>
        )}
      </div>
    </form>
  );
}
