"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronRight } from "@/components/icons";
import { SectionTitle, Skeleton } from "@/components/ui";
import { ageFrom, formatDate } from "@/lib/dates";
import { shareState } from "@/lib/share";
import { exportData, resetDemo, updatePatient, updatePrefs, useDb } from "@/lib/store";
import type { Db, HealthAlert, Patient } from "@/lib/types";

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

/** Tipos de alerta e se podem ser silenciados. Os que pedem médico ficam sempre ligados. */
const ALERT_PREFS: { kind: HealthAlert["kind"]; label: string; locked?: boolean }[] = [
  { kind: "ritmo_irregular", label: "Ritmo cardíaco irregular", locked: true },
  { kind: "apneia", label: "Sinais de apneia do sono", locked: true },
  { kind: "pressao", label: "Pressão acima da meta" },
  { kind: "fc_repouso", label: "Batimentos em repouso mais altos" },
  { kind: "exames", label: "Exames fora da referência" },
];

export default function ConfiguracoesPage() {
  const db = useDb();
  const [editing, setEditing] = useState(false);
  if (!db) return <Skeleton lines={5} />;
  const p = db.patient;

  return (
    <div>
      <h1 className="page-title">Configurações</h1>

      <ProfileHeader patient={p} onEdit={() => setEditing(true)} editing={editing} />

      {editing ? (
        <ProfileForm patient={p} onDone={() => setEditing(false)} />
      ) : (
        <>
          <SectionTitle>Perfil de saúde</SectionTitle>
          <dl className="card divide-y divide-ink-900/[0.06] p-0 text-[15px]">
            <Row label="Nascimento" value={`${formatDate(p.birthDate)} · ${ageFrom(p.birthDate)} anos`} />
            <Row label="Sexo" value={p.sex === "F" ? "Feminino" : "Masculino"} />
            <Row label="Tipo sanguíneo" value={p.bloodType ?? "Não informado"} />
            <Row label="Altura e peso" value={bodyText(p)} />
            <Row label="Alergias" value={p.allergies.join(", ") || "Nenhuma conhecida"} danger={p.allergies.length > 0} />
            <Row label="Condições" value={p.conditions?.join(", ") || "Nenhuma informada"} />
            <Row label="Plano de saúde" value={p.healthPlan ?? "Não informado"} />
          </dl>

          <SectionTitle>Contato de emergência</SectionTitle>
          {p.emergencyContact ? (
            <div className="card flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink-900">{p.emergencyContact.name}</p>
                <p className="num text-sm text-ink-600">
                  {[p.emergencyContact.relation, p.emergencyContact.phone].filter(Boolean).join(" · ")}
                </p>
              </div>
              <a href={`tel:${p.emergencyContact.phone.replace(/[^\d+]/g, "")}`} className="btn-secondary shrink-0">Ligar</a>
            </div>
          ) : (
            <button type="button" className="card w-full text-left text-[15px] text-ink-600" onClick={() => setEditing(true)}>
              Nenhum contato cadastrado. <span className="font-semibold text-brand-700">Adicionar</span>
            </button>
          )}
        </>
      )}

      <Devices db={db} />
      <Notifications db={db} />
      <Privacy db={db} />

      <SectionTitle>Sobre</SectionTitle>
      <div className="card space-y-2 text-sm text-ink-600">
        <p>Elo Saúde organiza seu histórico e indica quando procurar atendimento. Os alertas não são diagnóstico.</p>
        <p>Em emergência, ligue <a href="tel:192" className="font-semibold text-danger-700">192 (SAMU)</a>.</p>
      </div>
    </div>
  );
}

function bodyText(p: Patient) {
  if (!p.heightCm && !p.weightKg) return "Não informado";
  const parts = [p.heightCm && `${p.heightCm} cm`, p.weightKg && `${p.weightKg.toLocaleString("pt-BR")} kg`].filter(Boolean);
  if (p.heightCm && p.weightKg) {
    const imc = p.weightKg / (p.heightCm / 100) ** 2;
    parts.push(`IMC ${imc.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}`);
  }
  return parts.join(" · ");
}

function ProfileHeader({ patient: p, onEdit, editing }: { patient: Patient; onEdit: () => void; editing: boolean }) {
  const initials = p.name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  return (
    <section className="card mt-5 flex items-center gap-4">
      <span
        aria-hidden
        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#2f7a63,#174a3c)] font-serif text-2xl font-semibold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_8px_20px_-8px_rgb(23_74_60/0.6)]"
      >
        {initials}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-serif text-xl font-semibold text-ink-900">{p.name}</p>
        <p className="text-sm text-ink-600">
          {ageFrom(p.birthDate)} anos{p.bloodType ? ` · sangue ${p.bloodType}` : ""}
        </p>
      </div>
      {!editing && (
        <button type="button" className="btn-secondary shrink-0" onClick={onEdit}>
          Editar
        </button>
      )}
    </section>
  );
}

function Row({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="flex gap-3 px-4 py-3">
      <dt className={`w-32 shrink-0 font-semibold ${danger ? "text-danger-700" : "text-ink-600"}`}>{label}</dt>
      <dd className="min-w-0 text-ink-900">{value}</dd>
    </div>
  );
}

const splitList = (s: string) => s.split(/[,;\n]/).map((x) => x.trim()).filter(Boolean);
const toNum = (s: string) => (s.trim() ? Number(s.replace(",", ".")) : undefined);

function ProfileForm({ patient: p, onDone }: { patient: Patient; onDone: () => void }) {
  const [f, setF] = useState({
    name: p.name,
    birthDate: p.birthDate,
    sex: p.sex,
    bloodType: p.bloodType ?? "",
    allergies: p.allergies.join(", "),
    conditions: (p.conditions ?? []).join(", "),
    heightCm: p.heightCm?.toString() ?? "",
    weightKg: p.weightKg?.toLocaleString("pt-BR") ?? "",
    healthPlan: p.healthPlan ?? "",
    ecName: p.emergencyContact?.name ?? "",
    ecRelation: p.emergencyContact?.relation ?? "",
    ecPhone: p.emergencyContact?.phone ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  function save(e: React.FormEvent) {
    e.preventDefault();
    const res = updatePatient({
      name: f.name,
      birthDate: f.birthDate,
      sex: f.sex,
      bloodType: f.bloodType,
      allergies: splitList(f.allergies),
      conditions: splitList(f.conditions),
      heightCm: toNum(f.heightCm),
      weightKg: toNum(f.weightKg),
      healthPlan: f.healthPlan,
      emergencyContact: { name: f.ecName, relation: f.ecRelation, phone: f.ecPhone },
    });
    if ("error" in res) return setError(res.error);
    onDone();
  }

  return (
    <form onSubmit={save} className="card mt-4 space-y-4">
      <Field label="Nome completo"><input className="input" value={f.name} onChange={set("name")} autoComplete="name" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Nascimento"><input type="date" className="input" value={f.birthDate} onChange={set("birthDate")} /></Field>
        <Field label="Sexo">
          <select className="input" value={f.sex} onChange={set("sex")}>
            <option value="F">Feminino</option>
            <option value="M">Masculino</option>
          </select>
        </Field>
        <Field label="Tipo sanguíneo">
          <select className="input" value={f.bloodType} onChange={set("bloodType")}>
            <option value="">Não sei</option>
            {BLOOD_TYPES.map((b) => <option key={b}>{b}</option>)}
          </select>
        </Field>
        <Field label="Plano de saúde"><input className="input" value={f.healthPlan} onChange={set("healthPlan")} placeholder="Operadora" /></Field>
        <Field label="Altura (cm)"><input inputMode="numeric" className="input num" value={f.heightCm} onChange={set("heightCm")} /></Field>
        <Field label="Peso (kg)"><input inputMode="decimal" className="input num" value={f.weightKg} onChange={set("weightKg")} /></Field>
      </div>
      <Field label="Alergias" hint="Separe por vírgula. Aparecem em destaque para o médico.">
        <input className="input" value={f.allergies} onChange={set("allergies")} placeholder="Ex.: dipirona, camarão" />
      </Field>
      <Field label="Condições de saúde" hint="Separe por vírgula.">
        <input className="input" value={f.conditions} onChange={set("conditions")} placeholder="Ex.: hipertensão, asma" />
      </Field>

      <fieldset className="space-y-3 pt-1">
        <legend className="mb-2 text-sm font-semibold text-ink-900">Contato de emergência</legend>
        <Field label="Nome"><input className="input" value={f.ecName} onChange={set("ecName")} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Parentesco"><input className="input" value={f.ecRelation} onChange={set("ecRelation")} placeholder="Ex.: filha" /></Field>
          <Field label="Telefone"><input type="tel" className="input num" value={f.ecPhone} onChange={set("ecPhone")} autoComplete="tel" /></Field>
        </div>
      </fieldset>

      {error && <p className="rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700" role="alert">{error}</p>}
      <div className="flex gap-2">
        <button type="button" className="btn-secondary flex-1" onClick={onDone}>Cancelar</button>
        <button className="btn-primary flex-1">Salvar</button>
      </div>
    </form>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-500">{hint}</span>}
    </label>
  );
}

function Devices({ db }: { db: Db }) {
  return (
    <>
      <SectionTitle>Aparelhos conectados</SectionTitle>
      <ul className="card divide-y divide-ink-900/[0.06] p-0">
        {db.devices.map((d) => (
          <li key={d.id} className="flex items-start gap-3 px-4 py-3">
            <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-500" aria-hidden />
            <div className="min-w-0">
              <p className="text-[15px] font-semibold text-ink-900">{d.name}</p>
              <p className="text-sm text-ink-600">{d.metrics.join(", ")}</p>
              <p className="text-xs text-ink-500">Conectado desde {formatDate(d.connectedAt.slice(0, 10))}</p>
            </div>
          </li>
        ))}
        <li className="px-4 py-3 text-sm text-ink-500">
          Em breve: conectar pelo Apple Saúde (iPhone) e pelo Health Connect (Android).
        </li>
      </ul>
    </>
  );
}

function Toggle({ on, onChange, label, disabled }: { on: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${on ? "bg-brand-600" : "bg-ink-300"}`}
    >
      <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-[left] duration-200 ${on ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}

function Notifications({ db }: { db: Db }) {
  const notify = db.prefs?.notify ?? {};
  const toast = db.prefs?.toast !== false;
  return (
    <>
      <SectionTitle>Avisos</SectionTitle>
      <div className="card divide-y divide-ink-900/[0.06] p-0">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex-1">
            <p className="text-[15px] font-semibold text-ink-900">Aviso no topo da tela</p>
            <p className="text-sm text-ink-600">Quando chega um alerta novo do relógio ou do medidor.</p>
          </div>
          <Toggle on={toast} label="Aviso no topo da tela" onChange={(v) => updatePrefs((p) => { p.toast = v; })} />
        </div>
        {ALERT_PREFS.map((a) => {
          const on = a.locked || notify[a.kind] !== false;
          return (
            <div key={a.kind} className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1">
                <p className="text-[15px] text-ink-900">{a.label}</p>
                {a.locked && <p className="text-xs text-ink-500">Sempre ligado: pode indicar algo que precisa de médico.</p>}
              </div>
              <Toggle
                on={on}
                disabled={a.locked}
                label={a.label}
                onChange={(v) => updatePrefs((p) => { p.notify = { ...p.notify, [a.kind]: v }; })}
              />
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-ink-500">Desligar um aviso não esconde o alerta da tela inicial.</p>
    </>
  );
}

function Privacy({ db }: { db: Db }) {
  const router = useRouter();
  const active = db.shares.filter((s) => shareState(s) === "ativo").length;

  function download() {
    const url = URL.createObjectURL(exportData());
    const a = document.createElement("a");
    a.href = url;
    a.download = `elo-saude-meus-dados-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <>
      <SectionTitle>Privacidade e dados</SectionTitle>
      <div className="card divide-y divide-ink-900/[0.06] p-0">
        <Link href="/compartilhar" className="flex min-h-14 items-center gap-3 px-4 py-3 transition-colors hover:bg-white/60">
          <span className="flex-1">
            <span className="block text-[15px] font-semibold text-ink-900">Médicos com acesso</span>
            <span className="block text-sm text-ink-600">
              {active ? `${active} ${active === 1 ? "acesso ativo" : "acessos ativos"}. Veja ou revogue.` : "Nenhum acesso ativo agora."}
            </span>
          </span>
          <ChevronRight width={18} className="shrink-0 text-ink-400" />
        </Link>
        <button type="button" onClick={download} className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/60">
          <span className="flex-1">
            <span className="block text-[15px] font-semibold text-ink-900">Baixar meus dados</span>
            <span className="block text-sm text-ink-600">Arquivo com todo o seu histórico (JSON).</span>
          </span>
          <ChevronRight width={18} className="shrink-0 text-ink-400" />
        </button>
        <button
          type="button"
          className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-danger-50/60"
          onClick={async () => {
            if (!confirm("Apagar todo o seu histórico deste aparelho? Isso não pode ser desfeito.")) return;
            await resetDemo();
            router.push("/");
          }}
        >
          <span className="flex-1">
            <span className="block text-[15px] font-semibold text-danger-700">Apagar meus dados</span>
            <span className="block text-sm text-ink-600">Remove exames, acessos e conversa deste aparelho.</span>
          </span>
        </button>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-ink-500">
        Seu histórico fica salvo neste aparelho. Os laudos enviados são lidos por IA (Gemini, do Google) só para extrair os resultados. Envie apenas exames seus ou de quem te autorizou.
      </p>
    </>
  );
}
