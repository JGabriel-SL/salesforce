import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, ChevronRight, FileText } from "lucide-react";
import { Pedido, PedidoStatus, brl, calcPedidoTotal, fmtDate } from "@/lib/sankhya-mock";

interface Props {
  pedidos: Pedido[];
  onSelect: (nunota: number) => void;
}

const STATUS_OPTIONS: (PedidoStatus | "Todos")[] = [
  "Todos",
  "Confirmado",
  "Pendente",
  "Faturado",
  "Cancelado",
];

function StatusPill({ status }: { status: PedidoStatus }) {
  const map: Record<PedidoStatus, string> = {
    Confirmado: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    Pendente: "bg-amber-50 text-amber-700 ring-amber-200",
    Faturado: "bg-sky-50 text-sky-700 ring-sky-200",
    Cancelado: "bg-rose-50 text-rose-700 ring-rose-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${map[status]}`}
    >
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
}

export function PedidosList({ pedidos, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number]>("Todos");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const inicio = dataInicio ? new Date(dataInicio + "T00:00:00") : null;
    const fim = dataFim ? new Date(dataFim + "T23:59:59") : null;
    return pedidos.filter((p) => {
      if (statusFilter !== "Todos" && p.status !== statusFilter) return false;
      if (inicio || fim) {
        const d = new Date(p.dtNeg + "T00:00:00");
        if (inicio && d < inicio) return false;
        if (fim && d > fim) return false;
      }
      if (!q) return true;
      return (
        String(p.nunota).includes(q) ||
        p.parceiro.toLowerCase().includes(q) ||
        p.vendedor.toLowerCase().includes(q)
      );
    });
  }, [pedidos, query, statusFilter, dataInicio, dataFim]);

  const totalGeral = filtered.reduce((acc, p) => acc + calcPedidoTotal(p.itens), 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="mb-6 flex flex-col gap-1">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
          Portal de Vendas
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Notas e Pedidos
        </h1>
        <p className="text-sm text-slate-500">
          Consulte, filtre e abra pedidos para edição inline no padrão Sankhya.
        </p>
      </div>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiCard label="Pedidos listados" value={String(filtered.length)} />
        <KpiCard label="Valor total" value={brl(totalGeral)} />
        <KpiCard
          label="Pendentes"
          value={String(filtered.filter((p) => p.status === "Pendente").length)}
        />
      </div>

      {/* Toolbar */}
      <div className="mb-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
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
            onChange={(e) => setStatusFilter(e.target.value as PedidoStatus | "Todos")}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s === "Todos" ? "Todos os status" : s}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span>
            Exibindo {filtered.length} de {pedidos.length} pedidos
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Nro. Único</th>
                <th className="px-4 py-3">Parceiro</th>
                <th className="px-4 py-3">TOP</th>
                <th className="px-4 py-3">Data Neg.</th>
                <th className="px-4 py-3 text-right">Valor Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => (
                <tr
                  key={p.nunota}
                  onClick={() => onSelect(p.nunota)}
                  className="group cursor-pointer transition-colors hover:bg-slate-50"
                >
                  <td className="px-4 py-3 font-mono text-slate-900">
                    <div className="flex items-center gap-2">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-slate-100 text-slate-500">
                        <FileText className="h-4 w-4" />
                      </span>
                      <span className="font-medium">{p.nunota}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="min-w-0">
                      <div className="truncate font-medium text-slate-900">{p.parceiro}</div>
                      <div className="truncate text-xs text-slate-500">
                        {p.codParc} · {p.vendedor}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div
                      className="max-w-[220px] truncate text-slate-700"
                      title={`${p.codTop} - ${p.top}`}
                    >
                      <span className="font-mono text-xs font-medium text-slate-500">
                        {p.codTop}
                      </span>
                      <span className="ml-1.5 text-slate-700">{p.top}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{fmtDate(p.dtNeg)}</td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums text-slate-900">
                    {brl(calcPedidoTotal(p.itens))}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={p.status} />
                  </td>
                  <td className="px-4 py-3 text-right text-slate-400 group-hover:text-slate-700">
                    <ChevronRight className="ml-auto h-4 w-4" />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-14 text-center text-sm text-slate-500">
                    Nenhum pedido encontrado com os filtros atuais.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-slate-900">{value}</p>
    </div>
  );
}
