"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ChatIcon, CheckIcon, FileIcon, ShieldIcon } from "@/components/icons";
import { SectionTitle, Skeleton } from "@/components/ui";
import { resetChat } from "@/lib/chat";
import { shareState } from "@/lib/share";
import { exportData, resetDemo, revokeShare, useDb } from "@/lib/store";

type Pending = "chat" | "acessos" | "tudo" | null;

/**
 * Gerenciar meus dados: cada ação num cartão separado. As que apagam ou
 * revogam pedem confirmação numa janela antes de agir.
 */
export default function DadosPage() {
  const db = useDb();
  const router = useRouter();
  const [pending, setPending] = useState<Pending>(null);
  const [done, setDone] = useState<string | null>(null);
  if (!db) return <Skeleton lines={4} />;

  const active = db.shares.filter((s) => shareState(s) === "ativo");
  const counts = `${db.documents.length} laudos, ${db.labResults.length} resultados, ${db.encounters.length} consultas e ${db.vaccines.length} vacinas`;

  function download() {
    const url = URL.createObjectURL(exportData());
    const a = document.createElement("a");
    a.href = url;
    a.download = `elo-saude-meus-dados-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setDone("Arquivo baixado.");
  }

  return (
    <div>
      <h1 className="page-title">Gerenciar meus dados</h1>
      <p className="mt-1 text-[15px] text-ink-600">Seu histórico fica salvo neste aparelho: {counts}.</p>

      {done && (
        <p role="status" className="mt-4 flex items-center gap-2 rounded-2xl bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-800">
          <CheckIcon width={16} /> {done}
        </p>
      )}

      <SectionTitle>Seus dados</SectionTitle>
      <ActionCard
        icon={<FileIcon width={22} />}
        title="Baixar meus dados"
        text="Um arquivo com todo o seu histórico, para guardar ou levar para outro serviço."
        action="Baixar"
        onClick={download}
      />

      <SectionTitle>Remover</SectionTitle>
      <div className="space-y-3">
        <ActionCard
          icon={<ShieldIcon width={22} />}
          title="Revogar todos os acessos"
          text={active.length ? `${active.length} ${active.length === 1 ? "acesso ativo" : "acessos ativos"} de médicos, clínicas ou hospitais.` : "Nenhum acesso ativo agora."}
          action="Revogar"
          danger
          disabled={!active.length}
          onClick={() => setPending("acessos")}
        />
        <ActionCard
          icon={<ChatIcon width={22} />}
          title="Apagar conversa com o Elo"
          text="Remove as mensagens. Seus exames e medições continuam salvos."
          action="Apagar"
          danger
          onClick={() => setPending("chat")}
        />
      </div>

      {/* Zona de perigo: separada do resto, com aviso explícito */}
      <SectionTitle>Zona de perigo</SectionTitle>
      <div className="card bg-danger-50/70">
        <p className="text-[15px] font-semibold text-danger-800">Apagar todos os meus dados</p>
        <p className="mt-1 text-sm text-ink-700">
          Remove exames, laudos, medições, acessos e a conversa deste aparelho. Antes, se quiser, baixe uma cópia.
        </p>
        <button type="button" className="btn mt-3 w-full bg-white text-danger-700 shadow-glass hover:bg-danger-50" onClick={() => setPending("tudo")}>
          Apagar todos os meus dados
        </button>
      </div>

      <ConfirmDialog
        open={pending === "acessos"}
        title="Revogar todos os acessos?"
        confirmLabel="Revogar acessos"
        onCancel={() => setPending(null)}
        onConfirm={() => {
          for (const s of active) revokeShare(s.token);
          setPending(null);
          setDone("Acessos revogados.");
        }}
      >
        Quem tem o link deixa de ver seu histórico neste aparelho. Para compartilhar de novo, será preciso criar um novo acesso.
      </ConfirmDialog>

      <ConfirmDialog
        open={pending === "chat"}
        title="Apagar a conversa?"
        confirmLabel="Apagar conversa"
        onCancel={() => setPending(null)}
        onConfirm={() => {
          resetChat();
          setPending(null);
          setDone("Conversa apagada.");
        }}
      >
        As mensagens com o Elo serão removidas. Isso não pode ser desfeito.
      </ConfirmDialog>

      <ConfirmDialog
        open={pending === "tudo"}
        title="Apagar todos os seus dados?"
        confirmLabel="Apagar tudo"
        onCancel={() => setPending(null)}
        onConfirm={async () => {
          await resetDemo();
          setPending(null);
          router.push("/");
        }}
      >
        <p>Serão removidos {counts}, além dos acessos e da conversa.</p>
        <p className="mt-2 font-semibold text-danger-700">Isso não pode ser desfeito.</p>
      </ConfirmDialog>
    </div>
  );
}

function ActionCard({
  icon,
  title,
  text,
  action,
  onClick,
  danger,
  disabled,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  action: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="card flex items-center gap-3">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${danger ? "bg-danger-100 text-danger-700" : "bg-brand-50 text-brand-700"}`}>
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold text-ink-900">{title}</p>
        <p className="text-sm text-ink-600">{text}</p>
      </div>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`btn shrink-0 px-4 ${danger ? "bg-white text-danger-700 shadow-glass hover:bg-danger-50" : "btn-secondary"}`}
      >
        {action}
      </button>
    </div>
  );
}
