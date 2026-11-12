"use client";

import Link from "next/link";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { buildDoctorLink } from "@/lib/doctor";
import { absoluteUrl } from "@/lib/paths";
import { createShare } from "@/lib/store";
import { RECIPIENTS, SCOPE_LABELS, SCOPES, type RecipientKind } from "@/lib/types";
import { useAiEnabled } from "./AiStatus";
import { CheckIcon, ClinicIcon, ClipboardIcon, DoctorIcon, HospitalIcon, ShieldIcon } from "./icons";

const DURATIONS = [
  { hours: 1, label: "1 hora" },
  { hours: 24, label: "24 horas" },
  { hours: 168, label: "7 dias" },
  { hours: 720, label: "30 dias" },
  { hours: 2160, label: "90 dias" },
  { hours: 8760, label: "1 ano" },
];

const RECIPIENT_ICON = { medico: DoctorIcon, clinica: ClinicIcon, hospital: HospitalIcon } as const;

/** Prazo sugerido: consulta avulsa com médico; acompanhamento com clínica ou hospital. */
const DEFAULT_HOURS: Record<RecipientKind, number> = { medico: 24, clinica: 8760, hospital: 2160 };

/** Limite prático de um QR code legível pela câmera do celular. */
const QR_MAX_CHARS = 2300;

export function ShareForm() {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [kind, setKind] = useState<RecipientKind>("medico");
  const r = RECIPIENTS[kind];

  if (token) return <ShareResult key={token} token={token} onDone={() => setToken(null)} />;

  return (
    <form
      className="card space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const res = createShare({
          doctorName: String(f.get("doctorName") ?? ""),
          doctorCrm: String(f.get("doctorCrm") ?? ""),
          recipientKind: kind,
          scopes: f.getAll("scopes").map(String),
          hours: Number(f.get("hours")),
        });
        if ("error" in res) setError(res.error);
        else {
          setError(null);
          setToken(res.token);
        }
      }}
    >
      <fieldset>
        <legend className="label">Para quem</legend>
        {/* Três opções grandes, com ícone: fáceis de tocar no celular */}
        <div role="radiogroup" className="grid grid-cols-3 gap-2">
          {(Object.keys(RECIPIENTS) as RecipientKind[]).map((k) => {
            const Icon = RECIPIENT_ICON[k];
            const on = kind === k;
            return (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setKind(k)}
                className={`flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-2xl text-sm font-semibold transition-[background-color,box-shadow,color] duration-200 ${
                  on ? "bg-brand-600 text-white shadow-[0_8px_20px_-10px_rgb(31_94_76/0.8)]" : "bg-ink-900/[0.04] text-ink-700 hover:bg-ink-900/[0.07]"
                }`}
              >
                <Icon width={24} weight={on ? "fill" : "regular"} />
                {RECIPIENTS[k].label}
              </button>
            );
          })}
        </div>
        {kind !== "medico" && (
          <p className="mt-2 text-sm leading-snug text-ink-600">
            O acesso fica com a instituição: qualquer médico que te atender lá vê o mesmo histórico.
          </p>
        )}
      </fieldset>

      {/* Nome e registro empilhados no celular; lado a lado no tablet */}
      <div className="grid gap-3 md:grid-cols-3">
        <label className="block md:col-span-2">
          <span className="label">{r.nameLabel}</span>
          <input key={`n${kind}`} name="doctorName" className="input" placeholder={r.namePlaceholder} required maxLength={100} />
        </label>
        <label className="block">
          <span className="label">
            {r.idLabel} <span className="font-normal text-ink-500">(opcional)</span>
          </span>
          <input key={`c${kind}`} name="doctorCrm" className="input" placeholder={r.idPlaceholder} maxLength={30} />
        </label>
      </div>

      <fieldset>
        <legend className="label">O que compartilhar</legend>
        {/* Lista única com marcação à direita, como nos ajustes do celular */}
        <div className="well divide-y divide-ink-900/[0.06] overflow-hidden">
          {SCOPES.map((s) => (
            <label key={s} className="flex min-h-12 cursor-pointer items-center gap-3 px-3.5 text-[15px] text-ink-900">
              <span className="flex-1">{SCOPE_LABELS[s]}</span>
              <input type="checkbox" name="scopes" value={s} defaultChecked className="peer sr-only" />
              <span
                aria-hidden
                className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-transparent ring-1 ring-ink-900/15 transition-colors peer-checked:bg-brand-600 peer-checked:text-white peer-checked:ring-brand-600 peer-focus-visible:outline-2 peer-focus-visible:outline-brand-500"
              >
                <CheckIcon width={14} />
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset key={kind}>
        <legend className="label">Por quanto tempo</legend>
        <div className="flex flex-wrap gap-2">
          {DURATIONS.map((d) => (
            <label key={d.hours} className="cursor-pointer">
              <input type="radio" name="hours" value={d.hours} defaultChecked={d.hours === DEFAULT_HOURS[kind]} className="peer sr-only" />
              <span className="inline-flex min-h-10 items-center rounded-full bg-ink-900/[0.04] px-4 text-sm font-semibold text-ink-700 transition-colors hover:bg-ink-900/[0.07] peer-checked:bg-brand-600 peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-brand-500">
                {d.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex gap-3 rounded-2xl bg-brand-50 p-3 text-sm leading-relaxed text-ink-700">
        <ShieldIcon className="h-5 w-5 shrink-0 text-brand-700" />
        <p>
          Ao criar o acesso, você autoriza {kind === "medico" ? "este médico" : kind === "clinica" ? "esta clínica e os médicos dela" : "este hospital e os médicos dele"} a ver os dados marcados até o prazo escolhido, para fins de cuidado
          com a sua saúde (LGPD, art. 11). Você pode revogar quando quiser, e cada acesso fica registrado.
        </p>
      </div>

      {error && <p className="rounded-xl bg-danger-50 px-3 py-2 text-sm text-danger-700 ring-1 ring-danger-200">{error}</p>}
      <button className="btn-primary w-full">Autorizar e gerar link</button>
    </form>
  );
}

function ShareResult({ token, onDone }: { token: string; onDone: () => void }) {
  const ai = useAiEnabled();
  const [url, setUrl] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    buildDoctorLink(token).then(async (link) => {
      if (!link || cancelled) return;
      const full = absoluteUrl(link.path);
      setUrl(full);
      if (full.length <= QR_MAX_CHARS) setQr(await QRCode.toDataURL(full, { width: 260, margin: 1, errorCorrectionLevel: "L", color: { dark: "#10372d" } }));
    });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const canShare = typeof navigator !== "undefined" && "share" in navigator;

  return (
    <div className="card text-center">
      <p className="flex items-center justify-center gap-1.5 font-serif text-xl font-semibold text-brand-800"><CheckIcon width={20} height={20} strokeWidth={2.4} /> Acesso criado</p>
      {!url ? (
        <div className="py-8">
          <ClipboardIcon className="mx-auto h-8 w-8 animate-pulse text-brand-600" />
          <p className="mt-2 text-sm text-ink-600">{ai ? "Preparando o resumo por IA para o médico…" : "Preparando o link…"}</p>
        </div>
      ) : (
        <>
          <p className="mt-1 text-sm text-ink-500">
            {qr ? "Mostre o QR code ao médico ou envie o link." : "Envie o link ao médico (por WhatsApp ou e-mail)."}
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {qr && <img src={qr} alt="QR code do link de acesso" className="mx-auto mt-3 h-52 w-52" />}
          <div className="mt-3 flex flex-col gap-2">
            {canShare && (
              <button
                type="button"
                className="btn-primary"
                onClick={() => navigator.share({ title: "Histórico de saúde", text: "Acesso ao meu histórico de saúde", url }).catch(() => undefined)}
              >
                Enviar link
              </button>
            )}
            <button
              type="button"
              className="btn-secondary"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(url);
                  setCopied(true);
                } catch {
                  window.prompt("Copie o link:", url);
                }
              }}
            >
              {copied ? "Link copiado" : "Copiar link"}
            </button>
            <Link href={`/medico/?t=${encodeURIComponent(token)}`} target="_blank" className="btn-secondary">
              Abrir visão do médico aqui
            </Link>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-ink-500">
            O link leva uma cópia compactada só dos dados autorizados e deixa de abrir no fim do prazo. Até lá, quem tiver o link
            consegue abrir: envie só para o médico.
          </p>
        </>
      )}
      <button type="button" className="mt-2 inline-flex min-h-11 items-center px-2 text-sm font-semibold text-ink-600" onClick={onDone}>
        Criar outro acesso
      </button>
    </div>
  );
}
