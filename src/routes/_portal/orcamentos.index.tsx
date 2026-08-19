import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ChevronRight,
  Copy,
  FilePlus2,
  FileText,
  Lock,
  MoreVertical,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { DialogDuplicar } from "@/components/portal/documento/DialogDuplicar";
import { DialogNovoOrcamento } from "@/components/portal/documento/DialogNovoOrcamento";
import { KpiCard } from "@/components/portal/shared/KpiCard";
import { PageHeader } from "@/components/portal/shared/PageHeader";
import { Pill } from "@/components/portal/shared/StatusPill";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  brl,
  calcDocumentoTotal,
  diasParaExpirar,
  fmtDate,
  statusEfetivo,
  statusSimplificado,
  STATUS_SIMPLIFICADO_LABEL,
} from "@/lib/mock";
import type { Documento, StatusSimplificado } from "@/lib/mock";
import { filtrarDocumentos, usePermissoes } from "@/lib/permissoes";
import { dbStore } from "@/lib/stores/db";
import { useAbrirJanela } from "@/lib/stores/use-janelas";

export const Route = createFileRoute("/_portal/orcamentos/")({
  component: OrcamentosScreen,
});

/* Status exibido na listagem segue a convenção Sankhya:
   Pendente · Confirmado · Aguardando liberação */
const STATUS_OPTIONS: StatusSimplificado[] = ["PENDENTE", "CONFIRMADO", "AGUARDANDO_LIBERACAO"];

function StatusSimplificadoPill({ doc }: { doc: Documento }) {
  const st = statusSimplificado(doc);
  const tone = st === "CONFIRMADO" ? "emerald" : st === "AGUARDANDO_LIBERACAO" ? "sky" : "amber";
  return <Pill tone={tone}>{STATUS_SIMPLIFICADO_LABEL[st]}</Pill>;
}

function OrcamentosScreen() {
  const { perfil } = usePermissoes();
  const documentos = dbStore.useStore((s) => s.documentos);
  const abrir = useAbrirJanela();

  const [query, setQuery] = useState("");
  const [tipo, setTipo] = useState<"TODOS" | "ORCAMENTO" | "PEDIDO">("TODOS");
  const [statusFilter, setStatusFilter] = useState<"Todos" | StatusSimplificado>("Todos");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [novoAberto, setNovoAberto] = useState(false);
  const [duplicando, setDuplicando] = useState<Documento | null>(null);

  // Segregação: apenas documentos das empresas autorizadas do perfil
  const visiveis = useMemo(
    () => (perfil ? filtrarDocumentos(documentos, perfil) : []),
    [documentos, perfil],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const inicio = dataInicio ? new Date(dataInicio + "T00:00:00") : null;
    const fim = dataFim ? new Date(dataFim + "T23:59:59") : null;
    return visiveis
      .filter((d) => {
        if (tipo !== "TODOS" && d.tipo !== tipo) return false;
        if (statusFilter !== "Todos" && statusSimplificado(d) !== statusFilter) return false;
        if (inicio || fim) {
          const dt = new Date(d.dtNeg + "T00:00:00");
          if (inicio && dt < inicio) return false;
          if (fim && dt > fim) return false;
        }
        if (!q) return true;
        return (
          String(d.nunota).includes(q) ||
          String(d.numNota).includes(q) ||
          d.parceiro.toLowerCase().includes(q) ||
          d.vendedor.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.nunota - a.nunota);
  }, [visiveis, query, tipo, statusFilter, dataInicio, dataFim]);

  const totalGeral = filtered.reduce((acc, d) => acc + calcDocumentoTotal(d), 0);
  const aguardando = visiveis.filter((d) => statusEfetivo(d) === "AGUARDANDO_LIBERACAO").length;
  const expirando = visiveis.filter(
    (d) =>
      d.tipo === "ORCAMENTO" && statusEfetivo(d) === "ORCAMENTO_ABERTO" && diasParaExpirar(d) <= 3,
  ).length;

  const abrirDocumento = (d: Documento) =>
    abrir({
      id: `/orcamentos/${d.nunota}`,
      titulo: `${d.tipo === "ORCAMENTO" ? "Orçamento" : "Pedido"} ${d.nunota}`,
      icone: "documento",
    });

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="Portal de Vendas"
        subtitle="Documentos das empresas autorizadas do seu perfil, com regras da Central de Certificação."
        actions={
          <button
            data-tour="novo"
            onClick={() => setNovoAberto(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-700"
          >
            <FilePlus2 className="h-4 w-4" />
            Novo orçamento
          </button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Documentos listados" value={String(filtered.length)} />
        <KpiCard label="Valor total" value={brl(totalGeral)} />
        <KpiCard label="Aguard. liberação" value={String(aguardando)} tone="amber" />
        <KpiCard label="Expirando em ≤ 3 dias" value={String(expirando)} tone="rose" />
      </div>

      {/* Toolbar */}
      <div
        className="mb-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
        data-tour="filtros"
      >
        <div className="grid grid-cols-1 items-end gap-3 xl:grid-cols-[auto_minmax(0,1fr)_auto_auto_auto]">
          <ToggleGroup
            type="single"
            value={tipo}
            onValueChange={(v) => v && setTipo(v as typeof tipo)}
            className="justify-start rounded-lg bg-slate-100 p-1"
          >
            {(["TODOS", "ORCAMENTO", "PEDIDO"] as const).map((t) => (
              <ToggleGroupItem
                key={t}
                value={t}
                className="rounded-md px-3 py-1.5 text-xs font-medium data-[state=on]:bg-white data-[state=on]:text-green-900 data-[state=on]:shadow-sm"
              >
                {t === "TODOS" ? "Todos" : t === "ORCAMENTO" ? "Orçamentos" : "Pedidos"}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por NUNOTA, parceiro ou vendedor…"
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            />
          </div>
          <label className="flex flex-col gap-0.5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              Data Neg. de
            </span>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            />
          </label>
          <label className="flex flex-col gap-0.5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              Data Neg. até
            </span>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            />
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
          >
            <option value="Todos">Todos os status</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {STATUS_SIMPLIFICADO_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span>
            Exibindo {filtered.length} de {visiveis.length} documentos
          </span>
        </div>
      </div>

      {/* Tabela */}
      <div
        className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
        data-tour="tabela"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Nro. Único</th>
                <th className="px-4 py-3">Nro. Nota</th>
                <th className="px-4 py-3">Parceiro</th>
                <th className="px-4 py-3">TOP</th>
                <th className="px-4 py-3">Data Neg.</th>
                <th className="px-4 py-3 text-right">Valor Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((d) => {
                const st = statusEfetivo(d);
                return (
                  <tr
                    key={d.nunota}
                    onClick={() => abrirDocumento(d)}
                    className="group cursor-pointer transition-colors hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 font-mono text-slate-900">
                      <div className="flex items-center gap-2">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-slate-100 text-slate-500">
                          {st === "AGUARDANDO_LIBERACAO" ? (
                            <Lock className="h-4 w-4 text-amber-500" />
                          ) : (
                            <FileText className="h-4 w-4" />
                          )}
                        </span>
                        <span className="font-medium">{d.nunota}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono tabular-nums text-slate-700">
                      {/* NUMNOTA — número do documento, gerado no faturamento */}
                      {d.numNota > 0 ? d.numNota : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="min-w-0">
                        <div className="max-w-56 truncate font-medium text-slate-900">
                          {d.parceiro}
                        </div>
                        <div className="truncate text-xs text-slate-500">
                          {d.codParc} · {d.vendedor} · {d.codEmp}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div
                        className="max-w-52 truncate text-slate-700"
                        title={`${d.codTop} - ${d.top}`}
                      >
                        <span className="font-mono text-xs font-medium text-slate-500">
                          {d.codTop}
                        </span>
                        <span className="ml-1.5">{d.top}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{fmtDate(d.dtNeg)}</td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums text-slate-900">
                      {brl(calcDocumentoTotal(d))}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <StatusSimplificadoPill doc={d} />
                        {d.duplicadoDe != null && (
                          <Pill tone={d.precosAtualizados ? "emerald" : "slate"} dot={false}>
                            {d.precosAtualizados ? "Preços atualizados" : "Valores originais"}
                          </Pill>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700">
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => abrirDocumento(d)}>
                              <FileText className="h-4 w-4" /> Abrir
                            </DropdownMenuItem>
                            {/* Regra 6.3: pedidos não podem ser duplicados — opção só p/ orçamentos */}
                            {d.tipo === "ORCAMENTO" && (
                              <DropdownMenuItem onClick={() => setDuplicando(d)}>
                                <Copy className="h-4 w-4" /> Duplicar orçamento
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500" />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-14 text-center text-sm text-slate-500">
                    Nenhum documento encontrado com os filtros atuais.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <DialogNovoOrcamento open={novoAberto} onOpenChange={setNovoAberto} />
      <DialogDuplicar
        doc={duplicando}
        open={duplicando != null}
        onOpenChange={(v) => !v && setDuplicando(null)}
      />
    </div>
  );
}
