/**
 * Cliente da Gemini API chamado direto do navegador, com a chave da equipe
 * embutida no build (hackathon, plano gratuito, só dados fictícios).
 *
 * A chave vem de NEXT_PUBLIC_GEMINI_API_KEY no arquivo .env.local (ignorado
 * pelo Git): nunca escreva a chave no código. Como o site é estático, ela vai
 * no JavaScript publicado; por isso, restrinja a chave no Google Cloud ao
 * domínio do site (ver docs/ARQUITETURA.md). Sem a variável, o app usa a
 * leitura pré-gravada dos laudos de exemplo e o resumo por regras.
 *
 * Tenta cada modelo em ordem; se um estiver sobrecarregado ou demorar demais,
 * passa para o próximo.
 */

const API = "https://generativelanguage.googleapis.com/v1beta/models";
const BUILT_IN_KEY = (process.env.NEXT_PUBLIC_GEMINI_API_KEY ?? "").trim();
export const MODELS = ["gemini-3.5-flash", "gemini-3-flash-preview", "gemini-3.8-flash"];

export type GeminiPart = { text: string } | { inlineData: { mimeType: string; data: string } };

export class GeminiUnavailableError extends Error {}

export function getGeminiKey(): string | null {
  return BUILT_IN_KEY || null;
}

export function geminiConfigured(): boolean {
  return Boolean(getGeminiKey());
}

export async function generateJson<T>(opts: {
  system: string;
  parts: GeminiPart[];
  schema: object;
  timeoutMs?: number;
}): Promise<{ data: T; model: string }> {
  const key = getGeminiKey();
  if (!key) throw new GeminiUnavailableError("Chave da Gemini não configurada");

  const errors: string[] = [];
  for (const model of MODELS) {
    try {
      return { data: await attempt<T>(model, key, opts), model };
    } catch (err) {
      const msg = `${model}: ${(err as Error).message}`;
      console.warn("[gemini]", msg.slice(0, 200));
      errors.push(msg);
      // Chave inválida: não adianta tentar outro modelo.
      if (/API key not valid|API_KEY_INVALID|PERMISSION_DENIED/i.test(msg)) break;
    }
  }
  throw new GeminiUnavailableError(errors.join(" | "));
}

async function attempt<T>(
  model: string,
  key: string,
  opts: { system: string; parts: GeminiPart[]; schema: object; timeoutMs?: number },
): Promise<T> {
  const res = await fetch(`${API}/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    signal: AbortSignal.timeout(opts.timeoutMs ?? 40_000),
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: opts.system }] },
      contents: [{ role: "user", parts: opts.parts }],
      generationConfig: {
        temperature: 0,
        responseMimeType: "application/json",
        responseSchema: opts.schema,
        thinkingConfig: { thinkingLevel: "low" },
      },
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${res.status} ${body?.error?.message ?? ""}`.trim());
  const text: string | undefined = body?.candidates?.[0]?.content?.parts
    ?.map((p: { text?: string }) => p.text ?? "")
    .join("");
  if (!text) throw new Error(`resposta vazia (${body?.candidates?.[0]?.finishReason ?? "sem candidato"})`);
  return JSON.parse(text) as T;
}
