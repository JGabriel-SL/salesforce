import { History, Truck } from "lucide-react";
import { Pill } from "@/components/portal/shared/StatusPill";
import { brl, fmtDate, fmtDateTime } from "@/lib/mock";
import type { Documento } from "@/lib/mock";
import { dbStore } from "@/lib/stores/db";

/* ── Transporte (TSIRF) ──────────────────────────────────── */
export function AbaTransporte({ doc }: { doc: Documento }) {
  const transportes = dbStore.useStore((s) => s.transportes);
  const t = transportes.find((x) => x.nunota === doc.nunota);
  if (!t)
    return (
      <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
        Nenhum registro de transporte para este documento.
      </p>
    );
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-sky-50 text-sky-600">
          <Truck className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-900">{t.transportadora}</p>
          <p className="text-xs text-slate-500">Placa {t.placa}</p>
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-xs uppercase tracking-wider text-slate-500">Volumes</dt>
          <dd className="mt-0.5 font-medium text-slate-900">{t.volumes}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider text-slate-500">Peso (kg)</dt>
          <dd className="mt-0.5 font-medium text-slate-900">{t.pesoKg}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider text-slate-500">Embarque</dt>
          <dd className="mt-0.5 font-medium text-slate-900">{fmtDate(t.dtEmbarque)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider text-slate-500">Situação</dt>
          <dd className="mt-0.5">
            <Pill
              tone={
                t.situacao === "Entregue"
                  ? "emerald"
                  : t.situacao === "Em Transporte"
                    ? "blue"
                    : t.situacao === "Faturado"
                      ? "sky"
                      : "amber"
              }
            >
              {t.situacao}
            </Pill>
          </dd>
        </div>
      </dl>
    </div>
  );
}

/* ── Financeiro ──────────────────────────────────────────── */
export function AbaFinanceiro({ doc }: { doc: Documento }) {
  const financeiro = dbStore.useStore((s) => s.financeiro);
  const titulos = financeiro.filter((f) => f.nunota === doc.nunota);
  if (titulos.length === 0)
    return (
      <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
        Nenhum título financeiro para este documento
        {doc.tipo === "ORCAMENTO" ? " — títulos são gerados no faturamento." : "."}
      </p>
    );
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3">Parcela</th>
              <th className="px-4 py-3 text-right">Valor</th>
              <th className="px-4 py-3">Vencimento</th>
              <th className="px-4 py-3">Pagamento</th>
              <th className="px-4 py-3">Situação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {titulos.map((f) => (
              <tr key={f.parcela}>
                <td className="px-4 py-3 font-medium text-slate-900">
                  {f.parcela}/{titulos.length}
                </td>
                <td className="px-4 py-3 text-right font-medium tabular-nums text-slate-900">
                  {brl(f.valor)}
                </td>
                <td className="px-4 py-3 text-slate-700">{fmtDate(f.dtVencimento)}</td>
                <td className="px-4 py-3 text-slate-700">
                  {f.dtPagamento ? fmtDate(f.dtPagamento) : "—"}
                </td>
                <td className="px-4 py-3">
                  <Pill
                    tone={
                      f.situacao === "Pago"
                        ? "emerald"
                        : f.situacao === "Vencido"
                          ? "rose"
                          : "amber"
                    }
                  >
                    {f.situacao}
                  </Pill>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Histórico de alterações (quem alterou o quê) ────────── */
export function AbaHistorico({ doc }: { doc: Documento }) {
  const historico = dbStore.useStore((s) => s.historico);
  const entradas = historico
    .filter((h) => h.nunota === doc.nunota)
    .sort((a, b) => b.dataHora.localeCompare(a.dataHora));

  if (entradas.length === 0)
    return (
      <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
        Nenhuma alteração registrada para este documento.
      </p>
    );

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-slate-500">
          <History className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-900">Histórico de alterações</p>
          <p className="text-xs text-slate-500">
            Registro automático de todas as ações realizadas no documento.
          </p>
        </div>
      </div>
      <ol className="relative ml-3 space-y-5 border-l border-slate-200 pl-6">
        {entradas.map((h) => (
          <li key={h.id} className="relative">
            <span className="absolute -left-[31px] top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-green-500 ring-1 ring-green-200" />
            <p className="text-sm font-medium text-slate-900">{h.acao}</p>
            {h.campo && (
              <p className="mt-0.5 text-xs text-slate-500">
                <span className="font-medium text-slate-600">{h.campo}</span>
                {h.de != null && h.para != null && (
                  <>
                    : <span className="line-through">{h.de}</span> →{" "}
                    <span className="font-medium text-slate-700">{h.para}</span>
                  </>
                )}
              </p>
            )}
            <p className="mt-0.5 text-[11px] text-slate-400">
              {h.usuario} · {fmtDateTime(h.dataHora)}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
