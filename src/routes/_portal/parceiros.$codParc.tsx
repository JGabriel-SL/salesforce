import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Building2,
  FilePlus2,
  Landmark,
  Mail,
  MapPin,
  Phone,
  Undo2,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { DocumentoStatusPill, Pill } from "@/components/portal/shared/StatusPill";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  brl,
  calcDocumentoTotal,
  condicaoPorCodigo,
  empresasMock,
  fmtDate,
  statusEfetivo,
} from "@/lib/mock";
import type { Parceiro } from "@/lib/mock";
import { dadosEmpresaAutorizados, filtrarDocumentos, usePermissoes } from "@/lib/permissoes";
import { atualizarLimiteCreditoParceiro, dbStore } from "@/lib/stores/db";
import { renomearJanela } from "@/lib/stores/janelas";
import { useAbrirJanela } from "@/lib/stores/use-janelas";

export const Route = createFileRoute("/_portal/parceiros/$codParc")({
  component: FichaParceiroScreen,
});

function FichaParceiroScreen() {
  const { codParc } = Route.useParams();
  const parceiros = dbStore.useStore((s) => s.parceiros);
  const parceiro = parceiros.find((p) => p.codParc === codParc);

  useEffect(() => {
    if (parceiro) renomearJanela(`/parceiros/${parceiro.codParc}`, parceiro.nomeFantasia);
  }, [parceiro]);

  if (!parceiro) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <UserRound className="mx-auto h-10 w-10 text-slate-300" />
        <p className="mt-3 text-sm text-slate-500">
          Parceiro {codParc} não encontrado ou fora das empresas autorizadas do seu perfil.
        </p>
      </div>
    );
  }
  return <FichaParceiro parceiro={parceiro} />;
}

function FichaParceiro({ parceiro }: { parceiro: Parceiro }) {
  const { perfil } = usePermissoes();
  const documentos = dbStore.useStore((s) => s.documentos);
  const financeiro = dbStore.useStore((s) => s.financeiro);
  const router = useRouter();
  const abrir = useAbrirJanela();

  const dados = useMemo(
    () => (perfil ? dadosEmpresaAutorizados(parceiro, perfil) : []),
    [parceiro, perfil],
  );
  const docsParceiro = useMemo(
    () =>
      (perfil ? filtrarDocumentos(documentos, perfil) : [])
        .filter((d) => d.codParc === parceiro.codParc)
        .sort((a, b) => b.nunota - a.nunota),
    [documentos, perfil, parceiro.codParc],
  );
  const titulosAbertos = financeiro.filter(
    (f) => f.situacao !== "Pago" && docsParceiro.some((d) => d.nunota === f.nunota),
  );
  const devolucoes = dados.filter((d) => d.creditoDevolucao > 0);
  const nomeEmp = (codEmp: string) => empresasMock.find((e) => e.codEmp === codEmp)?.nome ?? codEmp;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <button
            onClick={() => router.history.push("/parceiros")}
            className="mb-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-slate-900"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Parceiros
          </button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="truncate text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              {parceiro.razaoSocial}
            </h1>
            {parceiro.inadimplente ? (
              <Pill tone="rose">Inadimplente</Pill>
            ) : (
              <Pill tone="emerald">Regular</Pill>
            )}
          </div>
          <p className="mt-0.5 text-sm text-slate-500">
            {parceiro.codParc} · {parceiro.cnpj} · {parceiro.nomeFantasia}
          </p>
        </div>
        <button
          onClick={() =>
            abrir({ id: "/orcamentos", titulo: "Portal de Vendas", icone: "documento" })
          }
          className="hidden shrink-0 items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-700 sm:inline-flex"
        >
          <FilePlus2 className="h-4 w-4" />
          Novo orçamento
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        {/* Ficha cadastral */}
        <aside className="space-y-4">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Ficha do parceiro
            </p>
            {/* Campos do modelo TGFPAR (Sankhya) */}
            <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 border-b border-slate-100 pb-4 text-xs">
              <div>
                <dt className="uppercase tracking-wider text-slate-400">Tipo de pessoa</dt>
                <dd className="mt-0.5 font-medium text-slate-800">
                  {(parceiro.tipoPessoa ?? "J") === "J" ? "Jurídica" : "Física"}
                </dd>
              </div>
              <div>
                <dt className="uppercase tracking-wider text-slate-400">Inscr. Estadual</dt>
                <dd className="mt-0.5 font-medium text-slate-800">
                  {parceiro.inscricaoEstadual ?? "Isento"}
                </dd>
              </div>
              <div>
                <dt className="uppercase tracking-wider text-slate-400">Cliente</dt>
                <dd className="mt-0.5 font-medium text-slate-800">
                  {(parceiro.cliente ?? true) ? "Sim" : "Não"}
                </dd>
              </div>
              <div>
                <dt className="uppercase tracking-wider text-slate-400">Fornecedor</dt>
                <dd className="mt-0.5 font-medium text-slate-800">
                  {parceiro.fornecedor ? "Sim" : "Não"}
                </dd>
              </div>
            </dl>
            <ParceiroMatrizInfo parceiro={parceiro} />
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <div>
                  <p className="text-slate-700">{parceiro.endereco}</p>
                  <p className="text-xs text-slate-500">
                    {parceiro.cidade}/{parceiro.uf}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-slate-400" />
                <p className="text-slate-700">{parceiro.telefone}</p>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-slate-400" />
                <p className="truncate text-slate-700">{parceiro.email}</p>
              </div>
            </dl>
            <div className="mt-4 border-t border-slate-100 pt-4 text-xs">
              <p className="font-medium uppercase tracking-wider text-slate-500">
                Contato de entrega
              </p>
              <p className="mt-1.5 font-medium text-slate-800">
                {parceiro.contatoEntrega.nome} · {parceiro.contatoEntrega.telefone}
              </p>
              <p className="mt-0.5 text-slate-500">{parceiro.contatoEntrega.endereco}</p>
            </div>
            <div className="mt-4 border-t border-slate-100 pt-4 text-xs">
              <p className="text-slate-500">
                Última compra:{" "}
                <span className="font-medium text-slate-700">
                  {parceiro.ultimaCompra ? fmtDate(parceiro.ultimaCompra) : "—"}
                </span>
              </p>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Cadastro único · segregação
            </p>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              O parceiro possui cadastro único no grupo, mas os dados comerciais são segregados por
              empresa. Seu perfil visualiza:{" "}
              <span className="font-semibold text-slate-700">
                {dados.map((d) => d.codEmp).join(", ") || "nenhuma"}
              </span>
              {parceiro.dadosPorEmpresa.length > dados.length && (
                <>
                  {" "}
                  · {parceiro.dadosPorEmpresa.length - dados.length} empresa(s) oculta(s) pela
                  Central de Certificação.
                </>
              )}
            </p>
          </section>
        </aside>

        {/* Abas */}
        <div className="min-w-0">
          <Tabs defaultValue="empresas">
            <TabsList className="mb-4 h-auto rounded-lg bg-green-100 p-1 text-green-700">
              {[
                { v: "empresas", label: "Dados por Empresa" },
                { v: "historico", label: "Histórico de Compras" },
                { v: "credito", label: "Crédito" },
                { v: "comercial", label: "Comercial" },
                { v: "devolucoes", label: "Devoluções" },
              ].map((t) => (
                <TabsTrigger
                  key={t.v}
                  value={t.v}
                  className="rounded-md px-3 py-1.5 text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-green-900 data-[state=active]:shadow-sm"
                >
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="empresas" className="space-y-4">
              {dados.map((d) => (
                <section
                  key={d.codEmp}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-green-50 text-green-600">
                      <Building2 className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{nomeEmp(d.codEmp)}</p>
                      <p className="font-mono text-xs text-slate-500">{d.codEmp}</p>
                    </div>
                  </div>
                  <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                    <div>
                      <dt className="text-xs uppercase tracking-wider text-slate-500">
                        Limite de crédito
                      </dt>
                      <dd className="mt-0.5 font-medium tabular-nums text-slate-900">
                        {brl(d.limiteCredito)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wider text-slate-500">Utilizado</dt>
                      <dd className="mt-0.5 font-medium tabular-nums text-slate-900">
                        {brl(d.creditoUtilizado)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wider text-slate-500">
                        Condição padrão
                      </dt>
                      <dd className="mt-0.5 font-medium text-slate-900">
                        {condicaoPorCodigo(d.codCondicaoPadrao).descricao}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wider text-slate-500">
                        Vendedor padrão
                      </dt>
                      <dd className="mt-0.5 font-medium text-slate-900">{d.vendedorPadrao}</dd>
                    </div>
                  </dl>
                </section>
              ))}
              {dados.length === 0 && (
                <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
                  Nenhuma empresa deste parceiro é visível para o seu perfil.
                </p>
              )}
            </TabsContent>

            <TabsContent value="historico">
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50">
                      <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        <th className="px-4 py-3">Nro. Único</th>
                        <th className="px-4 py-3">Tipo</th>
                        <th className="px-4 py-3">Data Neg.</th>
                        <th className="px-4 py-3">Empresa</th>
                        <th className="px-4 py-3 text-right">Valor</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {docsParceiro.map((d) => (
                        <tr
                          key={d.nunota}
                          onClick={() =>
                            abrir({
                              id: `/orcamentos/${d.nunota}`,
                              titulo: `${d.tipo === "ORCAMENTO" ? "Orçamento" : "Pedido"} ${d.nunota}`,
                              icone: "documento",
                            })
                          }
                          className="cursor-pointer transition-colors hover:bg-slate-50"
                        >
                          <td className="px-4 py-3 font-mono font-medium text-slate-900">
                            {d.nunota}
                          </td>
                          <td className="px-4 py-3">
                            <Pill tone={d.tipo === "ORCAMENTO" ? "sky" : "violet"} dot={false}>
                              {d.tipo === "ORCAMENTO" ? "Orçamento" : "Pedido"}
                            </Pill>
                          </td>
                          <td className="px-4 py-3 text-slate-700">{fmtDate(d.dtNeg)}</td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-600">{d.codEmp}</td>
                          <td className="px-4 py-3 text-right font-medium tabular-nums text-slate-900">
                            {brl(calcDocumentoTotal(d))}
                          </td>
                          <td className="px-4 py-3">
                            <DocumentoStatusPill status={statusEfetivo(d)} />
                          </td>
                        </tr>
                      ))}
                      {docsParceiro.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-500">
                            Nenhuma compra registrada nas empresas autorizadas.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="credito" className="space-y-4">
              {dados.map((d) => {
                const disponivel = d.limiteCredito - d.creditoUtilizado;
                const pct = Math.min(100, (d.creditoUtilizado / d.limiteCredito) * 100);
                return (
                  <section
                    key={d.codEmp}
                    className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="mb-2 flex items-baseline justify-between">
                      <p className="text-sm font-semibold text-slate-900">{nomeEmp(d.codEmp)}</p>
                      <p className="text-xs text-slate-500">
                        Disponível:{" "}
                        <span
                          className={`font-semibold tabular-nums ${
                            disponivel <= 0 ? "text-rose-600" : "text-emerald-700"
                          }`}
                        >
                          {brl(disponivel)}
                        </span>
                      </p>
                    </div>
                    <Progress value={pct} className="h-2" />
                    <div className="mt-2 flex justify-between text-xs tabular-nums text-slate-500">
                      <span>Utilizado {brl(d.creditoUtilizado)}</span>
                      <span>Limite {brl(d.limiteCredito)}</span>
                    </div>
                    <EditorLimiteCredito
                      codParc={parceiro.codParc}
                      codEmp={d.codEmp}
                      limiteAtual={d.limiteCredito}
                    />
                    {d.creditoDevolucao > 0 && (
                      <p className="mt-3 rounded-lg bg-sky-50 px-3 py-2 text-xs text-sky-800">
                        Crédito de depósito/devolução disponível:{" "}
                        <span className="font-semibold tabular-nums">
                          {brl(d.creditoDevolucao)}
                        </span>
                      </p>
                    )}
                  </section>
                );
              })}
              <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <header className="border-b border-slate-100 px-5 py-3">
                  <p className="text-sm font-semibold text-slate-900">Títulos em aberto</p>
                </header>
                {titulosAbertos.length === 0 ? (
                  <p className="px-5 py-6 text-sm text-slate-500">Nenhum título em aberto.</p>
                ) : (
                  <table className="min-w-full divide-y divide-slate-100 text-sm">
                    <tbody className="divide-y divide-slate-50">
                      {titulosAbertos.map((t) => (
                        <tr key={`${t.nunota}-${t.parcela}`}>
                          <td className="px-5 py-2.5 font-mono text-xs text-slate-600">
                            {t.nunota} · parc. {t.parcela}
                          </td>
                          <td className="px-5 py-2.5 text-slate-700">
                            Venc. {fmtDate(t.dtVencimento)}
                          </td>
                          <td className="px-5 py-2.5 text-right font-medium tabular-nums text-slate-900">
                            {brl(t.valor)}
                          </td>
                          <td className="px-5 py-2.5 text-right">
                            <Pill tone={t.situacao === "Vencido" ? "rose" : "amber"}>
                              {t.situacao}
                            </Pill>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </section>
            </TabsContent>

            <TabsContent value="comercial" className="space-y-4">
              {dados.map((d) => (
                <section
                  key={d.codEmp}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <p className="text-sm font-semibold text-slate-900">{nomeEmp(d.codEmp)}</p>
                  <dl className="mt-3 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
                    <div>
                      <dt className="text-xs uppercase tracking-wider text-slate-500">
                        Condição comercial
                      </dt>
                      <dd className="mt-0.5 font-medium text-slate-900">
                        {d.codCondicaoPadrao} — {condicaoPorCodigo(d.codCondicaoPadrao).descricao}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wider text-slate-500">
                        Vendedor responsável
                      </dt>
                      <dd className="mt-0.5 font-medium text-slate-900">{d.vendedorPadrao}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wider text-slate-500">
                        Comissão padrão
                      </dt>
                      <dd className="mt-0.5 font-medium text-slate-900">5%</dd>
                    </div>
                  </dl>
                </section>
              ))}
            </TabsContent>

            <TabsContent value="devolucoes">
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <header className="flex items-center gap-2 border-b border-slate-100 px-5 py-3">
                  <Undo2 className="h-4 w-4 text-slate-400" />
                  <p className="text-sm font-semibold text-slate-900">
                    Devoluções e créditos gerados
                  </p>
                </header>
                {devolucoes.length === 0 ? (
                  <p className="px-5 py-6 text-sm text-slate-500">
                    Nenhuma devolução registrada nas empresas autorizadas.
                  </p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {devolucoes.map((d) => (
                      <li key={d.codEmp} className="flex items-center justify-between px-5 py-3">
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            Devolução parcial — {nomeEmp(d.codEmp)}
                          </p>
                          <p className="text-xs text-slate-500">
                            Crédito disponível para abatimento em novos pedidos.
                          </p>
                        </div>
                        <span className="font-semibold tabular-nums text-sky-700">
                          {brl(d.creditoDevolucao)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

/** Parceiro Matriz (TGFPAR.CODPARCMATRIZ): filiais apontam para a matriz
 *  e a matriz lista suas filiais. */
function ParceiroMatrizInfo({ parceiro }: { parceiro: Parceiro }) {
  const parceiros = dbStore.useStore((s) => s.parceiros);
  const abrir = useAbrirJanela();
  const matriz = parceiro.codParcMatriz
    ? parceiros.find((p) => p.codParc === parceiro.codParcMatriz)
    : null;
  const filiais = parceiros.filter((p) => p.codParcMatriz === parceiro.codParc);
  if (!matriz && filiais.length === 0) return null;

  return (
    <div className="mt-4 border-b border-slate-100 pb-4 text-xs">
      <p className="uppercase tracking-wider text-slate-400">Parceiro matriz</p>
      {matriz ? (
        <button
          onClick={() =>
            abrir({
              id: `/parceiros/${matriz.codParc}`,
              titulo: matriz.nomeFantasia,
              icone: "parceiro",
            })
          }
          className="mt-1 flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/60 px-2.5 py-2 text-left transition-colors hover:border-green-300 hover:bg-green-50/40"
        >
          <span className="rounded bg-slate-200 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-600">
            {matriz.codParc}
          </span>
          <span className="min-w-0 flex-1 truncate font-medium text-slate-800">
            {matriz.razaoSocial}
          </span>
        </button>
      ) : (
        <p className="mt-1 font-medium text-slate-800">
          Este parceiro é a matriz{filiais.length > 0 && ` de ${filiais.length} filial(is)`}:
        </p>
      )}
      {filiais.length > 0 && (
        <ul className="mt-1.5 space-y-1">
          {filiais.map((f) => (
            <li key={f.codParc}>
              <button
                onClick={() =>
                  abrir({
                    id: `/parceiros/${f.codParc}`,
                    titulo: f.nomeFantasia,
                    icone: "parceiro",
                  })
                }
                className="flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-left transition-colors hover:border-green-300 hover:bg-green-50/40"
              >
                <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-600">
                  {f.codParc}
                </span>
                <span className="min-w-0 flex-1 truncate text-slate-700">{f.razaoSocial}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Limite de crédito é parametrizado aqui, no Parceiro (estrutura
 *  Sankhya — aba Crédito do Cadastro de Parceiros), por empresa. */
function EditorLimiteCredito({
  codParc,
  codEmp,
  limiteAtual,
}: {
  codParc: string;
  codEmp: string;
  limiteAtual: number;
}) {
  const { perfil } = usePermissoes();
  const [valor, setValor] = useState<number | null>(null);
  const podeEditar = !!perfil && (perfil.podeConfigurarLimites || perfil.podeAprovarLiberacoes);

  const salvar = () => {
    if (valor == null || valor === limiteAtual) {
      setValor(null);
      return;
    }
    atualizarLimiteCreditoParceiro(codParc, codEmp, valor);
    toast.success("Limite de crédito atualizado", {
      description: `${codParc} · ${codEmp}: ${brl(valor)}`,
    });
    setValor(null);
  };

  return (
    <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2">
      <div className="flex items-center gap-2 text-xs text-slate-600">
        <Landmark className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        <span>
          Limite de crédito ({codEmp})
          {!podeEditar && (
            <span className="text-slate-400"> — ajuste restrito à gerência/administração</span>
          )}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-slate-400">R$</span>
        <input
          type="number"
          min={0}
          step={1000}
          value={valor ?? limiteAtual}
          disabled={!podeEditar}
          onChange={(e) => setValor(Math.max(0, parseFloat(e.target.value) || 0))}
          onBlur={salvar}
          onKeyDown={(e) => e.key === "Enter" && salvar()}
          className="w-28 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-right text-sm tabular-nums text-slate-900 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 disabled:bg-slate-50 disabled:text-slate-500"
        />
      </div>
    </div>
  );
}
