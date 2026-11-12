import type { HealthAlert, WearableDevice } from "./types";

/**
 * Cada sinal do app vem de um tipo de aparelho. Um sinal (gráfico, número,
 * alerta) só aparece quando há um aparelho conectado que o mede; sem ele, o
 * app diz qual aparelho conectar.
 *
 * Na versão nativa, a conexão vem do Apple Saúde (HealthKit) ou do Health
 * Connect (Android); cada tipo de dado de lá vira uma destas métricas.
 */
export type MetricKey = "restingHr" | "hrv" | "irregular" | "spo2" | "breathing" | "sleep" | "steps" | "bp";

export const METRICS: Record<MetricKey, { label: string; unit: string; how: string }> = {
  restingHr: { label: "Batimentos em repouso", unit: "bpm", how: "média do dia em repouso" },
  hrv: { label: "Variabilidade cardíaca (VFC)", unit: "ms", how: "média noturna" },
  irregular: { label: "Ritmo irregular", unit: "episódios", how: "avisos de ritmo irregular por dia" },
  spo2: { label: "Oxigenação noturna (SpO2)", unit: "%", how: "menor valor da noite" },
  breathing: { label: "Pausas na respiração", unit: "por hora", how: "distúrbios respiratórios durante o sono" },
  sleep: { label: "Sono", unit: "h", how: "total da noite" },
  steps: { label: "Passos", unit: "passos", how: "total do dia" },
  bp: { label: "Pressão arterial", unit: "mmHg", how: "média das medidas do dia" },
};

export type DeviceKind = WearableDevice["kind"];

export const DEVICE_CATALOG: Record<DeviceKind, { label: string; provides: MetricKey[]; examples: string }> = {
  relogio: {
    label: "Relógio inteligente",
    provides: ["restingHr", "hrv", "irregular", "spo2", "breathing", "sleep", "steps"],
    examples: "Apple Watch, Galaxy Watch, Fitbit, Garmin",
  },
  anel: { label: "Anel inteligente", provides: ["restingHr", "hrv", "spo2", "sleep", "steps"], examples: "Oura, Galaxy Ring" },
  medidor_pressao: { label: "Medidor de pressão", provides: ["bp"], examples: "Omron, Withings (braço, com Bluetooth)" },
};

/** Que aparelho conectar para ver cada métrica (texto curto para o usuário). */
export const METRIC_NEEDS: Record<MetricKey, string> = {
  restingHr: "um relógio ou anel",
  hrv: "um relógio ou anel",
  irregular: "um relógio com aviso de ritmo irregular",
  spo2: "um relógio ou anel com oxímetro",
  breathing: "um relógio que monitore o sono",
  sleep: "um relógio ou anel",
  steps: "um relógio ou anel",
  bp: "um medidor de pressão",
};

/** Métricas que cada alerta precisa para existir. */
export const ALERT_NEEDS: Record<HealthAlert["kind"], MetricKey[]> = {
  ritmo_irregular: ["irregular"],
  apneia: ["spo2", "breathing"],
  pressao: ["bp"],
  fc_repouso: ["restingHr"],
  exames: [],
};

export const isConnected = (d: WearableDevice) => d.connected !== false;

export function deviceMetrics(d: WearableDevice): MetricKey[] {
  return d.provides ?? DEVICE_CATALOG[d.kind]?.provides ?? [];
}

/** Métricas medidas por algum aparelho conectado. */
export function availableMetrics(devices: WearableDevice[]): Set<MetricKey> {
  return new Set(devices.filter(isConnected).flatMap(deviceMetrics));
}

/** Nome do aparelho conectado que fornece a métrica (o primeiro, se houver mais de um). */
export function sourceOf(metric: MetricKey, devices: WearableDevice[]): string | null {
  return devices.find((d) => isConnected(d) && deviceMetrics(d).includes(metric))?.name ?? null;
}
