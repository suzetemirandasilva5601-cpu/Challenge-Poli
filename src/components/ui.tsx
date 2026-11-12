import Link from "next/link";
import type { LabStatus } from "@/lib/health";
import type { HealthAlert } from "@/lib/types";
import { AlertIcon, ArrowDownIcon, ArrowUpIcon, CheckIcon, ChevronRight, MinusIcon, UrgentIcon } from "./icons";

/**
 * Status de um resultado, nos termos usados nos laudos.
 * Sempre ícone + texto, nunca só cor. "Normal" fica neutro para que
 * o olho vá direto ao que está alterado.
 */
export function StatusBadge({ status }: { status: LabStatus }) {
  const map = {
    alto: ["Alto", ArrowUpIcon, "bg-danger-100 text-danger-800"],
    baixo: ["Baixo", ArrowDownIcon, "bg-warn-100 text-warn-900"],
    normal: ["Normal", CheckIcon, "bg-ink-900/[0.06] text-ink-600"],
    sem_faixa: ["Sem referência", MinusIcon, "bg-ink-900/[0.06] text-ink-600"],
  } as const;
  const [label, Icon, cls] = map[status];
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`}>
      <Icon width={12} />
      {label}
    </span>
  );
}

export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-3 mt-8 flex items-baseline justify-between gap-3">
      <h2 className="text-lg font-semibold text-ink-900">{children}</h2>
      {action}
    </div>
  );
}

export function SectionLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="-my-2 inline-flex min-h-11 shrink-0 items-center text-[15px] font-semibold text-brand-700 underline-offset-4 hover:underline">
      {children}
    </Link>
  );
}

export function AlertCard({
  alert,
  compact,
  cta = true,
  audience = "paciente",
}: {
  alert: HealthAlert;
  compact?: boolean;
  cta?: boolean;
  /** "medico": texto clínico em terceira pessoa, sem as orientações ao paciente. */
  audience?: "paciente" | "medico";
}) {
  const urgent = alert.severity === "procure_medico";
  const Icon = urgent ? UrgentIcon : AlertIcon;
  const forDoctor = audience === "medico";
  return (
    // Vidro com leve tom da gravidade + pílula com ícone e texto (não depende só da cor)
    <article className={`card p-0 ${urgent ? "bg-danger-50/70" : "bg-warn-50/70"}`}>
      <div className="p-4">
      <p
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
          urgent ? "bg-danger-600 text-white shadow-[0_4px_12px_-4px_rgb(180_35_24/0.6)]" : "bg-warn-200/80 text-warn-900"
        }`}
      >
        <Icon width={14} />
        {forDoctor ? (urgent ? "Prioridade alta" : "Atenção") : urgent ? "Procure um médico" : "Atenção"}
      </p>
      <h3 className="mt-2.5 font-serif text-xl font-semibold leading-snug text-ink-900">{alert.title}</h3>
      <p className="mt-1 text-[15px] text-ink-700">{forDoctor ? alert.clinical : alert.message}</p>
      {!compact && (
        <>
          {forDoctor ? (
            alert.specialty && (
              <p className="well mt-3 px-3 py-2.5 text-sm text-ink-700">
                <span className="font-semibold text-ink-900">Encaminhamento a considerar: </span>
                {alert.specialty}
              </p>
            )
          ) : (
            <div className="well mt-3 px-3 py-2.5">
              <p className="text-[15px] text-ink-900">
                <span className="font-semibold">O que fazer: </span>
                {alert.recommendation}
              </p>
              {alert.specialty && <p className="mt-1 text-sm text-ink-600">Especialidade: {alert.specialty}</p>}
            </div>
          )}
          {alert.evidence.length > 0 && (
            <details className="mt-1 text-sm text-ink-600">
              <summary className="inline-flex min-h-11 items-center font-semibold text-brand-700">Ver medições</summary>
              <ul className="num list-disc space-y-0.5 pl-5">
                {alert.evidence.map((e) => <li key={e}>{e}</li>)}
              </ul>
            </details>
          )}
          {cta && urgent && (
            <Link href="/compartilhar" className="btn-primary mt-3 w-full">
              Enviar meu histórico para um médico
            </Link>
          )}
        </>
      )}
      </div>
    </article>
  );
}

export function ListLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="flex min-h-14 items-center gap-3 px-4 py-3 transition-colors hover:bg-ink-50">
      <div className="min-w-0 flex-1">{children}</div>
      <ChevronRight width={18} className="shrink-0 text-ink-400" />
    </Link>
  );
}

export function Skeleton({ lines = 4 }: { lines?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Carregando">
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className="h-20 animate-pulse rounded-xl bg-ink-200/60" />
      ))}
    </div>
  );
}

export function Disclaimer() {
  return (
    <p className="mt-10 border-t border-ink-200 pt-4 text-center text-sm leading-relaxed text-ink-500">
      Os alertas indicam quando procurar atendimento. Eles não são diagnóstico.
      Em emergência, ligue <strong className="text-ink-700">192 (SAMU)</strong>.
    </p>
  );
}
