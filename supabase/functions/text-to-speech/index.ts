import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/** Natural-sounding fallback voice through Lovable AI (no ElevenLabs key needed) */
async function lovableAiSpeech(text: string, code: string): Promise<Response> {
  const key = Deno.env.get('LOVABLE_API_KEY');
  if (!key) {
    return new Response(JSON.stringify({ error: 'No TTS provider configured', fallback: true }), {
      status: 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const cjk = ['zh', 'ja', 'ko'];
  const rtl = ['ar', 'he', 'fa', 'ur'];
  let voice = 'alloy';
  if (cjk.some(p => code.startsWith(p))) voice = 'shimmer';
  else if (rtl.some(p => code.startsWith(p))) voice = 'nova';

  const res = await fetch('https://ai.gateway.lovable.dev/v1/audio/speech', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'openai/gpt-4o-mini-tts',
      input: text,
      voice,
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
  console.log(`Lovable AI TTS success: ${audio.byteLength} bytes (voice ${voice})`);
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

    const code = String(language || 'en').toLowerCase();
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');

    if (ELEVENLABS_API_KEY) {
      // Voice selection by language code: Lily (CJK), Sarah (RTL), George (default)
      const cjk = ['zh', 'ja', 'ko', 'chinese', 'japanese', 'korean'];
      const rtl = ['ar', 'he', 'fa', 'ur', 'arabic', 'hebrew', 'persian', 'urdu'];
      let voiceId = 'JBFqnCBsd6RMkjVDRZzb'; // George - default multilingual
      if (cjk.some(prefix => code.startsWith(prefix))) voiceId = 'pFZP5JQG7iQjIQuC4Bku'; // Lily
      else if (rtl.some(prefix => code.startsWith(prefix))) voiceId = 'EXAVITQu4vr4xnSDxMaL'; // Sarah

      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
        {
          method: 'POST',
          headers: { 'xi-api-key': ELEVENLABS_API_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            model_id: 'eleven_multilingual_v2',
            voice_settings: { stability: 0.5, similarity_boost: 0.75, speed: 0.9 },
          }),
        },
      );

      if (response.ok) {
        const audioBuffer = await response.arrayBuffer();
        console.log(`ElevenLabs TTS success: ${audioBuffer.byteLength} bytes`);
        return new Response(audioBuffer, { headers: { ...corsHeaders, 'Content-Type': 'audio/mpeg' } });
      }

      const errorText = await response.text().catch(() => '');
      console.error(`ElevenLabs error [${response.status}]: ${errorText} — using Lovable AI voice instead`);
    }

    return await lovableAiSpeech(text, code);
  } catch (error) {
    console.error('TTS error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage, fallback: true }), {
      status: 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
