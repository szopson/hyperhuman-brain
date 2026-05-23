import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { buildBrainContext } from '@/lib/chat/build-context';

const MODEL = 'claude-opus-4-7';

const BodySchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
    }),
  ),
});

const SYSTEM_PROMPT = `Jesteś asystentem mózgu firmy. Odpowiadasz WYŁĄCZNIE na bazie dostarczonego kontekstu — listy painów, ryzyk, procesów i plays z analizy firmy.

Zasady twarde:
1. Każde twierdzenie musisz oprzeć o cytat z dostarczonego kontekstu. Cytuj dosłownie w cudzysłowach.
2. Po każdym cytacie dodaj odniesienie do chunk ID w nawiasie kwadratowym, np. [pain-founder-detachment].
3. Jeśli kontekst nie pokrywa pytania — powiedz wprost "Nie mam tej informacji w mózgu firmy" i zasugeruj jakie dodatkowe źródło/wpis byłoby potrzebne.
4. NIE wymyślaj liczb, dat, nazw firm, ani osób. Nie ekstrapoluj poza to co jest w kontekście.
5. Odpowiadaj po polsku, zwięźle (max 5-6 zdań), w tonie zorientowanym na konsultanta lub managera klienta.

Format odpowiedzi:
- 1-3 akapity z odpowiedzią + inline cytaty z chunk ID
- Na końcu sekcja "Źródła:" z listą cytowanych chunk ID`;

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = BodySchema.parse(body);

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY not configured' },
      { status: 503 },
    );
  }

  const { contextText, chunks } = await buildBrainContext();
  const userMessages = parsed.messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const client = new Anthropic();
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: `${SYSTEM_PROMPT}\n\n=== KONTEKST MÓZGU FIRMY ===\n\n${contextText}`,
    messages: userMessages,
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  const answer = textBlock && 'text' in textBlock ? textBlock.text : '';

  return NextResponse.json({
    answer,
    chunks_in_context: chunks.length,
  });
}
