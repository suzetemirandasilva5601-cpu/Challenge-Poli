"use client";

import { formatDate } from "@/lib/dates";
import { DEVICE_CATALOG, deviceMetrics, isConnected, METRICS, type DeviceKind } from "@/lib/metrics";
import { connectDevice, setDeviceConnected } from "@/lib/store";
import type { Db } from "@/lib/types";
import { GaugeIcon, PlusIcon, WatchIcon } from "./icons";

const KIND_ICON: Record<DeviceKind, typeof WatchIcon> = { relogio: WatchIcon, anel: WatchIcon, medidor_pressao: GaugeIcon };

/**
 * Aparelhos conectados e o que cada um mede. Ligar ou desligar um aparelho
 * muda na hora quais sinais, gráficos e alertas aparecem no app.
 */
export function DeviceManager({ db }: { db: Db }) {
  const missing = (Object.keys(DEVICE_CATALOG) as DeviceKind[]).filter((k) => !db.devices.some((d) => d.kind === k));

  return (
    <div className="space-y-3">
      {db.devices.map((d) => {
        const on = isConnected(d);
        const Icon = KIND_ICON[d.kind];
        return (
          <div key={d.id} className={`card flex items-start gap-3 ${on ? "" : "opacity-70"}`}>
            <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${on ? "bg-brand-50 text-brand-700" : "bg-ink-900/[0.05] text-ink-500"}`}>
              <Icon width={20} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold text-ink-900">{d.name}</p>
              <p className={`text-xs font-semibold ${on ? "text-brand-700" : "text-ink-500"}`}>
                {on ? `Conectado desde ${formatDate(d.connectedAt.slice(0, 10))} · sincronizado hoje` : "Desconectado: os sinais dele não aparecem"}
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {deviceMetrics(d).map((m) => (
                  <span key={m} className="rounded-full bg-ink-900/[0.05] px-2 py-0.5 text-xs text-ink-600">{METRICS[m].label}</span>
                ))}
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={on}
              aria-label={`${on ? "Desconectar" : "Conectar"} ${d.name}`}
              onClick={() => setDeviceConnected(d.id, !on)}
              className={`relative mt-1 h-7 w-12 shrink-0 rounded-full transition-colors duration-200 ${on ? "bg-brand-600" : "bg-ink-300"}`}
            >
              <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-[left] duration-200 ${on ? "left-[22px]" : "left-0.5"}`} />
            </button>
          </div>
        );
      })}

      {missing.map((k) => {
        const c = DEVICE_CATALOG[k];
        const Icon = KIND_ICON[k];
        return (
          <div key={k} className="flex items-center gap-3 rounded-[var(--radius-card)] border border-dashed border-ink-900/15 p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink-900/[0.05] text-ink-500">
              <Icon width={20} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold text-ink-900">{c.label}</p>
              <p className="text-xs text-ink-500">{c.examples}</p>
            </div>
            <button type="button" className="btn-secondary shrink-0 px-4" onClick={() => connectDevice(k)}>
              <PlusIcon width={16} /> Conectar
            </button>
          </div>
        );
      })}

      <p className="text-xs leading-relaxed text-ink-500">
        No app para celular, a conexão é feita pelo Apple Saúde (iPhone) ou pelo Health Connect (Android), que reúnem os dados de relógios, anéis e
        medidores de várias marcas.
      </p>
    </div>
  );
}
