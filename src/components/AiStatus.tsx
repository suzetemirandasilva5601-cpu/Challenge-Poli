"use client";

import { geminiConfigured } from "@/lib/gemini";

/**
 * A IA está ligada quando o build tem a chave da equipe
 * (NEXT_PUBLIC_GEMINI_API_KEY). Constante durante a execução.
 */
export function useAiEnabled(): boolean {
  return geminiConfigured();
}
