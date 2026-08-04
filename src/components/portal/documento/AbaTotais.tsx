import { useState } from "react";
import { Percent, Wallet } from "lucide-react";
import { NumberCell } from "@/components/portal/shared/CodedFieldRow";
import { Pill } from "@/components/portal/shared/StatusPill";
import { brl, calcDocumentoTotal, calcSubtotalBruto, calcTotalItens } from "@/lib/mock";
import type { Documento } from "@/lib/mock";
import { usePermissoes } from "@/lib/permissoes";
import { atualizarCabecalho, dbStore } from "@/lib/stores/db";
import type { RegrasDocumento } from "./regras";

function CommitNumber({
  value,
  onCommit,
  disabled,
  suffix,
}: {
  value: number;
  onCommit: (v: number) => void;
  disabled?: boolean;
  suffix?: string;
}) {
  const [local, setLocal] = useState<number | null>(null);
  const commit = () => {
    if (local != null && local !== value) onCommit(local);
    setLocal(null);
  };
  return (
    <div onBlur={commit} onKeyDown={(e) => e.key === "Enter" && commit()}>
      <NumberCell
        value={local ?? value}
        onChange={setLocal}
        disabled={disabled}
        step={0.5}
        min={0}
        max={100}
        suffix={suffix}
        width="w-24"
      />
    </div>
  );
}

/** Aba de totais: desconto de cabeçalho (3º ponto de desconto) e comissão. */
export function AbaTotais({ doc, regras }: { doc: Documento; regras: RegrasDocumento }) {
  const { usuario } = usePermissoes();
  const regrasLimite = dbStore.useStore((s) => s.regrasLimite);
  const comissaoPadrao = regrasLimite.find((r) => r.eventoTipo === "COMISSAO_REDUZIDA")?.valor ?? 5;

  const subtotalBruto = calcSubtotalBruto(doc.itens);
  const totalItens = calcTotalItens(doc.itens);
  const descontoItens = subtotalBruto - totalItens;
  const total = calcDocumentoTotal(doc);
  const descontoCabecalho = totalItens - total;

  const setDescontoCab = (v: number) => {
    if (!usuario) return;
    atualizarCabecalho(
      doc.nunota,
      { descontoCabecalhoPct: v },
      usuario,
      "Desconto da nota (totais)",
      `${doc.descontoCabecalhoPct}%`,
      `${v}%`,
    );
  };

  const setComissao = (v: number) => {
    if (!usuario) return;
    atualizarCabecalho(
      doc.nunota,
      { comissaoPct: v, comissaoReduzida: v < comissaoPadrao },
      usuario,
      "Comissão %",
      `${doc.comissaoPct}%`,
      `${v}%`,
    );
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-green-50 text-green-600">
            <Wallet className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900">Totalizadores</p>
            <p className="text-xs text-slate-500">Descontos aplicados em itens e no cabeçalho.</p>
          </div>
        </div>
        <dl className="space-y-2.5 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-slate-500">Subtotal (bruto)</dt>
            <dd className="tabular-nums text-slate-900">{brl(subtotalBruto)}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-slate-500">Descontos por item</dt>
            <dd className="tabular-nums text-slate-500">- {brl(descontoItens)}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-slate-500">Desconto da nota (aba de totais)</dt>
            <dd className="flex items-center gap-2">
              <CommitNumber
                value={doc.descontoCabecalhoPct}
                onCommit={setDescontoCab}
                disabled={!regras.podeEditar}
                suffix="%"
              />
              <span className="w-24 text-right tabular-nums text-slate-500">
                - {brl(descontoCabecalho)}
              </span>
            </dd>
          </div>
          <div className="mt-2 flex items-baseline justify-between border-t border-slate-100 pt-3">
            <dt className="font-medium text-slate-600">Valor total do documento</dt>
            <dd className="text-xl font-semibold tabular-nums text-slate-900">{brl(total)}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-amber-50 text-amber-600">
            <Percent className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900">Comissão do vendedor</p>
            <p className="text-xs text-slate-500">
              Padrão {comissaoPadrao}% — abaixo disso gera evento de liberação.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CommitNumber
              value={doc.comissaoPct}
              onCommit={setComissao}
              disabled={!regras.podeEditar}
              suffix="%"
            />
            {doc.comissaoReduzida && <Pill tone="amber">Comissão reduzida</Pill>}
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wider text-slate-400">Valor estimado</p>
            <p className="font-semibold tabular-nums text-slate-900">
              {brl((total * doc.comissaoPct) / 100)}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
