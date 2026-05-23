'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTED = [
  'Dlaczego top pain to fragmentacja narzędzi?',
  'Jakie są ryzyka koncentracji na Allegro?',
  'Który play powinniśmy odpalić najpierw i dlaczego?',
];

export function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(content: string) {
    if (!content.trim() || loading) return;
    setError(null);
    const next: Message[] = [...messages, { role: 'user', content }];
    setMessages(next);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { answer: string };
      setMessages([...next, { role: 'assistant', content: data.answer }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {messages.length === 0 && (
        <div className="rounded-md border border-dashed border-zinc-800 bg-zinc-900/30 p-5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            Spróbuj zapytać
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {SUGGESTED.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="rounded border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-900"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {messages.map((m, i) => (
          <article
            key={i}
            className={
              m.role === 'user'
                ? 'rounded-md border border-zinc-800 bg-zinc-900 p-4'
                : 'rounded-md border border-emerald-900/40 bg-emerald-950/10 p-4'
            }
          >
            <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
              {m.role === 'user' ? 'ty' : 'mózg firmy'}
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-100">
              {m.content}
            </p>
          </article>
        ))}
        {loading && (
          <p className="font-mono text-xs text-zinc-500">mózg myśli…</p>
        )}
        {error && (
          <p className="rounded border border-rose-900 bg-rose-950/30 p-3 font-mono text-xs text-rose-300">
            Błąd: {error}
          </p>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Zapytaj mózg firmy…"
          className="flex-1 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-700 focus:outline-none"
          disabled={loading}
        />
        <Button type="submit" disabled={loading || !input.trim()}>
          Wyślij
        </Button>
      </form>
    </div>
  );
}
