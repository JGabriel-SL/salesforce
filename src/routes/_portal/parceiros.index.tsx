import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Building2, ChevronRight, Search, UserPlus } from "lucide-react";
import { KpiCard } from "@/components/portal/shared/KpiCard";
import { PageHeader } from "@/components/portal/shared/PageHeader";
import { Pill } from "@/components/portal/shared/StatusPill";
import { Progress } from "@/components/ui/progress";
import { brl, fmtDate } from "@/lib/mock";
import { dadosEmpresaAutorizados, filtrarParceiros, usePermissoes } from "@/lib/permissoes";
import { dbStore } from "@/lib/stores/db";
import { useAbrirJanela } from "@/lib/stores/use-janelas";

export const Route = createFileRoute("/_portal/parceiros/")({
  component: ParceirosScreen,
});

function ParceirosScreen() {
  const { perfil } = usePermissoes();
  const parceiros = dbStore.useStore((s) => s.parceiros);
  const abrir = useAbrirJanela();
  const [query, setQuery] = useState("");

  // Cadastro único, visão segregada: só parceiros com dados em empresas autorizadas
  const visiveis = useMemo(
    () => (perfil ? filtrarParceiros(parceiros, perfil) : []),
    [parceiros, perfil],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return visiveis;
    return visiveis.filter(
      (p) =>
        p.codParc.toLowerCase().includes(q) ||
        p.razaoSocial.toLowerCase().includes(q) ||
        p.nomeFantasia.toLowerCase().includes(q) ||
        p.cnpj.includes(q) ||
        p.cidade.toLowerCase().includes(q),
    );
  }, [visiveis, query]);

  const inadimplentes = visiveis.filter((p) => p.inadimplente).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="Parceiros"
        subtitle="Cadastro único do grupo — informações segregadas por empresa autorizada."
        actions={
          <button
            onClick={() =>
              abrir({ id: "/flow", titulo: "Flow — Cadastro de Parceiros", icone: "flow" })
            }
            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-700"
          >
            <UserPlus className="h-4 w-4" />
            Solicitar novo parceiro
          </button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <KpiCard label="Parceiros visíveis" value={String(visiveis.length)} icon={Building2} />
        <KpiCard
          label="Inadimplentes"
          value={String(inadimplentes)}
          tone="rose"
          hint="Bloqueiam faturamento até liberação"
        />
        <KpiCard
          label="Empresas do perfil"
          value={perfil?.empresasAutorizadas.join(" · ") ?? "—"}
        />
      </div>

      <div className="mb-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por código, razão social, CNPJ ou cidade…"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
          />
        </div>
      </div>

      <div
        className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
        data-tour="tabela-parceiros"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Parceiro</th>
                <th className="px-4 py-3">Cidade/UF</th>
                <th className="px-4 py-3">Empresas</th>
                <th className="px-4 py-3">Crédito (empresas autorizadas)</th>
                <th className="px-4 py-3">Última compra</th>
                <th className="px-4 py-3">Situação</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => {
                const dados = perfil ? dadosEmpresaAutorizados(p, perfil) : [];
                const limite = dados.reduce((a, d) => a + d.limiteCredito, 0);
                const usado = dados.reduce((a, d) => a + d.creditoUtilizado, 0);
                const pct = limite > 0 ? Math.min(100, (usado / limite) * 100) : 0;
                return (
                  <tr
                    key={p.codParc}
                    onClick={() =>
                      abrir({
                        id: `/parceiros/${p.codParc}`,
                        titulo: p.nomeFantasia,
                        icone: "parceiro",
                      })
                    }
                    className="group cursor-pointer transition-colors hover:bg-slate-50"
                  >
                    <td className="px-4 py-3">
                      <div className="min-w-0">
                        <div className="max-w-64 truncate font-medium text-slate-900">
                          {p.razaoSocial}
                        </div>
                        <div className="truncate text-xs text-slate-500">
                          {p.codParc} · {p.cnpj}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {p.cidade}/{p.uf}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {dados.map((d) => (
                          <span
                            key={d.codEmp}
                            className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-600"
                          >
                            {d.codEmp}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="w-44">
                        <div className="mb-1 flex justify-between text-[11px] tabular-nums text-slate-500">
                          <span>{brl(usado)}</span>
                          <span>{brl(limite)}</span>
                        </div>
                        <Progress value={pct} className="h-1.5" />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {p.ultimaCompra ? fmtDate(p.ultimaCompra) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {p.inadimplente ? (
                        <Pill tone="rose">Inadimplente</Pill>
                      ) : (
                        <Pill tone="emerald">Regular</Pill>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-400 group-hover:text-slate-700">
                      <ChevronRight className="ml-auto h-4 w-4" />
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-14 text-center text-sm text-slate-500">
                    Nenhum parceiro encontrado.
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
