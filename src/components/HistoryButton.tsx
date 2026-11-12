"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { HistoryIcon } from "./icons";

const isHistory = (p: string) => p.startsWith("/historico") || p.startsWith("/exames") || p.startsWith("/exame");

/** Atalho do cabeçalho para o Histórico (linha do tempo e exames). */
export function HistoryButton() {
  return (
    <Suspense fallback={<Button active={false} />}>
      <ActiveButton />
    </Suspense>
  );
}

function ActiveButton() {
  return <Button active={isHistory(usePathname())} />;
}

function Button({ active }: { active: boolean }) {
  return (
    <Link
      href="/historico"
      aria-label="Histórico"
      aria-current={active ? "page" : undefined}
      className={`flex min-h-11 items-center gap-1.5 px-2 text-sm font-semibold transition-colors ${
        active ? "text-brand-700" : "text-ink-600 hover:text-ink-900"
      }`}
    >
      <HistoryIcon width={22} weight={active ? "fill" : "regular"} />
      Histórico
    </Link>
  );
}
