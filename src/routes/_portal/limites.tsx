import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Check, ExternalLink, Settings2, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";
import { KpiCard } from "@/components/portal/shared/KpiCard";
import { PageHeader } from "@/components/portal/shared/PageHeader";
import { EventoStatusPill, Pill } from "@/components/portal/shared/StatusPill";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { brl, calcDocumentoTotal, EVENTO_LABEL, fmtDateTime, statusEfetivo } from "@/lib/mock";
import { filtrarDocumentos, usePermissoes } from "@/lib/permissoes";
import { atualizarRegraLimite, dbStore, resolverEvento } from "@/lib/stores/db";
import { useAbrirJanela } from "@/lib/stores/use-janelas";

export const Route = createFileRoute("/_portal/limites")({
  component: LimitesScreen,
});

function LimitesScreen() {
  const { usuario, perfil } = usePermissoes();
  const documentos = dbStore.useStore((s) => s.documentos);
  const regras = dbStore.useStore((s) => s.regrasLimite);
  const abrir = useAbrirJanela();

  const docsComEventos = useMemo(
    () =>
      (perfil ? filtrarDocumentos(documentos, perfil) : []).filter(
        (d) => statusEfetivo(d) === "AGUARDANDO_LIBERACAO" && d.eventos.length > 0,
      ),
    [documentos, perfil],
  );
  const pendentes = docsComEventos.flatMap((d) =>
    d.eventos.filter((e) => e.status === "PENDENTE").map((e) => ({ doc: d, evento: e })),
  );

  const decidir = (nunota: number, eventoId: string, decisao: "LIBERADO" | "RECUSADO") => {
    if (!usuario) return;
    resolverEvento(nunota, eventoId, decisao, usuario);
    toast(decisao === "LIBERADO" ? "Evento liberado" : "Evento recusado", {
      description: `Documento ${nunota}`,
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="Liberação de Limites"
        subtitle="Fila de eventos de bloqueio e configuração das regras da Central de Certificação."
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <KpiCard
          label="Documentos bloqueados"
          value={String(docsComEventos.length)}
          icon={ShieldCheck}
          tone="amber"
        />
        <KpiCard label="Eventos pendentes" value={String(pendentes.length)} tone="rose" />
        <KpiCard
          label="Seu papel"
          value={perfil?.podeAprovarLiberacoes ? "Aprovador" : "Consulta"}
          hint={
            perfil?.podeAprovarLiberacoes
              ? "Pode liberar/recusar eventos"
              : "Acompanhe o andamento das solicitações"
          }
        />
      </div>

      <Tabs defaultValue="consulta">
        <TabsList className="mb-4 h-auto rounded-lg bg-green-100 p-1 text-green-700">
          <TabsTrigger
            value="consulta"
            className="rounded-md px-3 py-1.5 text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-green-900 data-[state=active]:shadow-sm"
          >
            Consulta
          </TabsTrigger>
          <TabsTrigger
            value="configuracao"
            className="rounded-md px-3 py-1.5 text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-green-900 data-[state=active]:shadow-sm"
          >
            Configuração
          </TabsTrigger>
        </TabsList>

        {/* Consulta — fila de liberação */}
        <TabsContent value="consulta" className="space-y-4">
          {docsComEventos.length === 0 && (
            <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
              Nenhum documento aguardando liberação nas empresas do seu perfil. 🎉
            </p>
          )}
          {docsComEventos.map((d) => (
            <section
              key={d.nunota}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
            >
              <header className="flex flex-wrap items-center gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900">
                    {d.tipo === "ORCAMENTO" ? "Orçamento" : "Pedido"} {d.nunota} · {d.parceiro}
                  </p>
                  <p className="text-xs text-slate-500">
                    {d.codEmp} · Vendedor {d.vendedor} · Total {brl(calcDocumentoTotal(d))}
                  </p>
                </div>
                <button
                  onClick={() =>
                    abrir({
                      id: `/orcamentos/${d.nunota}`,
                      titulo: `Orçamento ${d.nunota}`,
                      icone: "documento",
                    })
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
                >
                  Abrir documento <ExternalLink className="h-3 w-3" />
                </button>
              </header>
              <ul className="divide-y divide-slate-100">
                {d.eventos.map((ev) => (
                  <li key={ev.id} className="flex items-center gap-4 px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900">{EVENTO_LABEL[ev.tipo]}</p>
                      <p className="truncate text-xs text-slate-500">{ev.descricao}</p>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        Solicitado em {fmtDateTime(ev.solicitadoEm)}
                        {ev.resolvidoPor &&
                          ` · ${ev.status === "LIBERADO" ? "liberado" : "recusado"} por ${ev.resolvidoPor}`}
                      </p>
                    </div>
                    <EventoStatusPill status={ev.status} />
                    {perfil?.podeAprovarLiberacoes && ev.status === "PENDENTE" && (
                      <div className="flex shrink-0 gap-1.5">
                        <button
                          onClick={() => decidir(d.nunota, ev.id, "LIBERADO")}
                          className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
                        >
                          <Check className="h-3.5 w-3.5" /> Liberar
                        </button>
                        <button
                          onClick={() => decidir(d.nunota, ev.id, "RECUSADO")}
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-700 transition-colors hover:bg-rose-100"
                        >
                          <X className="h-3.5 w-3.5" /> Recusar
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </TabsContent>

        {/* Configuração — regras editáveis */}
        <TabsContent value="configuracao">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <header className="flex items-center gap-2 border-b border-slate-100 px-5 py-3">
              <Settings2 className="h-4 w-4 text-slate-400" />
              <p className="text-sm font-semibold text-slate-900">Regras de liberação</p>
              {!perfil?.podeConfigurarLimites && (
                <Pill tone="slate">Somente leitura — exclusivo do Administrador</Pill>
              )}
            </header>
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3">Evento</th>
                  <th className="px-5 py-3">Parâmetro</th>
                  <th className="px-5 py-3 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {regras.map((r) => (
                  <LinhaRegra
                    key={r.id}
                    id={r.id}
                    label={EVENTO_LABEL[r.eventoTipo]}
                    parametro={r.parametro}
                    valor={r.valor}
                    unidade={r.unidade}
                    editavel={!!perfil?.podeConfigurarLimites}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LinhaRegra({
  id,
  label,
  parametro,
  valor,
  unidade,
  editavel,
}: {
  id: string;
  label: string;
  parametro: string;
  valor: number;
  unidade: string;
  editavel: boolean;
}) {
  const [local, setLocal] = useState<number | null>(null);
  const commit = () => {
    if (local != null && local !== valor) {
      atualizarRegraLimite(id, local);
      toast.success("Regra atualizada", { description: `${label}: ${local} ${unidade}` });
    }
    setLocal(null);
  };
  return (
    <tr>
      <td className="px-5 py-3 font-medium text-slate-900">{label}</td>
      <td className="px-5 py-3 text-slate-500">{parametro}</td>
      <td className="px-5 py-3 text-right">
        <div className="ml-auto flex w-36 items-center justify-end gap-2">
          <input
            type="number"
            value={local ?? valor}
            disabled={!editavel}
            onChange={(e) => setLocal(parseFloat(e.target.value) || 0)}
            onBlur={commit}
            onKeyDown={(e) => e.key === "Enter" && commit()}
            className="w-24 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-right text-sm tabular-nums text-slate-900 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 disabled:bg-slate-50 disabled:text-slate-500"
          />
          <span className="w-8 text-xs text-slate-400">{unidade}</span>
        </div>
      </td>
    </tr>
  );
}
