/** Datas são sempre strings ISO "YYYY-MM-DD"; instantes são ISO completos. */

export interface Patient {
  id: string;
  name: string;
  birthDate: string;
  sex: "F" | "M";
  bloodType?: string;
  allergies: string[];
  /** Condições de saúde conhecidas (ex.: hipertensão). */
  conditions?: string[];
  heightCm?: number;
  weightKg?: number;
  emergencyContact?: { name: string; relation?: string; phone: string };
  /** Operadora do plano de saúde (só o nome; sem número da carteirinha). */
  healthPlan?: string;
}

/** Preferências do usuário. Campos ausentes valem o padrão (tudo ligado). */
export interface Prefs {
  /** Avisar na conversa e no topo da tela quando surgir um alerta deste tipo. */
  notify?: Partial<Record<HealthAlert["kind"], boolean>>;
  /** Mostrar o aviso que desce no topo da tela. */
  toast?: boolean;
}

export type ExtractionSource = "gemini" | "simulado" | "manual" | "seed";

export interface SourceDocument {
  id: string;
  filename: string;
  mimeType: string;
  /** Chave do arquivo original no IndexedDB. Ausente em registros importados (seed). */
  storedAs?: string;
  uploadedAt: string;
  examDate: string;
  lab?: string;
  extractedBy: ExtractionSource;
  model?: string;
}

export interface LabResult {
  id: string;
  documentId?: string;
  analyteKey: string;
  name: string;
  value: number | null;
  valueText?: string;
  unit: string;
  refLow?: number | null;
  refHigh?: number | null;
  refText?: string;
  date: string;
  lab?: string;
}

export interface Encounter {
  id: string;
  date: string;
  specialty: string;
  professional: string;
  place: string;
  reason: string;
  notes?: string;
}

export interface Medication {
  id: string;
  name: string;
  dose: string;
  frequency: string;
  startDate: string;
  endDate?: string | null;
  reason?: string;
}

export interface Vaccine {
  id: string;
  name: string;
  date: string;
  dose?: string;
}

export interface WearableDay {
  date: string;
  restingHr: number;
  hrvMs: number;
  sleepHours: number;
  spo2Min: number;
  /** Distúrbios respiratórios por hora de sono. */
  breathingDisturbances: number;
  steps: number;
  irregularRhythmEvents: number;
  systolic: number;
  diastolic: number;
}

export interface WearableDevice {
  id: string;
  name: string;
  kind: "relogio" | "anel" | "medidor_pressao";
  /** Texto livre legado; o que vale é `provides` (ou o padrão do tipo, em lib/metrics.ts). */
  metrics: string[];
  /** Métricas que este aparelho fornece. Ausente: o padrão do tipo de aparelho. */
  provides?: import("./metrics").MetricKey[];
  /** false quando o usuário desconectou. Os dados antigos ficam, mas não aparecem. */
  connected?: boolean;
  connectedAt: string;
}

export const SCOPES = [
  "exames",
  "consultas",
  "medicamentos",
  "vacinas",
  "wearables",
] as const;
export type Scope = (typeof SCOPES)[number];

export const SCOPE_LABELS: Record<Scope, string> = {
  exames: "Exames laboratoriais",
  consultas: "Consultas",
  medicamentos: "Medicamentos",
  vacinas: "Vacinas",
  wearables: "Relógio, medidor de pressão e alertas",
};

export interface AccessLogEntry {
  at: string;
  userAgent?: string;
}

export interface DoctorSummary {
  resumo: string;
  pontosDeAtencao: { titulo: string; detalhe: string }[];
  perguntasSugeridas: string[];
  geradoPor: string;
  geradoEm: string;
}

/** Quem recebe o acesso. Clínica e hospital: o histórico fica com a instituição, não com um só médico. */
export type RecipientKind = "medico" | "clinica" | "hospital";

export const RECIPIENTS: Record<RecipientKind, { label: string; nameLabel: string; namePlaceholder: string; idLabel: string; idPlaceholder: string }> = {
  medico: { label: "Médico", nameLabel: "Nome do médico", namePlaceholder: "Dra. Ana Ribeiro", idLabel: "CRM", idPlaceholder: "123456/SP" },
  clinica: { label: "Clínica", nameLabel: "Nome da clínica", namePlaceholder: "Clínica São Lucas", idLabel: "CNES", idPlaceholder: "1234567" },
  hospital: { label: "Hospital", nameLabel: "Nome do hospital", namePlaceholder: "Hospital Santa Clara", idLabel: "CNES", idPlaceholder: "1234567" },
};

/** "Dra. Ana Ribeiro" ou "Clínica São Lucas (clínica)", com o registro quando houver. */
export function recipientText(s: Pick<Share, "doctorName" | "doctorCrm" | "recipientKind">, withId = false): string {
  const kind = s.recipientKind ?? "medico";
  const id = withId && s.doctorCrm ? ` · ${RECIPIENTS[kind].idLabel} ${s.doctorCrm}` : "";
  return `${s.doctorName}${id}`;
}

export interface Share {
  token: string;
  /** Nome de quem recebe: médico, clínica ou hospital (nome mantido por compatibilidade). */
  doctorName: string;
  /** CRM do médico ou CNES da instituição. */
  doctorCrm?: string;
  recipientKind?: RecipientKind;
  scopes: Scope[];
  createdAt: string;
  expiresAt: string;
  revokedAt?: string | null;
  accessLog: AccessLogEntry[];
  summaryCache?: { hash: string; summary: DoctorSummary };
}

export interface Db {
  version: 1;
  createdAt: string;
  patient: Patient;
  documents: SourceDocument[];
  labResults: LabResult[];
  encounters: Encounter[];
  medications: Medication[];
  vaccines: Vaccine[];
  wearableDays: WearableDay[];
  devices: WearableDevice[];
  shares: Share[];
  prefs?: Prefs;
}

export type AlertSeverity = "atencao" | "procure_medico";

export interface HealthAlert {
  id: string;
  kind: "ritmo_irregular" | "apneia" | "pressao" | "fc_repouso" | "exames";
  severity: AlertSeverity;
  title: string;
  /** Texto para o paciente (segunda pessoa). */
  message: string;
  /** Mesmo achado em linguagem clínica e terceira pessoa, para a tela do médico. */
  clinical: string;
  recommendation: string;
  specialty?: string;
  evidence: string[];
}

/** Resultado da extração por IA, antes da revisão do usuário. */
export interface ExtractedResult {
  name: string;
  analyteKey: string;
  value: number | null;
  valueText: string | null;
  unit: string;
  refLow: number | null;
  refHigh: number | null;
  refText: string | null;
}

export interface Extraction {
  lab: string | null;
  examDate: string | null;
  patientName: string | null;
  results: ExtractedResult[];
  notes: string | null;
  source: ExtractionSource;
  model?: string;
}
