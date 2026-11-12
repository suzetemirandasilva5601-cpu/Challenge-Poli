"use client";

import { usePathname, useRouter } from "next/navigation";
import { Suspense } from "react";
import { BackIcon } from "./icons";

/**
 * Telas abertas pelo cabeçalho, fora da barra inferior: precisam de "voltar".
 * O detalhe de um exame (/exame) já tem o próprio link "Exames".
 */
const NEEDS_BACK = ["historico", "exames", "configuracoes"];

/** Seta pequena de voltar, logo acima do título da página. */
export function HeaderBack() {
  return (
    <Suspense fallback={null}>
      <Back />
    </Suspense>
  );
}

function Back() {
  const pathname = usePathname();
  const router = useRouter();
  const first = pathname.split("/").filter(Boolean)[0] ?? "";
  if (!NEEDS_BACK.includes(first)) return null;
  return (
    <button
      type="button"
      aria-label="Voltar"
      onClick={() => (window.history.length > 1 ? router.back() : router.push("/"))}
      // Visualmente pequena; a área de toque (36 px) é maior que o ícone
      className="-ml-2 -mt-2 mb-1 flex h-9 w-9 items-center justify-center rounded-full text-ink-600 transition-colors hover:bg-white/70 hover:text-ink-900"
    >
      <BackIcon width={18} />
    </button>
  );
}
