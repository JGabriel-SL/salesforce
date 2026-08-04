import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  ArrowUpRight,
  BarChart3,
  CalendarClock,
  CalendarDays,
  ExternalLink,
  FileText,
  GitPullRequestArrow,
  PackageCheck,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";
import { KpiCard } from "@/components/portal/shared/KpiCard";
import { PageHeader } from "@/components/portal/shared/PageHeader";
import { Pill } from "@/components/portal/shared/StatusPill";
import {
  brl,
  calcDocumentoTotal,
  diasParaExpirar,
  FLOW_ETAPAS,
  fmtDate,
  hojeISO,
  statusEfetivo,
} from "@/lib/mock";
import type { CardDashboard } from "@/lib/mock";
import { filtrarDocumentos, usePermissoes } from "@/lib/permissoes";
import { dbStore } from "@/lib/stores/db";
import { useAbrirJanela } from "@/lib/stores/use-janelas";

export const Route = createFileRoute("/_portal/")({
  component: Dashboard,
});

const PAINEIS_POWERBI = [
  { nome: "Vendas Comercial — Diário", area: "Comercial" },
  { nome: "Margem e Rentabilidade", area: "Controladoria" },
  { nome: "Carteira de Clientes", area: "Relacionamento" },
];

function Dashboard() {
  const { usuario, perfil } = usePermissoes();
  const documentos = dbStore.useStore((s) => s.documentos);
  const solicitacoesFlow = dbStore.useStore((s) => s.solicitacoesFlow);
  const compromissos = dbStore.useStore((s) => s.compromissos);
  const abrir = useAbrirJanela();

  const docs = useMemo(
    () => (perfil ? filtrarDocumentos(documentos, perfil) : []),
    [documentos, perfil],
  );

  const orcAbertos = docs.filter((d) => statusEfetivo(d) === "ORCAMENTO_ABERTO");
  const expirando = orcAbertos.filter((d) => diasParaExpirar(d) <= 3);
  const aguardando = docs.filter((d) => statusEfetivo(d) === "AGUARDANDO_LIBERACAO");
  const mesAtual = hojeISO().slice(0, 7);
  const faturadoMes = docs
    .filter((d) => d.dtFat?.startsWith(mesAtual))
    .reduce((acc, d) => acc + calcDocumentoTotal(d), 0);

  const retiraPendentes = docs.filter(
    (d) =>
      d.modalidadeEntrega === "RETIRA" &&
      statusEfetivo(d) === "PEDIDO_FATURADO" &&
      !d.retiraColetado,
  );
  const flowAndamento = solicitacoesFlow.filter((f) => f.resultado === "EM_ANDAMENTO");
  const eventosPendentes = aguardando.flatMap((d) =>
    d.eventos.filter((e) => e.status === "PENDENTE").map((e) => ({ doc: d, evento: e })),
  );
  const compromissosHoje = compromissos.filter((c) => c.data === hojeISO() && !c.concluido);

  const diasParado = (dtFat?: string) =>
    dtFat ? Math.floor((Date.now() - new Date(dtFat + "T00:00:00").getTime()) / 86_400_000) : 0;

  const cards = perfil?.cardsDashboard ?? [];

  const renderCard = (card: CardDashboard) => {
    switch (card) {
      case "retira":
        return (
          <CardAtalho
            key={card}
            icone={PackageCheck}
            tone="orange"
            titulo="Pedidos Retira Não Coletados"
            contagem={retiraPendentes.length}
            onAbrir={() =>
              abrir({ id: "/orcamentos", titulo: "Orçamentos e Pedidos", icone: "documento" })
            }
          >
            {retiraPendentes.slice(0, 3).map((d) => (
              <MiniLinha
                key={d.nunota}
                onClick={() =>
                  abrir({
                    id: `/orcamentos/${d.nunota}`,
                    titulo: `Pedido ${d.nunota}`,
                    icone: "documento",
                  })
                }
                titulo={`${d.nunota} · ${d.parceiro}`}
                extra={
                  <span className="font-semibold text-rose-600">{diasParado(d.dtFat)}d parado</span>
                }
              />
            ))}
            {retiraPendentes.length === 0 && <MiniVazio texto="Nenhum pedido aguardando coleta." />}
          </CardAtalho>
        );
      case "flow":
        return (
          <CardAtalho
            key={card}
            icone={GitPullRequestArrow}
            tone="sky"
            titulo="Solicitações em Andamento (Flow)"
            contagem={flowAndamento.length}
            onAbrir={() =>
              abrir({ id: "/flow", titulo: "Flow — Cadastro de Parceiros", icone: "flow" })
            }
          >
            {flowAndamento.slice(0, 3).map((f) => (
              <MiniLinha
                key={f.id}
                onClick={() =>
                  abrir({ id: "/flow", titulo: "Flow — Cadastro de Parceiros", icone: "flow" })
                }
                titulo={`${f.id} · ${f.razaoSocial}`}
                extra={<Pill tone="sky">{FLOW_ETAPAS[f.etapa]}</Pill>}
              />
            ))}
            {flowAndamento.length === 0 && <MiniVazio texto="Nenhuma solicitação em andamento." />}
          </CardAtalho>
        );
      case "liberacoes":
        return (
          <CardAtalho
            key={card}
            icone={ShieldAlert}
            tone="amber"
            titulo="Liberações Pendentes"
            contagem={eventosPendentes.length}
            onAbrir={() =>
              abrir({ id: "/limites", titulo: "Liberação de Limites", icone: "limites" })
            }
          >
            {eventosPendentes.slice(0, 3).map(({ doc, evento }) => (
              <MiniLinha
                key={evento.id}
                onClick={() =>
                  abrir({
                    id: `/orcamentos/${doc.nunota}`,
                    titulo: `Orçamento ${doc.nunota}`,
                    icone: "documento",
                  })
                }
                titulo={`${doc.nunota} · ${evento.descricao}`}
                extra={<Pill tone="amber">Pendente</Pill>}
              />
            ))}
            {eventosPendentes.length === 0 && <MiniVazio texto="Nenhuma liberação pendente." />}
          </CardAtalho>
        );
      case "agenda":
        return (
          <CardAtalho
            key={card}
            icone={CalendarDays}
            tone="green"
            titulo="Agenda de Hoje"
            contagem={compromissosHoje.length}
            onAbrir={() =>
              abrir({
                id: "/telemarketing",
                titulo: "Telemarketing e Agenda",
                icone: "telemarketing",
              })
            }
          >
            {compromissosHoje.slice(0, 3).map((c) => (
              <MiniLinha
                key={c.id}
                onClick={() =>
                  abrir({
                    id: "/telemarketing",
                    titulo: "Telemarketing e Agenda",
                    icone: "telemarketing",
                  })
                }
                titulo={`${c.hora} · ${c.parceiro}`}
                extra={<span className="text-slate-400">{c.tipo}</span>}
              />
            ))}
            {compromissosHoje.length === 0 && <MiniVazio texto="Nenhum compromisso para hoje." />}
          </CardAtalho>
        );
      case "powerbi":
        return (
          <section
            key={card}
            className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm"
          >
            <header className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-3.5">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-amber-50 text-amber-500">
                <BarChart3 className="h-5 w-5" />
              </span>
              <h2 className="text-sm font-semibold text-slate-900">Painéis Power BI</h2>
            </header>
            <ul className="flex-1 divide-y divide-slate-50 px-2 py-1">
              {PAINEIS_POWERBI.map((p) => (
                <li key={p.nome}>
                  <a
                    href="https://app.powerbi.com"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-slate-50"
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded bg-amber-100 text-[10px] font-black text-amber-700">
                      BI
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-slate-900">
                        {p.nome}
                      </span>
                      <span className="block text-xs text-slate-400">{p.area}</span>
                    </span>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-300" />
                  </a>
                </li>
              ))}
            </ul>
            <p className="border-t border-slate-100 px-5 py-2 text-[11px] text-slate-400">
              Acesso direto aos painéis publicados no workspace do Grupo HL.
            </p>
          </section>
        );
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        overline={fmtDate(hojeISO())}
        title={`Olá, ${usuario?.nome.split(" ")[0] ?? ""}`}
        subtitle={`${usuario?.cargo} · cards personalizados pelo perfil ${perfil?.nome}`}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="Orçamentos abertos"
          value={String(orcAbertos.length)}
          icon={FileText}
          tone="sky"
          hint={brl(orcAbertos.reduce((a, d) => a + calcDocumentoTotal(d), 0))}
        />
        <KpiCard
          label="Expirando em ≤ 3 dias"
          value={String(expirando.length)}
          icon={CalendarClock}
          tone="amber"
          hint="Validade de 10 dias"
        />
        <KpiCard
          label="Aguardando liberação"
          value={String(aguardando.length)}
          icon={ShieldAlert}
          tone="rose"
          hint={`${eventosPendentes.length} evento(s) pendente(s)`}
        />
        <KpiCard label="Faturado no mês" value={brl(faturadoMes)} icon={TrendingUp} tone="green" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-2">
        {cards.map(renderCard)}
      </div>
    </div>
  );
}

function CardAtalho({
  icone: Icone,
  tone,
  titulo,
  contagem,
  onAbrir,
  children,
}: {
  icone: React.ComponentType<{ className?: string }>;
  tone: "orange" | "sky" | "amber" | "green";
  titulo: string;
  contagem: number;
  onAbrir: () => void;
  children: React.ReactNode;
}) {
  const tones: Record<string, string> = {
    orange: "bg-orange-50 text-orange-500",
    sky: "bg-sky-50 text-sky-500",
    amber: "bg-amber-50 text-amber-500",
    green: "bg-green-50 text-green-600",
  };
  return (
    <section className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-3.5">
        <span className={`grid h-9 w-9 place-items-center rounded-lg ${tones[tone]}`}>
          <Icone className="h-5 w-5" />
        </span>
        <h2 className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900">{titulo}</h2>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-slate-600">
          {contagem}
        </span>
        <button
          onClick={onAbrir}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
        >
          Abrir <ArrowUpRight className="h-3 w-3" />
        </button>
      </header>
      <div className="flex-1 divide-y divide-slate-50 px-2 py-1">{children}</div>
    </section>
  );
}

function MiniLinha({
  titulo,
  extra,
  onClick,
}: {
  titulo: string;
  extra?: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-slate-50"
    >
      <span className="min-w-0 flex-1 truncate text-sm text-slate-700">{titulo}</span>
      <span className="shrink-0 text-xs">{extra}</span>
    </button>
  );
}

function MiniVazio({ texto }: { texto: string }) {
  return <p className="px-3 py-6 text-center text-xs text-slate-400">{texto}</p>;
}
