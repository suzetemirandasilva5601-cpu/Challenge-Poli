"use client";

import Link from "next/link";
import { AlertIcon, CheckIcon, ChevronRight, ClipboardIcon, DropIcon, GaugeIcon, HeartIcon, MoonIcon } from "@/components/icons";
import { AlertCard, Disclaimer, SectionLink, SectionTitle, Skeleton, StatusBadge } from "@/components/ui";
import { availableMetrics, type MetricKey } from "@/lib/metrics";
import type { HealthAlert, WearableDay } from "@/lib/types";
import { ageFrom, formatDate } from "@/lib/dates";
import { analyteSeries, computeAlerts, fmt, formatRef, wearableSnapshot } from "@/lib/health";
import { useDb } from "@/lib/store";

export function HomeView() {
  const db = useDb();
  if (!db) return <Skeleton lines={5} />;

  const p = db.patient;
  const alerts = computeAlerts(db);
  const w = wearableSnapshot(db.wearableDays);
  const altered = analyteSeries(db.labResults).filter((s) => s.status === "alto" || s.status === "baixo");
  const activeMeds = db.medications.filter((m) => !m.endDate);
  const since = db.documents.length ? Math.min(...db.documents.map((d) => Number(d.examDate.slice(0, 4)))) : null;
  const bpHigh = w.systolic >= 130 || w.diastolic >= 80;
  const spo2Low = w.spo2Min < 90;
  const week = [...db.wearableDays].sort((a, b) => a.date.localeCompare(b.date)).slice(-7);
  const series = (pick: (d: WearableDay) => number) => week.map(pick);
  const have = availableMetrics(db.devices);

  return (
    <div>
      <h1 className="sr-only">Início</h1>

      {/* Tablet: resumo do dia e ficha médica lado a lado */}
      <div className="md:grid md:grid-cols-2 md:gap-4">
      <TodaySummary alerts={alerts} />

      {/* Ficha médica: o que qualquer profissional precisa saber primeiro */}
      <section aria-labelledby="ficha" className="card mt-4 overflow-hidden p-0 md:mt-0">
        {/* Capa do prontuário: o bloco escuro dá peso ao que identifica o paciente */}
        <div className="bg-[radial-gradient(120%_140%_at_100%_0%,#2f7a63_0%,#174a3c_45%,#0b2720_100%)] px-4 pb-4 pt-3.5 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.15)]">
          <p id="ficha" className="text-xs font-bold uppercase tracking-[0.1em] text-brand-200">Ficha médica</p>
          <p className="mt-1 font-serif text-[1.75rem] font-semibold leading-tight">{p.name}</p>
          <p className="mt-0.5 text-[15px] text-brand-100">
            {ageFrom(p.birthDate)} anos, {p.sex === "F" ? "feminino" : "masculino"}
            {p.bloodType ? <>, sangue <strong className="text-white">{p.bloodType}</strong></> : null}
          </p>
        </div>
        <dl className="space-y-2 px-4 py-3.5 text-[15px]">
          <div className="flex gap-3">
            <dt className="w-28 shrink-0 font-semibold text-danger-700">Alergias</dt>
            <dd className="text-ink-800">{p.allergies.join(", ") || "Nenhuma conhecida"}</dd>
          </div>
          <div className="flex gap-3">
            <dt className="w-28 shrink-0 font-semibold text-ink-600">Medicamentos</dt>
            <dd className="text-ink-800">
              {activeMeds.length
                ? activeMeds.map((m) => <span key={m.id} className="block">{m.name} {m.dose}</span>)
                : "Nenhum em uso"}
            </dd>
          </div>
        </dl>
      </section>
      </div>


      <div id="alertas" className="scroll-mt-20">
        <SectionTitle>{alerts.length ? `Alertas (${alerts.length})` : "Alertas"}</SectionTitle>
      </div>
      {alerts.length ? (
        <div className="grid gap-3 md:grid-cols-2 md:items-start">
          {alerts.map((a) => <AlertCard key={a.id} alert={a} />)}
        </div>
      ) : (
        <p className="card text-[15px] text-ink-600">Nenhum alerta no momento.</p>
      )}

      <SectionTitle action={<SectionLink href="/wearables">Ver tudo</SectionLink>}>Últimos 7 dias</SectionTitle>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {have.has("restingHr") && <Vital icon={<HeartIcon />} label="Batimentos em repouso" value={`${w.restingHr}`} unit="bpm" note="média" series={series((d) => d.restingHr)} />}
        {have.has("sleep") && <Vital icon={<MoonIcon />} label="Sono" value={fmt(w.sleepHours)} unit="h/noite" note="média" series={series((d) => d.sleepHours)} />}
        {have.has("spo2") && <Vital icon={<DropIcon />} label="Saturação mínima" value={`${w.spo2Min}`} unit="%" note={spo2Low ? "abaixo de 90%" : "menor valor"} warn={spo2Low} series={series((d) => d.spo2Min)} />}
        {have.has("bp") && <Vital icon={<GaugeIcon />} label="Pressão arterial" value={`${w.systolic}/${w.diastolic}`} unit="mmHg" note={bpHigh ? "acima de 130/80" : "média"} warn={bpHigh} series={series((d) => d.systolic)} />}
        {!["restingHr", "sleep", "spo2", "bp"].some((m) => have.has(m as MetricKey)) && (
          <Link href="/wearables#aparelhos" className="card-link col-span-full text-[15px] text-ink-600">
            Nenhum aparelho conectado. <span className="font-semibold text-brand-700">Conectar relógio ou medidor</span>
          </Link>
        )}
      </div>

      <SectionTitle action={<SectionLink href="/exames">Todos os exames</SectionLink>}>Exames alterados</SectionTitle>
      {altered.length ? (
        <ul className="card divide-y divide-ink-100 p-0">
          {altered.slice(0, 5).map((s) => (
            <li key={s.key}>
              <Link href={`/exame/?a=${encodeURIComponent(s.key)}`} className="flex min-h-16 items-center gap-3 px-4 py-3 transition-colors hover:bg-ink-50">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold text-ink-900">{s.name}</p>
                  <p className="num text-sm text-ink-500">Referência {formatRef(s.latest)}</p>
                  <p className="num text-sm text-ink-500">Coleta {formatDate(s.latest.date)}</p>
                </div>
                <div className="text-right">
                  <p className="num text-base font-semibold text-ink-900">
                    {s.latest.value != null ? fmt(s.latest.value) : s.latest.valueText} <span className="text-xs font-normal text-ink-500">{s.unit}</span>
                  </p>
                  <StatusBadge status={s.status} />
                </div>
                <ChevronRight width={18} className="shrink-0 text-ink-400" />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="card text-[15px] text-ink-600">Seus últimos resultados estão dentro da referência.</p>
      )}
      <p className="mt-2 text-sm text-ink-500">
        {db.documents.length} laudos e {db.labResults.length} resultados guardados{since ? `, desde ${since}` : ""}.
      </p>

      <Link
        href="/compartilhar"
        className="mt-8 flex items-center gap-3 rounded-[var(--radius-card)] bg-[linear-gradient(135deg,#2f7a63,#174a3c)] p-4 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.2),0_14px_30px_-12px_rgb(23_74_60/0.6)] transition-[box-shadow,translate] duration-200 hover:-translate-y-0.5"
      >
        <ClipboardIcon width={28} className="shrink-0 text-brand-200" />
        <span className="flex-1">
          <span className="block font-serif text-lg font-semibold">Tem consulta marcada?</span>
          <span className="block text-sm text-brand-100">Gere um relatório com seus exames e medições para mostrar ao médico.</span>
        </span>
        <ChevronRight width={18} className="shrink-0 text-brand-200" />
      </Link>

      <Disclaimer />
    </div>
  );
}

const SHORT: Record<HealthAlert["kind"], string> = {
  ritmo_irregular: "Ritmo irregular",
  apneia: "Apneia do sono",
  pressao: "Pressão",
  fc_repouso: "Batimentos",
  exames: "Exames",
};

/** Resumo do dia em uma frase: o que pede atenção, do mais ao menos urgente. */
function TodaySummary({ alerts }: { alerts: HealthAlert[] }) {
  const raw = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  const today = raw.charAt(0).toUpperCase() + raw.slice(1);
  const urgent = alerts.filter((a) => a.severity === "procure_medico").length;
  const headline = !alerts.length
    ? "Tudo em ordem hoje"
    : urgent
      ? `${urgent === 1 ? "1 ponto pede" : `${urgent} pontos pedem`} um médico`
      : `${alerts.length === 1 ? "1 ponto pede" : `${alerts.length} pontos pedem`} atenção`;
  return (
    <section aria-labelledby="hoje" className="card md:h-full">
      <p className="text-sm text-ink-500">{today}</p>
      <p id="hoje" className="mt-0.5 flex items-center gap-2 font-serif text-[1.4rem] font-semibold leading-tight text-ink-900">
        {!alerts.length && <CheckIcon width={20} className="text-brand-600" />}
        {headline}
      </p>
      {alerts.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {alerts.map((a) => (
            <a
              key={a.id}
              href="#alertas"
              className={`inline-flex min-h-8 items-center gap-1 rounded-full px-3 text-sm font-semibold transition-colors ${
                a.severity === "procure_medico" ? "bg-danger-100 text-danger-800 hover:bg-danger-200" : "bg-warn-100 text-warn-900 hover:bg-warn-200"
              }`}
            >
              {SHORT[a.kind]}
            </a>
          ))}
        </div>
      )}
    </section>
  );
}

/** Minigráfico de 7 dias: só a tendência, sem eixos. */
function Sparkline({ values, warn }: { values: number[]; warn?: boolean }) {
  if (values.length < 2) return null;
  const W = 100, H = 28, pad = 3;
  const lo = Math.min(...values), hi = Math.max(...values);
  const span = hi - lo || 1;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * W, H - pad - ((v - lo) / span) * (H - pad * 2)] as const);
  const color = warn ? "var(--color-warn-600)" : "var(--color-brand-500)";

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="mt-2 h-7 w-full overflow-visible" aria-hidden>
      <polyline points={pts.map((p) => p.join(",")).join(" ")} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function Vital({ icon, label, value, unit, note, warn, series }: { icon: React.ReactNode; label: string; value: string; unit: string; note: string; warn?: boolean; series?: number[] }) {
  return (
    <div className={`card ${warn ? "bg-warn-50/75" : ""}`}>
      <p className="flex items-center gap-1.5 text-sm font-medium leading-tight text-ink-600">
        <span className="shrink-0 text-ink-500 [&>svg]:h-4 [&>svg]:w-4">{icon}</span>
        {label}
      </p>
      <p className="num mt-1.5 font-serif text-[1.75rem] font-semibold leading-tight text-ink-900">
        {value} <span className="font-sans text-sm font-medium text-ink-500">{unit}</span>
      </p>
      <p className={`mt-0.5 flex items-center gap-1 text-xs ${warn ? "font-semibold text-warn-800" : "text-ink-500"}`}>
        {warn && <AlertIcon width={12} />}
        {note}
      </p>
      {series && <Sparkline values={series} warn={warn} />}
    </div>
  );
}
