import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, ChevronRight, GitPullRequestArrow, Loader2, UserPlus, X } from "lucide-react";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { delayOperacao, empresasMock, FLOW_ETAPAS, fmtDateTime } from "@/lib/mock";
import type { SolicitacaoFlow } from "@/lib/mock";
import { usePermissoes } from "@/lib/permissoes";
import { criarSolicitacaoFlow, dbStore, decidirEtapaFlow } from "@/lib/stores/db";

export const Route = createFileRoute("/_portal/flow")({
  component: FlowScreen,
});

/** Stepper horizontal das etapas do Flow. */
function Stepper({ sol }: { sol: SolicitacaoFlow }) {
  return (
    <ol className="flex items-center gap-1">
      {FLOW_ETAPAS.map((etapa, i) => {
        const concluida = sol.etapa > i || sol.resultado !== "EM_ANDAMENTO";
        const atual = sol.etapa === i && sol.resultado === "EM_ANDAMENTO";
        const reprovado = sol.resultado === "REPROVADO" && i === FLOW_ETAPAS.length - 1;
        return (
          <li key={etapa} className="flex items-center gap-1">
            <span
              className={`grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold ${
                reprovado && concluida
                  ? "bg-rose-100 text-rose-600"
                  : concluida
                    ? "bg-green-500 text-white"
                    : atual
                      ? "border-2 border-green-500 bg-white text-green-600"
                      : "border border-slate-200 bg-slate-50 text-slate-400"
              }`}
            >
              {concluida ? (reprovado ? "✕" : "✓") : i + 1}
            </span>
            <span
              className={`hidden text-[11px] xl:block ${
                atual
                  ? "font-semibold text-green-700"
                  : concluida
                    ? "text-slate-600"
                    : "text-slate-400"
              }`}
            >
              {etapa}
            </span>
            {i < FLOW_ETAPAS.length - 1 && (
              <span className={`h-px w-4 ${concluida ? "bg-green-400" : "bg-slate-200"}`} />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function ResultadoPill({ sol }: { sol: SolicitacaoFlow }) {
  if (sol.resultado === "APROVADO") return <Pill tone="emerald">Aprovado</Pill>;
  if (sol.resultado === "REPROVADO") return <Pill tone="rose">Reprovado</Pill>;
  return <Pill tone="sky">{FLOW_ETAPAS[sol.etapa]}</Pill>;
}

function FlowScreen() {
  const { usuario, perfil } = usePermissoes();
  const solicitacoes = dbStore.useStore((s) => s.solicitacoesFlow);
  const [selecionada, setSelecionada] = useState<string | null>(null);
  const [novaAberta, setNovaAberta] = useState(false);
  const [parecer, setParecer] = useState("");
  const [decidindo, setDecidindo] = useState<"APROVADO" | "REPROVADO" | null>(null);

  const sol = solicitacoes.find((f) => f.id === selecionada) ?? null;
  const emAndamento = solicitacoes.filter((f) => f.resultado === "EM_ANDAMENTO").length;

  const decidir = async (decisao: "APROVADO" | "REPROVADO") => {
    if (!usuario || !sol || decidindo) return;
    setDecidindo(decisao);
    await delayOperacao(900, 2000);
    setDecidindo(null);
    decidirEtapaFlow(
      sol.id,
      decisao,
      parecer || (decisao === "APROVADO" ? "Aprovado." : "Reprovado."),
      usuario,
    );
    setParecer("");
    if (decisao === "REPROVADO") {
      toast.error(`Solicitação ${sol.id} reprovada`);
    } else if (sol.etapa + 1 >= 2) {
      toast.success(`Solicitação ${sol.id} aprovada — parceiro criado no cadastro único!`, {
        description: "O novo parceiro já está disponível na tela de Parceiros.",
      });
    } else {
      toast.success(`Etapa "${FLOW_ETAPAS[sol.etapa + 1]}" aprovada`);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="Flow — Cadastro de Parceiros"
        subtitle="Solicitações de novos parceiros com aprovação em etapas (cadastral e crédito)."
        actions={
          <button
            onClick={() => setNovaAberta(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-700"
          >
            <UserPlus className="h-4 w-4" />
            Nova solicitação
          </button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <KpiCard
          label="Em andamento"
          value={String(emAndamento)}
          icon={GitPullRequestArrow}
          tone="sky"
        />
        <KpiCard
          label="Aprovadas"
          value={String(solicitacoes.filter((f) => f.resultado === "APROVADO").length)}
          tone="green"
        />
        <KpiCard
          label="Seu papel"
          value={perfil?.podeAprovarFlow ? "Aprovador" : "Solicitante"}
          hint={
            perfil?.podeAprovarFlow ? "Pode aprovar/reprovar etapas" : "Acompanhe suas solicitações"
          }
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Solicitação</th>
                <th className="px-4 py-3">Parceiro proposto</th>
                <th className="px-4 py-3">Empresa</th>
                <th className="px-4 py-3">Andamento</th>
                <th className="px-4 py-3">Situação</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {solicitacoes.map((f) => (
                <tr
                  key={f.id}
                  onClick={() => setSelecionada(f.id)}
                  className="group cursor-pointer transition-colors hover:bg-slate-50"
                >
                  <td className="px-4 py-3">
                    <p className="font-mono text-sm font-medium text-slate-900">{f.id}</p>
                    <p className="text-xs text-slate-500">
                      {f.solicitante} · {fmtDateTime(f.dtSolicitacao)}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="max-w-56 truncate font-medium text-slate-900">{f.razaoSocial}</p>
                    <p className="text-xs text-slate-500">
                      {f.cnpj} · {f.cidade}/{f.uf}
                    </p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{f.codEmp}</td>
                  <td className="px-4 py-3">
                    <Stepper sol={f} />
                  </td>
                  <td className="px-4 py-3">
                    <ResultadoPill sol={f} />
                  </td>
                  <td className="px-4 py-3 text-right text-slate-400 group-hover:text-slate-700">
                    <ChevronRight className="ml-auto h-4 w-4" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detalhe em Sheet */}
      <Sheet open={sol != null} onOpenChange={(v) => !v && setSelecionada(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {sol && (
            <>
              <SheetHeader>
                <SheetTitle>
                  {sol.id} · {sol.razaoSocial}
                </SheetTitle>
                <SheetDescription>
                  Solicitado por {sol.solicitante} em {fmtDateTime(sol.dtSolicitacao)}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-4 space-y-5 px-1">
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                  <Stepper sol={sol} />
                </div>

                <div className="rounded-xl border border-slate-200 p-4 text-sm">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
                    Dados do parceiro proposto
                  </p>
                  <dl className="space-y-1.5 text-slate-700">
                    <p>
                      <span className="text-slate-400">CNPJ:</span> {sol.cnpj}
                    </p>
                    <p>
                      <span className="text-slate-400">Cidade:</span> {sol.cidade}/{sol.uf}
                    </p>
                    <p>
                      <span className="text-slate-400">Telefone:</span> {sol.telefone}
                    </p>
                    <p>
                      <span className="text-slate-400">E-mail:</span> {sol.email}
                    </p>
                    <p>
                      <span className="text-slate-400">Empresa:</span> {sol.codEmp} —{" "}
                      {empresasMock.find((e) => e.codEmp === sol.codEmp)?.nome}
                    </p>
                  </dl>
                </div>

                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
                    Linha do tempo de aprovações
                  </p>
                  {sol.aprovacoes.length === 0 ? (
                    <p className="text-sm text-slate-500">Nenhuma decisão registrada ainda.</p>
                  ) : (
                    <ol className="relative ml-2 space-y-4 border-l border-slate-200 pl-5">
                      {sol.aprovacoes.map((a, i) => (
                        <li key={i} className="relative">
                          <span
                            className={`absolute -left-[27px] top-1 h-2.5 w-2.5 rounded-full border-2 border-white ring-1 ${
                              a.resultado === "APROVADO"
                                ? "bg-green-500 ring-green-200"
                                : "bg-rose-500 ring-rose-200"
                            }`}
                          />
                          <p className="text-sm font-medium text-slate-900">
                            {FLOW_ETAPAS[a.etapa]} —{" "}
                            {a.resultado === "APROVADO" ? "Aprovado" : "Reprovado"}
                          </p>
                          <p className="text-xs text-slate-500">“{a.parecer}”</p>
                          <p className="mt-0.5 text-[11px] text-slate-400">
                            {a.aprovador} · {fmtDateTime(a.dataHora)}
                          </p>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>

                {perfil?.podeAprovarFlow && sol.resultado === "EM_ANDAMENTO" && (
                  <div className="rounded-xl border border-green-200 bg-green-50/60 p-4">
                    <p className="text-sm font-semibold text-green-900">
                      Decidir etapa: {FLOW_ETAPAS[(sol.etapa + 1) as 0 | 1 | 2 | 3] ?? "Conclusão"}
                    </p>
                    <textarea
                      value={parecer}
                      onChange={(e) => setParecer(e.target.value)}
                      placeholder="Parecer (opcional)…"
                      rows={2}
                      className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                    />
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => decidir("APROVADO")}
                        disabled={decidindo != null}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-wait disabled:opacity-80"
                      >
                        {decidindo === "APROVADO" ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" /> Aprovando…
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4" /> Aprovar etapa
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => decidir("REPROVADO")}
                        disabled={decidindo != null}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-100 disabled:cursor-wait disabled:opacity-70"
                      >
                        {decidindo === "REPROVADO" ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" /> Registrando…
                          </>
                        ) : (
                          <>
                            <X className="h-4 w-4" /> Reprovar
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
                {!perfil?.podeAprovarFlow && sol.resultado === "EM_ANDAMENTO" && (
                  <p className="rounded-lg bg-slate-50 px-3 py-2.5 text-xs text-slate-500">
                    Aguardando decisão da gerência na etapa{" "}
                    <span className="font-medium">{FLOW_ETAPAS[sol.etapa]}</span>.
                  </p>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <DialogNovaSolicitacao open={novaAberta} onOpenChange={setNovaAberta} />
    </div>
  );
}

function DialogNovaSolicitacao({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { usuario, perfil } = usePermissoes();
  const [form, setForm] = useState({
    razaoSocial: "",
    cnpj: "",
    cidade: "",
    uf: "SP",
    telefone: "",
    email: "",
    codEmp: "",
  });
  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const enviar = () => {
    if (!usuario || !form.razaoSocial.trim() || !form.cnpj.trim()) return;
    const codEmp = form.codEmp || perfil?.empresasAutorizadas[0] || "M001";
    const id = criarSolicitacaoFlow({ ...form, codEmp }, usuario);
    onOpenChange(false);
    setForm({
      razaoSocial: "",
      cnpj: "",
      cidade: "",
      uf: "SP",
      telefone: "",
      email: "",
      codEmp: "",
    });
    toast.success(`Solicitação ${id} criada`, {
      description: "Enviada para Análise Cadastral no Flow.",
    });
  };

  const inputCls =
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova solicitação de cadastro</DialogTitle>
          <DialogDescription>
            A solicitação percorre o Flow: Análise Cadastral → Análise de Crédito → criação do
            parceiro no cadastro único.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <label className="col-span-2 block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-slate-500">
              Razão social *
            </span>
            <input
              value={form.razaoSocial}
              onChange={(e) => set("razaoSocial", e.target.value)}
              className={inputCls}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-slate-500">
              CNPJ *
            </span>
            <input
              value={form.cnpj}
              onChange={(e) => set("cnpj", e.target.value)}
              placeholder="00.000.000/0001-00"
              className={inputCls}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-slate-500">
              Empresa
            </span>
            <select
              value={form.codEmp}
              onChange={(e) => set("codEmp", e.target.value)}
              className={inputCls}
            >
              <option value="">Selecione…</option>
              {perfil?.empresasAutorizadas.map((c) => (
                <option key={c} value={c}>
                  {c} — {empresasMock.find((e) => e.codEmp === c)?.nome}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-slate-500">
              Cidade
            </span>
            <input
              value={form.cidade}
              onChange={(e) => set("cidade", e.target.value)}
              className={inputCls}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-slate-500">
              UF
            </span>
            <input
              value={form.uf}
              onChange={(e) => set("uf", e.target.value.toUpperCase().slice(0, 2))}
              className={inputCls}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-slate-500">
              Telefone
            </span>
            <input
              value={form.telefone}
              onChange={(e) => set("telefone", e.target.value)}
              className={inputCls}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-slate-500">
              E-mail
            </span>
            <input
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              className={inputCls}
            />
          </label>
        </div>

        <DialogFooter>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            onClick={enviar}
            disabled={!form.razaoSocial.trim() || !form.cnpj.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <UserPlus className="h-4 w-4" />
            Enviar solicitação
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
