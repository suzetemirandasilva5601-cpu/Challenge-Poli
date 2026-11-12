import Link from "next/link";
import { Uploader } from "@/components/Uploader";

export default function EnviarPage() {
  return (
    <div>
      <h1 className="page-title">Enviar exame</h1>
      <p className="mt-1 text-sm text-ink-600">
        Fotografe um laudo em papel ou envie o PDF do laboratório. A IA lê cada resultado com a faixa de referência, e você confere antes de salvar.
      </p>
      {/* Evita confundir: aparelhos não se conectam aqui */}
      <p className="mb-4 mt-2 text-sm text-ink-600">
        Quer conectar um relógio, anel ou medidor de pressão?{" "}
        <Link href="/wearables#aparelhos" className="font-semibold text-brand-700 underline">
          Vá em Sinais
        </Link>
        .
      </p>
      <Uploader />
    </div>
  );
}
