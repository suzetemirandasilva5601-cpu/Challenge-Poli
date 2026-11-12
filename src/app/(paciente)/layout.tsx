import Link from "next/link";
import { BottomNav } from "@/components/BottomNav";
import { HeaderBack } from "@/components/HeaderBack";
import { HistoryButton } from "@/components/HistoryButton";
import { ChatNotifier } from "@/components/ChatNotifier";
import { GearIcon, LogoMark } from "@/components/icons";

export default function PacienteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col md:max-w-3xl lg:max-w-4xl">
      <header className="glass sticky top-0 z-20 flex items-center justify-between px-4 py-2 md:px-8 pt-[max(0.5rem,env(safe-area-inset-top))] shadow-[0_1px_0_rgb(20_40_32/0.06)]">
        <Link href="/" className="-ml-1 flex min-h-11 items-center gap-2 px-1">
            <LogoMark />
            <span className="flex flex-col leading-none">
              <span className="whitespace-nowrap font-serif text-xl font-semibold tracking-[-0.01em] text-brand-800">Elo Saúde</span>
            </span>
          </Link>
        <div className="flex items-center">
          <HistoryButton />
          <Link
            href="/configuracoes"
            aria-label="Configurações"
            className="flex h-11 w-11 items-center justify-center rounded-lg text-ink-600 transition-colors hover:bg-ink-100"
          >
            <GearIcon width={24} />
          </Link>
        </div>
      </header>
      <ChatNotifier />
      <main className="flex-1 px-4 pb-32 pt-5 md:px-8 md:pt-8">
        <HeaderBack />
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
