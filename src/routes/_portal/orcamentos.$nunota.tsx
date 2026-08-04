import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CalendarClock,
  CheckCircle,
  Copy,
  FileWarning,
  Layers,
  PackageCheck,
  PackageX,
  Paperclip,
  Printer,
  Receipt,
  RotateCcw,
  ShieldAlert,
  Tag,
  User2,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { AbaEstoque } from "@/components/portal/documento/AbaEstoque";
import { AbaItens } from "@/components/portal/documento/AbaItens";
import { AbaTotais } from "@/components/portal/documento/AbaTotais";
import {
  AbaFinanceiro,
  AbaHistorico,
  AbaTransporte,
} from "@/components/portal/documento/AbasApoio";
import { DialogAnexos } from "@/components/portal/documento/DialogAnexos";
import { DialogDuplicar } from "@/components/portal/documento/DialogDuplicar";
import { DialogImpressao } from "@/components/portal/documento/DialogImpressao";
import { PainelEventos } from "@/components/portal/documento/PainelEventos";
import { regrasDocumento } from "@/components/portal/documento/regras";
import { CodedFieldRow, EditableRow, FieldRow } from "@/components/portal/shared/CodedFieldRow";
import { DocumentoStatusPill, Pill } from "@/components/portal/shared/StatusPill";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  brl,
  calcDocumentoTotal,
  calcSubtotalBruto,
  calcTotalItens,
  condicoesMock,
  dataValidade,
  diasParaExpirar,
  fmtDate,
} from "@/lib/mock";
import type { Documento } from "@/lib/mock";
import { topsDisponiveis, usePermissoes } from "@/lib/permissoes";
import {
  alterarCondicaoPagamento,
  atualizarCabecalho,
  confirmarParaFaturamento,
  dbStore,
  faturarPedido,
  marcarRetiraColetado,
  restaurarCondicaoAnterior,
} from "@/lib/stores/db";
import { renomearJanela } from "@/lib/stores/janelas";

export const Route = createFileRoute("/_portal/orcamentos/$nunota")({
  component: DocumentoScreen,
});

function DocumentoScreen() {
  const { nunota } = Route.useParams();
  const documentos = dbStore.useStore((s) => s.documentos);
  const doc = documentos.find((d) => d.nunota === Number(nunota));

  useEffect(() => {
    if (doc) {
      renomearJanela(
        `/orcamentos/${doc.nunota}`,
        `${doc.tipo === "ORCAMENTO" ? "Orçamento" : "Pedido"} ${doc.nunota}`,
      );
    }
  }, [doc]);

  if (!doc) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <FileWarning className="mx-auto h-10 w-10 text-slate-300" />
        <p className="mt-3 text-sm text-slate-500">
          Documento {nunota} não encontrado ou fora das empresas autorizadas do seu perfil.
        </p>
      </div>
    );
  }
  return <DocumentoView doc={doc} />;
}

function DocumentoView({ doc }: { doc: Documento }) {
  const { usuario, perfil } = usePermissoes();
  const parceiros = dbStore.useStore((s) => s.parceiros);
  const router = useRouter();
  const regras = regrasDocumento(doc);

  const [anexosAberto, setAnexosAberto] = useState(false);
  const [duplicarAberto, setDuplicarAberto] = useState(false);
  const [imprimirAberto, setImprimirAberto] = useState(false);

  const parceiro = parceiros.find((p) => p.codParc === doc.codParc);
  const dadosEmp = parceiro?.dadosPorEmpresa.find((d) => d.codEmp === doc.codEmp);
  const creditoDisponivel = dadosEmp ? dadosEmp.limiteCredito - dadosEmp.creditoUtilizado : 0;
  const usoCreditoPct = dadosEmp
    ? Math.min(100, (dadosEmp.creditoUtilizado / dadosEmp.limiteCredito) * 100)
    : 0;

  const confirmar = () => {
    if (!usuario) return;
    const r = confirmarParaFaturamento(doc.nunota, usuario);
    if (!r) return;
    if (r.resultado === "PRONTO") {
      toast.success("Documento confirmado — pronto para faturamento!");
    } else if (r.resultado === "SEM_ESTOQUE") {
      toast.error("Itens sem estoque disponível", {
        description: r.itens.map((i) => i.descricao).join(", "),
      });
    } else {
      toast.warning(`${r.eventos} evento(s) de bloqueio identificado(s)`, {
        description: "Documento enviado para a fila de Liberação de Limites.",
      });
    }
  };

  const faturar = () => {
    if (!usuario) return;
    faturarPedido(doc.nunota, usuario);
    toast.success(`Pedido ${doc.nunota} faturado!`, {
      description: "Orçamento convertido em pedido, estoque reservado e NFe emitida.",
    });
  };

  const trocarCondicao = (codigo: string) => {
    if (!usuario || codigo === doc.codCondicao) return;
    alterarCondicaoPagamento(doc.nunota, codigo, usuario);
    toast.info(`Preços recalculados pela condição ${codigo}`, {
      description: "Use o botão de ação para restaurar os preços da condição anterior.",
    });
  };

  const restaurar = () => {
    if (!usuario || !doc.condicaoAnterior) return;
    const anterior = doc.condicaoAnterior.codigo;
    restaurarCondicaoAnterior(doc.nunota, usuario);
    toast.success(`Preços da condição ${anterior} restaurados`);
  };

  const setTop = (codTop: string) => {
    if (!usuario || !perfil) return;
    const top = topsDisponiveis(perfil).find((t) => t.codTop === codTop);
    if (!top) return;
    atualizarCabecalho(
      doc.nunota,
      { codTop: top.codTop, top: top.descricao },
      usuario,
      "TOP",
      doc.codTop,
      top.codTop,
    );
  };

  const subtotalBruto = calcSubtotalBruto(doc.itens);
  const total = calcDocumentoTotal(doc);
  const totalDesc = subtotalBruto - calcTotalItens(doc.itens);
  const dias = diasParaExpirar(doc);

  const btnSecundario =
    "inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50";

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Top bar */}
      <div className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <button
            onClick={() => router.history.push("/orcamentos")}
            className="mb-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-slate-900"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Central de Orçamentos e Pedidos
          </button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="truncate text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              {doc.tipo === "ORCAMENTO" ? "Orçamento" : "Pedido"} · NUNOTA {doc.nunota}
            </h1>
            <DocumentoStatusPill status={regras.status} />
            {doc.duplicadoDe != null && (
              <Pill tone={doc.precosAtualizados ? "emerald" : "slate"} dot={false}>
                {doc.precosAtualizados
                  ? `Duplicado de ${doc.duplicadoDe} · preços atualizados`
                  : `Duplicado de ${doc.duplicadoDe} · valores originais`}
              </Pill>
            )}
          </div>
          <p className="mt-0.5 truncate text-sm text-slate-500">
            {doc.parceiro} · {doc.empresa} · Vendedor {doc.vendedor}
          </p>
        </div>
        <div className="hidden shrink-0 flex-wrap items-center justify-end gap-2 sm:flex">
          <button onClick={() => setAnexosAberto(true)} className={btnSecundario}>
            <Paperclip className="h-4 w-4" /> Anexos
          </button>
          {regras.podeDuplicar && (
            <button onClick={() => setDuplicarAberto(true)} className={btnSecundario}>
              <Copy className="h-4 w-4" /> Duplicar
            </button>
          )}
          {regras.faturado && (
            <button onClick={() => setImprimirAberto(true)} className={btnSecundario}>
              <Printer className="h-4 w-4" /> Imprimir NFe / Boleto
            </button>
          )}
          {regras.podeConfirmar && (
            <button
              onClick={confirmar}
              className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-sm font-medium text-emerald-700 shadow-sm transition-colors hover:bg-emerald-100"
            >
              <CheckCircle className="h-4 w-4" /> Confirmar p/ faturamento
            </button>
          )}
          {regras.podeFaturar && perfil?.podeFaturar && (
            <button
              onClick={faturar}
              className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-700"
            >
              <BadgeCheck className="h-4 w-4" /> Faturar
            </button>
          )}
          {regras.faturado && doc.modalidadeEntrega === "RETIRA" && !doc.retiraColetado && (
            <button
              onClick={() => {
                if (!usuario) return;
                marcarRetiraColetado(doc.nunota, usuario);
                toast.success("Coleta registrada no balcão.");
              }}
              className={btnSecundario}
            >
              <PackageCheck className="h-4 w-4" /> Registrar coleta
            </button>
          )}
        </div>
      </div>

      {/* Banners de status */}
      {regras.expirado && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <CalendarClock className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            <span className="font-semibold">
              Orçamento expirado em {fmtDate(dataValidade(doc).toISOString().slice(0, 10))}
            </span>{" "}
            — a validade é de 10 dias. Edição bloqueada; somente a{" "}
            <span className="font-semibold">duplicação</span> é permitida.
          </p>
        </div>
      )}
      {regras.status === "PRONTO_FATURAMENTO" && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            <span className="font-semibold">Pronto para faturamento.</span> A conversão em pedido e
            a reserva de estoque ocorrem no momento do faturamento.
            {!perfil?.podeFaturar && " Solicite o faturamento a um perfil autorizado."}
          </p>
        </div>
      )}
      {regras.status === "SEM_ESTOQUE" && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          <PackageX className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            <span className="font-semibold">Orçamento sem estoque disponível.</span> Ajuste as
            quantidades ou aguarde reposição — consulte a aba{" "}
            <span className="font-semibold">Estoque</span>.
          </p>
        </div>
      )}
      {regras.status === "AGUARDANDO_LIBERACAO" && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            <span className="font-semibold">Aguardando liberação.</span> O documento está bloqueado
            pelos eventos abaixo até a decisão da gerência.
          </p>
        </div>
      )}
      {regras.faturado && doc.modalidadeEntrega === "RETIRA" && !doc.retiraColetado && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-orange-300 bg-orange-50 px-4 py-3 text-sm text-orange-900">
          <PackageCheck className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            <span className="font-semibold">Pedido retira aguardando coleta</span>
            {doc.dtFat && ` desde ${fmtDate(doc.dtFat)}`}. Cliente ainda não retirou a mercadoria.
          </p>
        </div>
      )}

      {doc.eventos.length > 0 && (
        <div className="mb-4">
          <PainelEventos doc={doc} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        {/* Aside — cliente + cabeçalho + totalizador */}
        <aside className="space-y-4">
          {/* Cliente */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Cliente
                </p>
                <p className="mt-1 truncate text-base font-semibold text-slate-900">
                  {doc.parceiro}
                </p>
                <p className="text-xs text-slate-500">
                  {doc.codParc} · {parceiro?.cnpj ?? ""}
                </p>
              </div>
              {parceiro?.inadimplente && <Pill tone="rose">Inadimplente</Pill>}
            </div>

            {dadosEmp && (
              <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-slate-500">Crédito utilizado ({doc.codEmp})</span>
                  <span className="tabular-nums text-slate-600">
                    {brl(dadosEmp.creditoUtilizado)} / {brl(dadosEmp.limiteCredito)}
                  </span>
                </div>
                <Progress value={usoCreditoPct} className="h-2" />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Disponível</span>
                  <span
                    className={`font-semibold tabular-nums ${
                      creditoDisponivel < total ? "text-rose-600" : "text-emerald-700"
                    }`}
                  >
                    {brl(creditoDisponivel)}
                  </span>
                </div>
                {dadosEmp.creditoDevolucao > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Crédito de depósito/devolução</span>
                    <span className="font-medium tabular-nums text-sky-700">
                      {brl(dadosEmp.creditoDevolucao)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {parceiro && (
              <div className="mt-4 border-t border-slate-100 pt-4 text-xs">
                <p className="font-medium uppercase tracking-wider text-slate-500">
                  Contato de entrega
                </p>
                <p className="mt-1.5 font-medium text-slate-800">
                  {parceiro.contatoEntrega.nome} · {parceiro.contatoEntrega.telefone}
                </p>
                <p className="mt-0.5 text-slate-500">{parceiro.contatoEntrega.endereco}</p>
                <p className="mt-1 text-slate-400">
                  Modalidade:{" "}
                  <span className="font-medium text-slate-600">
                    {doc.modalidadeEntrega === "RETIRA" ? "Retira em balcão" : "Entrega"}
                  </span>
                </p>
              </div>
            )}
          </section>

          {/* Cabeçalho do documento */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Cabeçalho do documento
            </p>
            <dl className="mt-4 space-y-3 text-sm">
              <FieldRow icon={<Receipt className="h-4 w-4" />} label="TOP — Tipo de Operação">
                <select
                  value={doc.codTop}
                  disabled={!regras.podeEditar}
                  onChange={(e) => setTop(e.target.value)}
                  className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-900 outline-none transition-colors hover:border-slate-300 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 disabled:cursor-default disabled:bg-slate-50/50"
                >
                  {perfil &&
                    topsDisponiveis(perfil).map((t) => (
                      <option key={t.codTop} value={t.codTop}>
                        {t.codTop} — {t.descricao}
                        {t.remessa ? " (remessa)" : ""}
                      </option>
                    ))}
                </select>
              </FieldRow>
              <CodedFieldRow
                icon={<Building2 className="h-4 w-4" />}
                label="Empresa"
                code={doc.codEmp}
                value={doc.empresa}
                readOnly
              />
              <EditableRow
                icon={<CalendarClock className="h-4 w-4" />}
                label="Data Neg."
                type="date"
                value={doc.dtNeg}
                readOnly
              />
              <EditableRow
                icon={<User2 className="h-4 w-4" />}
                label="Vendedor"
                value={doc.vendedor}
                readOnly
              />
              <CodedFieldRow
                icon={<Tag className="h-4 w-4" />}
                label="Tipo Neg."
                code={doc.codTipoNegociacao}
                value={doc.tipoNegociacao}
                readOnly
              />
              <CodedFieldRow
                icon={<Layers className="h-4 w-4" />}
                label="Centro de Custo"
                code={doc.codCentroCusto}
                value={doc.centroCusto}
                readOnly
              />
            </dl>
          </section>

          {/* Condição de pagamento */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Condição de pagamento
            </p>
            <div className="mt-3 space-y-2.5">
              <FieldRow icon={<Wallet className="h-4 w-4" />} label="Condição">
                <select
                  value={doc.codCondicao}
                  disabled={!regras.podeEditar}
                  onChange={(e) => trocarCondicao(e.target.value)}
                  className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-900 outline-none transition-colors hover:border-slate-300 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 disabled:cursor-default disabled:bg-slate-50/50"
                >
                  {condicoesMock.map((c) => (
                    <option key={c.codigo} value={c.codigo}>
                      {c.codigo} — {c.descricao} ({c.parcelas}x)
                    </option>
                  ))}
                </select>
              </FieldRow>
              <p className="text-xs text-slate-500">
                Alterar a condição recalcula automaticamente os preços dos itens.
              </p>
              {doc.condicaoAnterior && regras.podeEditar && (
                <button
                  onClick={restaurar}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-sky-300 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700 transition-colors hover:bg-sky-100"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Restaurar preços da condição {doc.condicaoAnterior.codigo}
                </button>
              )}
            </div>
          </section>

          {/* Totalizador */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Totalizador financeiro
            </p>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Subtotal (bruto)</dt>
                <dd className="tabular-nums text-slate-900">{brl(subtotalBruto)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Descontos</dt>
                <dd className="tabular-nums text-slate-500">
                  - {brl(totalDesc + (calcTotalItens(doc.itens) - total))}
                </dd>
              </div>
              <div className="mt-2 flex items-baseline justify-between border-t border-slate-100 pt-3">
                <dt className="font-medium text-slate-600">Valor total</dt>
                <dd className="text-xl font-semibold tabular-nums text-slate-900">{brl(total)}</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-slate-500">
              {doc.itens.length} {doc.itens.length === 1 ? "item" : "itens"} · Comissão{" "}
              {doc.comissaoPct}%
            </p>
            {doc.tipo === "ORCAMENTO" && !regras.expirado && (
              <p className="mt-1 text-xs text-slate-500">
                Validade:{" "}
                <span className={`font-medium ${dias <= 3 ? "text-amber-600" : "text-slate-700"}`}>
                  {dias} dia(s) restante(s)
                </span>
              </p>
            )}
            {doc.dtFat && (
              <p className="mt-1 text-xs text-slate-500">
                Faturado em <span className="font-medium text-slate-700">{fmtDate(doc.dtFat)}</span>
              </p>
            )}
            {doc.chaveNfe && (
              <p className="mt-2 break-all text-[11px] text-slate-400">
                <span className="font-medium text-slate-500">Chave NFe:</span>{" "}
                <span className="font-mono">{doc.chaveNfe}</span>
              </p>
            )}
          </section>

          {doc.observacao && (
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Observação
              </p>
              <p className="mt-2 text-sm text-slate-700">{doc.observacao}</p>
            </section>
          )}
        </aside>

        {/* Conteúdo principal — abas */}
        <div className="min-w-0">
          <Tabs defaultValue="itens">
            <TabsList className="mb-4 h-auto rounded-lg bg-green-100 p-1 text-green-700">
              {[
                { v: "itens", label: "Itens" },
                { v: "totais", label: "Totais e Comissão" },
                { v: "estoque", label: "Estoque" },
                { v: "transporte", label: "Transporte" },
                { v: "financeiro", label: "Financeiro" },
                { v: "historico", label: "Histórico" },
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
            <TabsContent value="itens">
              <AbaItens doc={doc} regras={regras} />
            </TabsContent>
            <TabsContent value="totais">
              <AbaTotais doc={doc} regras={regras} />
            </TabsContent>
            <TabsContent value="estoque">
              <AbaEstoque doc={doc} />
            </TabsContent>
            <TabsContent value="transporte">
              <AbaTransporte doc={doc} />
            </TabsContent>
            <TabsContent value="financeiro">
              <AbaFinanceiro doc={doc} />
            </TabsContent>
            <TabsContent value="historico">
              <AbaHistorico doc={doc} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <DialogAnexos doc={doc} open={anexosAberto} onOpenChange={setAnexosAberto} />
      <DialogDuplicar
        doc={duplicarAberto ? doc : null}
        open={duplicarAberto}
        onOpenChange={setDuplicarAberto}
      />
      <DialogImpressao doc={doc} open={imprimirAberto} onOpenChange={setImprimirAberto} />
    </div>
  );
}
