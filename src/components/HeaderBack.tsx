"use client";

import { usePathname, useRouter } from "next/navigation";
import { Suspense } from "react";
import { LAST_TAB_KEY } from "./BottomNav";
import { BackIcon } from "./icons";

/**
 * Telas abertas pelo cabeçalho, fora da barra inferior: precisam de "voltar".
 * O detalhe de um exame (/exame) já tem o próprio link "Exames".
 */
const NEEDS_BACK = ["historico", "exames", "configuracoes"];

/** Subpáginas voltam para a página-mãe; o resto volta para a aba da barra onde a pessoa estava. */
const PARENT: Record<string, string> = { "configuracoes/dados": "/configuracoes" };

/** Seta pequena de voltar, logo acima do título da página. */
export function HeaderBack() {
  return (
    <Suspense fallback={null}>
      <Back />
    </Suspense>
  );
}

function lastTab(): string {
  try {
    return sessionStorage.getItem(LAST_TAB_KEY) ?? "/";
  } catch {
    return "/";
  }
}

function Back() {
  const pathname = usePathname();
  const router = useRouter();
  const parts = pathname.split("/").filter(Boolean);
  if (!NEEDS_BACK.includes(parts[0] ?? "")) return null;
  const parent = PARENT[parts.join("/")];
  return (
    <button
      type="button"
      aria-label="Voltar"
      onClick={() => router.push(parent ?? lastTab())}
      // Visualmente pequena; a área de toque (36 px) é maior que o ícone
      className="-ml-2 -mt-2 mb-1 flex h-9 w-9 items-center justify-center rounded-full text-ink-600 transition-colors hover:bg-white/70 hover:text-ink-900"
    >
      <BackIcon width={18} />
    </button>
  );
}
