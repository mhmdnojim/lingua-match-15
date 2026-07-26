import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createOpenAICompatible } from 'npm:@ai-sdk/openai-compatible';
import { generateText, Output, NoObjectGeneratedError } from 'npm:ai';
import { z } from 'npm:zod';

const schema = z.object({
  translations: z.array(z.string()),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'AI is not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const parsed = z
      .object({
        sourceLanguage: z.string().min(1),
        targetLanguage: z.string().min(1),
        words: z.array(z.string().min(1)),
        instruction: z.string().optional(),
      })
      .safeParse(body);

    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { sourceLanguage, targetLanguage, words, instruction } = parsed.data;
    if (words.length === 0) {
      return new Response(JSON.stringify({ translations: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const list = words.slice(0, 200);

    const provider = createOpenAICompatible({
      name: 'lovable',
      baseURL: 'https://ai.gateway.lovable.dev/v1',
      headers: {
        'Lovable-API-Key': apiKey,
        'X-Lovable-AIG-SDK': 'vercel-ai-sdk',
      },
    });

    const prompt = [
      `Translate each ${sourceLanguage} vocabulary entry into ${targetLanguage}.`,
      'Rules:',
      '- Return exactly one translation per input, in the same order.',
      '- Keep it short: this is flashcard vocabulary, not a sentence translation.',
      '- Give the most common everyday meaning, no explanations, no parentheses, no numbering.',
      instruction ? `- Extra guidance from the user: ${instruction}` : '',
      '',
      'Entries:',
      ...list.map((word, index) => `${index + 1}. ${word}`),
    ]
      .filter(Boolean)
      .join('\n');

    const { output } = await generateText({
      model: provider('google/gemini-3.5-flash'),
      output: Output.object({ schema }),
      prompt,
    });

    const translations = list.map((_, i) => String(output.translations?.[i] ?? '').trim());

    return new Response(JSON.stringify({ translations }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error)) {
      console.error('translate-vocabulary schema mismatch:', error.text);
      return new Response(JSON.stringify({ error: 'The AI returned an unusable response, please retry' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('translate-vocabulary error:', message);
    const status = message.includes('429') ? 429 : message.includes('402') ? 402 : 500;
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
