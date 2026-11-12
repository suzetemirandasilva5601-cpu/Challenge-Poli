"use client";

import Link from "next/link";
import { CHART, WearableChart } from "@/components/charts";
import { DeviceManager } from "@/components/DeviceManager";
import { ChevronRight } from "@/components/icons";
import { AlertCard, Disclaimer, SectionTitle, Skeleton } from "@/components/ui";
import { formatDate } from "@/lib/dates";
import { computeAlerts } from "@/lib/health";
import { availableMetrics, METRIC_NEEDS, METRICS, sourceOf, type MetricKey } from "@/lib/metrics";
import { useDb } from "@/lib/store";

type Db = NonNullable<ReturnType<typeof useDb>>;

export default function WearablesPage() {
  const db = useDb();
  return (
    <div>
      <h1 className="page-title">Sinais</h1>
      <p className="mt-1 text-sm text-ink-600">O que seus aparelhos medem, no mesmo histórico dos seus exames. Cada sinal aparece quando um aparelho que o mede está conectado.</p>
      {db ? <Signals db={db} /> : <Skeleton lines={5} />}
    </div>
  );
}

/** Ordem de exibição dos sinais na tela. */
const ORDER: MetricKey[] = ["irregular", "restingHr", "spo2", "breathing", "bp", "sleep", "hrv", "steps"];

function Signals({ db }: { db: Db }) {
  const have = availableMetrics(db.devices);
  const alerts = computeAlerts(db).filter((a) => a.kind !== "exames");
  const shown = ORDER.filter((m) => have.has(m));
  const missing = ORDER.filter((m) => !have.has(m));

  return (
    <div>
      {alerts.length > 0 && (
        <>
          <SectionTitle>Alertas</SectionTitle>
          <div className="grid gap-3 md:grid-cols-2 md:items-start">
            {alerts.map((a) => <AlertCard key={a.id} alert={a} />)}
          </div>
        </>
      )}

      {shown.length === 0 && (
        <div className="card mt-6 text-center">
          <p className="font-serif text-lg font-semibold text-ink-900">Nenhum aparelho conectado</p>
          <p className="mt-1 text-sm text-ink-600">Conecte um relógio, anel ou medidor de pressão abaixo para acompanhar seus sinais.</p>
        </div>
      )}

      {shown.map((m) => (
        <Signal key={m} metric={m} db={db} />
      ))}

      {missing.length > 0 && shown.length > 0 && (
        <>
          <SectionTitle>Para ver mais sinais</SectionTitle>
          <div className="space-y-2">
            {missing.map((m) => (
              <a key={m} href="#aparelhos" className="card-link flex items-center gap-3 py-3">
                <span className="flex-1">
                  <span className="block text-[15px] font-semibold text-ink-900">{METRICS[m].label}</span>
                  <span className="block text-sm text-ink-600">Conecte {METRIC_NEEDS[m]}.</span>
                </span>
                <ChevronRight width={18} className="shrink-0 text-ink-400" />
              </a>
            ))}
          </div>
        </>
      )}

      <section id="aparelhos" className="scroll-mt-20">
        <SectionTitle>Aparelhos e apps conectados</SectionTitle>
        <DeviceManager db={db} />
      </section>

      <p className="mt-6 text-sm text-ink-600">
        Para enviar um exame em papel ou PDF, use o botão <Link href="/enviar" className="font-semibold text-brand-700 underline">Exame</Link>.
      </p>
      <Disclaimer />
    </div>
  );
}

/** Um sinal: título, de onde vem, como é medido e o gráfico. */
function Signal({ metric, db }: { metric: MetricKey; db: Db }) {
  const days = db.wearableDays;
  const info = METRICS[metric];
  const source = sourceOf(metric, db.devices);
  const irregular = metric === "irregular" ? days.filter((d) => d.irregularRhythmEvents > 0).reverse() : [];

  return (
    <section>
      <SectionTitle>{info.label}</SectionTitle>
      <div className="card px-2">
        <p className="px-2 pb-1 text-xs text-ink-500">
          {source} · {info.how}
        </p>
        {metric === "restingHr" && <WearableChart days={days} unit="bpm" series={[{ key: "restingHr", name: "FC repouso", color: CHART.ink }]} />}
        {metric === "irregular" && (
          <>
            <WearableChart days={days} unit="episódios" kind="bar" domain={[0, "auto"]} defaultRange={90} series={[{ key: "irregularRhythmEvents", name: "Episódios", color: CHART.out }]} />
            {irregular.length > 0 && (
              <p className="px-2 pb-1 text-xs text-ink-500">
                Registros: {irregular.slice(0, 6).map((d) => `${formatDate(d.date, { day: "2-digit", month: "2-digit" })} (${d.irregularRhythmEvents})`).join(", ")}
              </p>
            )}
          </>
        )}
        {metric === "spo2" && <WearableChart days={days} unit="%" domain={[80, 100]} refs={[{ y: 90, label: "90%" }]} series={[{ key: "spo2Min", name: "SpO2 mínima", color: CHART.blue }]} />}
        {metric === "breathing" && <WearableChart days={days} unit="por hora" domain={[0, "auto"]} refs={[{ y: 15, label: "15", color: CHART.warn }]} series={[{ key: "breathingDisturbances", name: "Pausas/h", color: CHART.night }]} />}
        {metric === "bp" && (
          <WearableChart
            days={days}
            unit="mmHg"
            domain={[60, 160]}
            refs={[{ y: 130, label: "130", color: CHART.warn }, { y: 80, label: "80", color: CHART.warn }]}
            series={[{ key: "systolic", name: "Sistólica", color: CHART.plum }, { key: "diastolic", name: "Diastólica", color: CHART.plum, dashed: true }]}
          />
        )}
        {metric === "sleep" && <WearableChart days={days} unit="h" kind="bar" domain={[0, 10]} series={[{ key: "sleepHours", name: "Sono", color: CHART.night }]} />}
        {metric === "hrv" && <WearableChart days={days} unit="ms" series={[{ key: "hrvMs", name: "VFC", color: CHART.band }]} />}
        {metric === "steps" && <WearableChart days={days} unit="passos" kind="bar" domain={[0, "auto"]} series={[{ key: "steps", name: "Passos", color: CHART.sage }]} />}
      </div>
    </section>
  );
}
