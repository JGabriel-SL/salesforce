import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Circle, FilePlus2, Headset, PhoneCall } from "lucide-react";
import { toast } from "sonner";
import { KpiCard } from "@/components/portal/shared/KpiCard";
import { PageHeader } from "@/components/portal/shared/PageHeader";
import { Pill } from "@/components/portal/shared/StatusPill";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { empresasMock, fmtDate, fmtDateTime, hojeISO } from "@/lib/mock";
import type { AtividadeTelemarketing, ResultadoLigacao, TipoCompromisso } from "@/lib/mock";
import { dadosEmpresaAutorizados, usePermissoes } from "@/lib/permissoes";
import {
  alternarCompromisso,
  criarOrcamento,
  dbStore,
  registrarAtividadeTm,
} from "@/lib/stores/db";
import { useAbrirJanela } from "@/lib/stores/use-janelas";

export const Route = createFileRoute("/_portal/telemarketing")({
  component: TelemarketingScreen,
});

const TIPO_TONE: Record<TipoCompromisso, "sky" | "violet" | "amber" | "emerald"> = {
  Ligação: "sky",
  Visita: "violet",
  Retorno: "amber",
  Reunião: "emerald",
};

function TelemarketingScreen() {
  const compromissos = dbStore.useStore((s) => s.compromissos);
  const atividades = dbStore.useStore((s) => s.atividadesTm);

  const porDia = useMemo(() => {
    const mapa = new Map<string, typeof compromissos>();
    [...compromissos]
      .sort((a, b) => a.data.localeCompare(b.data) || a.hora.localeCompare(b.hora))
      .forEach((c) => {
        mapa.set(c.data, [...(mapa.get(c.data) ?? []), c]);
      });
    return [...mapa.entries()];
  }, [compromissos]);

  const pendentes = atividades.filter((a) => a.status === "PENDENTE");
  const hoje = hojeISO();

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="Telemarketing e Agenda"
        subtitle="Compromissos comerciais e fila de ligações com registro de resultado."
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <KpiCard
          label="Compromissos hoje"
          value={String(compromissos.filter((c) => c.data === hoje && !c.concluido).length)}
          icon={CalendarDays}
          tone="green"
        />
        <KpiCard
          label="Ligações pendentes"
          value={String(pendentes.length)}
          icon={PhoneCall}
          tone="sky"
        />
        <KpiCard
          label="Registradas"
          value={String(atividades.filter((a) => a.status === "REGISTRADA").length)}
          icon={Headset}
        />
      </div>

      <Tabs defaultValue="agenda">
        <TabsList className="mb-4 h-auto rounded-lg bg-green-100 p-1 text-green-700">
          <TabsTrigger
            value="agenda"
            className="rounded-md px-3 py-1.5 text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-green-900 data-[state=active]:shadow-sm"
          >
            Agenda
          </TabsTrigger>
          <TabsTrigger
            value="atividades"
            className="rounded-md px-3 py-1.5 text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-green-900 data-[state=active]:shadow-sm"
          >
            Atividades de Telemarketing
          </TabsTrigger>
        </TabsList>

        {/* Agenda agrupada por dia */}
        <TabsContent value="agenda" className="space-y-4">
          {porDia.map(([data, itens]) => (
            <section
              key={data}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
            >
              <header className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/60 px-5 py-2.5">
                <CalendarDays className="h-4 w-4 text-slate-400" />
                <p className="text-sm font-semibold text-slate-900">
                  {data === hoje ? "Hoje" : fmtDate(data)}
                </p>
                <span className="text-xs text-slate-400">
                  {itens.filter((c) => !c.concluido).length} pendente(s)
                </span>
              </header>
              <ul className="divide-y divide-slate-50">
                {itens.map((c) => (
                  <li key={c.id} className="flex items-center gap-3 px-5 py-3">
                    <button
                      onClick={() => alternarCompromisso(c.id)}
                      className="shrink-0 text-slate-300 transition-colors hover:text-green-600"
                      aria-label="Concluir compromisso"
                    >
                      {c.concluido ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <Circle className="h-5 w-5" />
                      )}
                    </button>
                    <span className="w-12 shrink-0 font-mono text-sm font-medium tabular-nums text-slate-700">
                      {c.hora}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-sm font-medium ${
                          c.concluido ? "text-slate-400 line-through" : "text-slate-900"
                        }`}
                      >
                        {c.parceiro}
                      </p>
                      <p className="truncate text-xs text-slate-500">{c.assunto}</p>
                    </div>
                    <Pill tone={TIPO_TONE[c.tipo]} dot={false}>
                      {c.tipo}
                    </Pill>
                    <span className="hidden w-28 shrink-0 truncate text-right text-xs text-slate-400 sm:block">
                      {c.responsavel}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </TabsContent>

        {/* Fila de ligações */}
        <TabsContent value="atividades" className="space-y-3">
          {atividades.map((a) => (
            <AtividadeCard key={a.id} atividade={a} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AtividadeCard({ atividade }: { atividade: AtividadeTelemarketing }) {
  const { usuario, perfil } = usePermissoes();
  const parceiros = dbStore.useStore((s) => s.parceiros);
  const abrir = useAbrirJanela();
  const [registrando, setRegistrando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoLigacao>("Sem contato");
  const [observacao, setObservacao] = useState("");

  const registrada = atividade.status === "REGISTRADA";

  const registrar = () => {
    registrarAtividadeTm(atividade.id, resultado, observacao);
    setRegistrando(false);
    toast.success("Atividade registrada", { description: `${atividade.parceiro}: ${resultado}` });
  };

  const gerarOrcamento = () => {
    if (!usuario || !perfil) return;
    const parceiro = parceiros.find((p) => p.codParc === atividade.codParc);
    if (!parceiro) return;
    const dados = dadosEmpresaAutorizados(parceiro, perfil)[0];
    if (!dados) {
      toast.error("Parceiro sem dados nas empresas autorizadas do seu perfil.");
      return;
    }
    const nomeEmp = empresasMock.find((e) => e.codEmp === dados.codEmp)?.nome ?? dados.codEmp;
    const nunota = criarOrcamento(parceiro, dados.codEmp, nomeEmp, usuario);
    registrarAtividadeTm(atividade.id, "Orçamento gerado", observacao, nunota);
    setRegistrando(false);
    toast.success(`Orçamento ${nunota} gerado a partir da ligação`);
    abrir({ id: `/orcamentos/${nunota}`, titulo: `Orçamento ${nunota}`, icone: "documento" });
  };

  return (
    <section
      className={`rounded-xl border bg-white p-4 shadow-sm ${
        registrada ? "border-slate-200 opacity-70" : "border-slate-200"
      }`}
    >
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${
            registrada ? "bg-slate-100 text-slate-400" : "bg-sky-50 text-sky-600"
          }`}
        >
          <PhoneCall className="h-4.5 w-4.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">
            {atividade.parceiro}{" "}
            <span className="font-mono text-xs font-normal text-slate-400">
              {atividade.codParc}
            </span>
          </p>
          <p className="truncate text-xs text-slate-500">
            {atividade.motivo} · {atividade.telefone} · {atividade.responsavel}
          </p>
          {registrada && (
            <p className="mt-0.5 text-xs text-slate-500">
              <Pill
                tone={atividade.resultado === "Orçamento gerado" ? "emerald" : "slate"}
                dot={false}
              >
                {atividade.resultado}
              </Pill>
              {atividade.nunotaGerado && (
                <button
                  onClick={() =>
                    abrir({
                      id: `/orcamentos/${atividade.nunotaGerado}`,
                      titulo: `Orçamento ${atividade.nunotaGerado}`,
                      icone: "documento",
                    })
                  }
                  className="ml-2 font-mono text-xs font-medium text-green-700 underline-offset-2 hover:underline"
                >
                  {atividade.nunotaGerado}
                </button>
              )}
              {atividade.registradaEm && (
                <span className="ml-2 text-[11px] text-slate-400">
                  {fmtDateTime(atividade.registradaEm)}
                </span>
              )}
            </p>
          )}
        </div>
        {!registrada && (
          <button
            onClick={() => setRegistrando(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            <Headset className="h-3.5 w-3.5" />
            Registrar ligação
          </button>
        )}
      </div>

      <Dialog open={registrando} onOpenChange={setRegistrando}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar ligação</DialogTitle>
            <DialogDescription>
              {atividade.parceiro} · {atividade.telefone}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-slate-500">
                Resultado
              </span>
              <select
                value={resultado}
                onChange={(e) => setResultado(e.target.value as ResultadoLigacao)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              >
                {(["Sem contato", "Retornar depois", "Sem interesse"] as ResultadoLigacao[]).map(
                  (r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ),
                )}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-slate-500">
                Observação
              </span>
              <textarea
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                rows={3}
                placeholder="Detalhes da conversa…"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
            </label>
          </div>
          <DialogFooter className="sm:justify-between">
            <button
              onClick={gerarOrcamento}
              className="inline-flex items-center gap-2 rounded-lg border border-green-300 bg-green-50 px-3.5 py-2 text-sm font-semibold text-green-700 transition-colors hover:bg-green-100"
            >
              <FilePlus2 className="h-4 w-4" />
              Gerar orçamento
            </button>
            <button
              onClick={registrar}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
            >
              Registrar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
