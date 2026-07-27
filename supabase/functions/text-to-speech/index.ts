import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/** Map any incoming code/locale/name to a base ISO language code */
function baseLang(input: string): string {
  const code = String(input || 'en').toLowerCase().trim();
  // strip romanization/transliteration suffixes: zh-pinyin, ar-latin, ja-romaji...
  const stripped = code
    .replace(/-(pinyin|latin|romaji|romaja)$/, '')
    .replace(/^(zh-tw)$/, 'zh-tw');

  const byName: Record<string, string> = {
    chinese: 'zh', mandarin: 'zh', japanese: 'ja', korean: 'ko', arabic: 'ar',
    english: 'en', spanish: 'es', french: 'fr', german: 'de', italian: 'it',
    portuguese: 'pt', dutch: 'nl', swedish: 'sv', polish: 'pl', russian: 'ru',
    turkish: 'tr', hindi: 'hi', urdu: 'ur', persian: 'fa', hebrew: 'he',
    indonesian: 'id', malay: 'ms', vietnamese: 'vi', bulgarian: 'bg',
    kazakh: 'kk', turkmen: 'tk', thai: 'th',
  };
  if (byName[stripped]) return byName[stripped];
  if (stripped.startsWith('zh-tw')) return 'zh-tw';
  return stripped.split(/[-_]/)[0];
}

/** Human-readable language + accent description used to steer the voice */
const LANG_INFO: Record<string, { name: string; accent: string; el?: string }> = {
  zh: { name: 'Mandarin Chinese', accent: 'native Mainland Chinese (Putonghua) accent', el: 'zh' },
  'zh-tw': { name: 'Traditional Chinese (Taiwan Mandarin)', accent: 'native Taiwanese Mandarin accent', el: 'zh' },
  ja: { name: 'Japanese', accent: 'native Tokyo Japanese accent', el: 'ja' },
  ko: { name: 'Korean', accent: 'native Seoul Korean accent', el: 'ko' },
  ar: { name: 'Arabic', accent: 'native Modern Standard Arabic accent', el: 'ar' },
  en: { name: 'English', accent: 'native standard English accent', el: 'en' },
  es: { name: 'Spanish', accent: 'native Castilian Spanish accent', el: 'es' },
  fr: { name: 'French', accent: 'native Parisian French accent', el: 'fr' },
  de: { name: 'German', accent: 'native standard German accent', el: 'de' },
  it: { name: 'Italian', accent: 'native standard Italian accent', el: 'it' },
  pt: { name: 'Portuguese', accent: 'native Brazilian Portuguese accent', el: 'pt' },
  nl: { name: 'Dutch', accent: 'native Dutch accent', el: 'nl' },
  sv: { name: 'Swedish', accent: 'native Swedish accent', el: 'sv' },
  pl: { name: 'Polish', accent: 'native Polish accent', el: 'pl' },
  ru: { name: 'Russian', accent: 'native Russian accent', el: 'ru' },
  tr: { name: 'Turkish', accent: 'native Turkish accent', el: 'tr' },
  hi: { name: 'Hindi', accent: 'native Hindi accent', el: 'hi' },
  ur: { name: 'Urdu', accent: 'native Urdu accent', el: 'hi' },
  fa: { name: 'Persian (Farsi)', accent: 'native Tehrani Persian accent' },
  he: { name: 'Hebrew', accent: 'native Israeli Hebrew accent' },
  id: { name: 'Indonesian', accent: 'native Indonesian accent', el: 'id' },
  ms: { name: 'Malay', accent: 'native Malaysian accent', el: 'ms' },
  vi: { name: 'Vietnamese', accent: 'native Vietnamese accent', el: 'vi' },
  bg: { name: 'Bulgarian', accent: 'native Bulgarian accent', el: 'bg' },
  kk: { name: 'Kazakh', accent: 'native Kazakh accent' },
  tk: { name: 'Turkmen', accent: 'native Turkmen accent' },
  th: { name: 'Thai', accent: 'native Thai accent' },
};

function langInfo(code: string) {
  return LANG_INFO[code] ?? { name: code.toUpperCase(), accent: `native ${code.toUpperCase()} accent` };
}

/** Natural-sounding voice through Lovable AI, steered to the language's accent */
async function lovableAiSpeech(text: string, lang: string): Promise<Response> {
  const key = Deno.env.get('LOVABLE_API_KEY');
  if (!key) {
    return new Response(JSON.stringify({ error: 'No TTS provider configured', fallback: true }), {
      status: 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const info = langInfo(lang);
  // Timbre varies a bit per language family so voices don't all sound identical.
  const voiceByLang: Record<string, string> = {
    zh: 'shimmer', 'zh-tw': 'shimmer', ja: 'shimmer', ko: 'shimmer',
    ar: 'onyx', fa: 'onyx', ur: 'onyx', he: 'nova',
    ru: 'echo', bg: 'echo', kk: 'echo', tk: 'echo',
    en: 'alloy', es: 'nova', fr: 'nova', it: 'nova', pt: 'nova',
    de: 'echo', nl: 'echo', sv: 'echo', pl: 'echo', tr: 'onyx',
    hi: 'nova', id: 'alloy', ms: 'alloy', vi: 'shimmer', th: 'shimmer',
  };
  const voice = voiceByLang[lang] ?? 'alloy';

  const instructions =
    `Speak the text as a native speaker of ${info.name}, using an authentic ${info.accent}. ` +
    `Use correct native pronunciation, tones and intonation for ${info.name}. ` +
    `Do not use an English or foreign accent. Speak clearly and slowly, like a language teacher.`;

  const res = await fetch('https://ai.gateway.lovable.dev/v1/audio/speech', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'openai/gpt-4o-mini-tts',
      input: text,
      voice,
      instructions,
      response_format: 'mp3',
      speed: 0.95,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error(`Lovable AI TTS failed [${res.status}]: ${body}`);
    return new Response(JSON.stringify({ error: `TTS failed: ${res.status}`, fallback: true }), {
      status: 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const audio = await res.arrayBuffer();
  console.log(`Lovable AI TTS success: ${audio.byteLength} bytes (${lang} / voice ${voice})`);
  return new Response(audio, { headers: { ...corsHeaders, 'Content-Type': 'audio/mpeg' } });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, language } = await req.json();

    if (!text) {
      return new Response(JSON.stringify({ error: 'Text is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const lang = baseLang(language);
    const info = langInfo(lang);
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');

    if (ELEVENLABS_API_KEY) {
      // Native-sounding multilingual voices, picked per language family
      const VOICES = {
        cjk: 'pFZP5JQG7iQjIQuC4Bku', // Lily
        arabic: 'EXAVITQu4vr4xnSDxMaL', // Sarah
        slavic: 'XrExE9yKIg1WjnnlVkGX', // Matilda
        romance: 'FGY2WhTYpPnrIDTdsKH5', // Laura
        germanic: 'JBFqnCBsd6RMkjVDRZzb', // George
        indic: 'Xb7hH8MSUJpSbSDYk0k2', // Alice
        default: 'JBFqnCBsd6RMkjVDRZzb',
      };
      const family: Record<string, keyof typeof VOICES> = {
        zh: 'cjk', 'zh-tw': 'cjk', ja: 'cjk', ko: 'cjk', vi: 'cjk', th: 'cjk',
        ar: 'arabic', fa: 'arabic', ur: 'arabic', he: 'arabic',
        ru: 'slavic', bg: 'slavic', pl: 'slavic', kk: 'slavic', tk: 'slavic', tr: 'slavic',
        es: 'romance', fr: 'romance', it: 'romance', pt: 'romance',
        en: 'germanic', de: 'germanic', nl: 'germanic', sv: 'germanic',
        hi: 'indic', id: 'indic', ms: 'indic',
      };
      const voiceId = VOICES[family[lang] ?? 'default'];

      // eleven_turbo_v2_5 accepts language_code, which locks pronunciation
      // to the target language instead of guessing from the text.
      const body: Record<string, unknown> = {
        text,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: { stability: 0.5, similarity_boost: 0.75, speed: 0.9 },
      };
      if (info.el) body.language_code = info.el;

      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
        {
          method: 'POST',
          headers: { 'xi-api-key': ELEVENLABS_API_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
      );

      if (response.ok) {
        const audioBuffer = await response.arrayBuffer();
        console.log(`ElevenLabs TTS success: ${audioBuffer.byteLength} bytes (${lang})`);
        return new Response(audioBuffer, { headers: { ...corsHeaders, 'Content-Type': 'audio/mpeg' } });
      }

      const errorText = await response.text().catch(() => '');
      console.error(`ElevenLabs error [${response.status}]: ${errorText} — using Lovable AI voice instead`);
    }

    return await lovableAiSpeech(text, lang);
  } catch (error) {
    console.error('TTS error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage, fallback: true }), {
      status: 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
