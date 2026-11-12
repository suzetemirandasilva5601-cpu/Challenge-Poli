"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect } from "react";
import { useUnreadCount } from "@/lib/chat";
import { ChatIcon, DoctorIcon, HomeIcon, PlusIcon, VitalsIcon } from "./icons";

/**
 * A conversa com o Elo fica na barra, ao alcance do polegar: é o jeito mais
 * fácil de perguntar sobre exames e receber os alertas. O Histórico está no
 * cabeçalho (HistoryButton).
 */
const ITEMS = [
  { href: "/", label: "Início", icon: HomeIcon, match: (p: string) => p === "/" },
  { href: "/conversa", label: "Elo", icon: ChatIcon, match: (p: string) => p.startsWith("/conversa"), chat: true },
  { href: "/enviar", label: "Exame", ariaLabel: "Adicionar exame (foto ou PDF)", icon: PlusIcon, match: (p: string) => p.startsWith("/enviar"), primary: true },
  { href: "/wearables", label: "Sinais", icon: VitalsIcon, match: (p: string) => p.startsWith("/wearables") },
  { href: "/compartilhar", label: "Médico", icon: DoctorIcon, match: (p: string) => p.startsWith("/compartilhar") },
];

/**
 * Em rotas com parâmetro dinâmico (/exames/[analito]) o pathname só existe
 * na requisição; o Suspense deixa o resto do layout no shell estático.
 */
export function BottomNav() {
  return (
    <nav
      aria-label="Principal"
      className="glass fixed inset-x-0 bottom-0 z-30 pb-[env(safe-area-inset-bottom)] shadow-[0_-1px_0_rgb(20_40_32/0.06)]"
    >
      <Suspense fallback={<NavItems pathname="" />}>
        <ActiveNavItems />
      </Suspense>
    </nav>
  );
}

/** Última aba da barra visitada: é para onde a seta de voltar leva (HeaderBack). */
export const LAST_TAB_KEY = "elo-saude:ultima-aba";

function ActiveNavItems() {
  const pathname = usePathname();
  useEffect(() => {
    const tab = ITEMS.find((i) => i.match(pathname));
    if (!tab) return;
    try {
      sessionStorage.setItem(LAST_TAB_KEY, tab.href);
    } catch {
      // sem armazenamento: a seta volta para o Início
    }
  }, [pathname]);
  return <NavItems pathname={pathname} />;
}

function NavItems({ pathname }: { pathname: string }) {
  const unread = useUnreadCount();
  return (
    <ul className="mx-auto flex max-w-md items-stretch justify-around px-1 md:max-w-xl">
      {ITEMS.map(({ href, label, ariaLabel, icon: Icon, match, primary, chat }) => {
        const active = pathname !== "" && match(pathname);
        const badge = chat && unread > 0 ? unread : 0;
        return (
          <li key={href} className="flex-1">
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              aria-label={badge ? `${label}, ${badge} ${badge === 1 ? "mensagem nova" : "mensagens novas"}` : ariaLabel}
              className={`relative flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-semibold transition-colors ${active ? "text-brand-700" : "text-ink-500 hover:text-ink-800"}`}
            >
              {/* Indicador da aba ativa: fio no topo, além da cor e do aria-current */}
              <span className={`absolute inset-x-4 top-0 h-[3px] ${active ? "bg-brand-600" : "bg-transparent"}`} aria-hidden />
              {primary ? (
                <span className={`flex h-8 w-11 items-center justify-center rounded-lg ${active ? "bg-brand-700" : "bg-brand-600"} text-white`}>
                  <Icon width={20} />
                </span>
              ) : (
                // Ativo: ícone preenchido, como nos apps nativos
                <span className="relative">
                  <Icon width={24} weight={active ? "fill" : "regular"} />
                  {badge > 0 && (
                    <span
                      className="num absolute -right-2.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-danger-600 px-1 text-xs font-bold leading-none text-white ring-2 ring-white"
                      aria-hidden
                    >
                      {badge > 9 ? "9+" : badge}
                    </span>
                  )}
                </span>
              )}
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
