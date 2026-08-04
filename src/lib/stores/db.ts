import {
  atividadesTelemarketingMock,
  avaliarEventos,
  calcDocumentoTotal,
  compromissosMock,
  condicaoPorCodigo,
  documentosAnexadosMock,
  documentosMock,
  financeiroMock,
  historicoMock,
  hojeISO,
  parceirosMock,
  produtosMock,
  regrasLimiteMock,
  solicitacoesFlowMock,
  transportesMock,
} from "@/lib/mock";
import type {
  AtividadeTelemarketing,
  CompromissoAgenda,
  Documento,
  DocumentoAnexado,
  DocumentoItem,
  EventoStatus,
  FlowEtapa,
  HistoricoAlteracao,
  Parceiro,
  Produto,
  RegraLimite,
  ResultadoLigacao,
  SolicitacaoFlow,
  TituloFinanceiro,
  Transporte,
  Usuario,
} from "@/lib/mock";
import { createStore } from "./create-store";

/* ─────────────────────────────────────────────────────────────
   "Banco Sankhya" em memória. Toda mutação passa por uma ação
   nomeada (transação) que também alimenta o histórico de
   alterações — base da aba "Histórico" dos documentos.
   ───────────────────────────────────────────────────────────── */

export interface DbState {
  documentos: Documento[];
  parceiros: Parceiro[];
  produtos: Produto[];
  solicitacoesFlow: SolicitacaoFlow[];
  compromissos: CompromissoAgenda[];
  atividadesTm: AtividadeTelemarketing[];
  regrasLimite: RegraLimite[];
  historico: HistoricoAlteracao[];
  anexados: DocumentoAnexado[];
  transportes: Transporte[];
  financeiro: TituloFinanceiro[];
  proximoNunota: number;
}

const seed = (): DbState => ({
  documentos: documentosMock,
  parceiros: parceirosMock,
  produtos: produtosMock,
  solicitacoesFlow: solicitacoesFlowMock,
  compromissos: compromissosMock,
  atividadesTm: atividadesTelemarketingMock,
  regrasLimite: regrasLimiteMock,
  historico: historicoMock,
  anexados: documentosAnexadosMock,
  transportes: transportesMock,
  financeiro: financeiroMock,
  proximoNunota: 100250,
});

export const dbStore = createStore<DbState>(seed(), "portal_db_v1");

/* ── infra ───────────────────────────────────────────────── */

let seqHistorico = 0;
const novoHistorico = (
  nunota: number,
  usuario: string,
  acao: string,
  campo?: string,
  de?: string,
  para?: string,
): HistoricoAlteracao => ({
  id: `h-${Date.now()}-${seqHistorico++}`,
  nunota,
  dataHora: new Date().toISOString(),
  usuario,
  acao,
  campo,
  de,
  para,
});

function patchDocumento(
  nunota: number,
  patch: Partial<Documento> | ((d: Documento) => Partial<Documento>),
  entrada?: HistoricoAlteracao,
) {
  dbStore.setState((s) => ({
    documentos: s.documentos.map((d) =>
      d.nunota === nunota ? { ...d, ...(typeof patch === "function" ? patch(d) : patch) } : d,
    ),
    historico: entrada ? [...s.historico, entrada] : s.historico,
  }));
}

export const documentoPorNunota = (s: DbState, nunota: number) =>
  s.documentos.find((d) => d.nunota === nunota);

/* ── documentos: cabeçalho e itens ───────────────────────── */

export function registrarAlteracao(
  nunota: number,
  usuario: Usuario,
  acao: string,
  campo?: string,
  de?: string,
  para?: string,
) {
  dbStore.setState((s) => ({
    historico: [...s.historico, novoHistorico(nunota, usuario.nome, acao, campo, de, para)],
  }));
}

export function atualizarCabecalho(
  nunota: number,
  patch: Partial<Documento>,
  usuario: Usuario,
  descricaoCampo: string,
  de: string,
  para: string,
) {
  patchDocumento(
    nunota,
    patch,
    novoHistorico(nunota, usuario.nome, "Cabeçalho alterado", descricaoCampo, de, para),
  );
}

/** Regra: Desconto e Preço Alternativo são exclusivos por item —
 *  ao preencher um, o outro é zerado. */
export function atualizarItem(
  nunota: number,
  itemId: string,
  patch: Partial<DocumentoItem>,
  usuario: Usuario,
) {
  const doc = documentoPorNunota(dbStore.getState(), nunota);
  const item = doc?.itens.find((i) => i.id === itemId);
  if (!doc || !item) return;

  const efetivo: Partial<DocumentoItem> = { ...patch };
  if (patch.precoAlternativo != null && patch.precoAlternativo > 0) efetivo.descontoPct = 0;
  if (patch.descontoPct != null && patch.descontoPct > 0) efetivo.precoAlternativo = null;

  const campos = Object.keys(patch) as (keyof DocumentoItem)[];
  const campo = campos[0];
  patchDocumento(
    nunota,
    (d) => ({ itens: d.itens.map((i) => (i.id === itemId ? { ...i, ...efetivo } : i)) }),
    novoHistorico(
      nunota,
      usuario.nome,
      "Item alterado",
      `${item.descricao} — ${String(campo)}`,
      String(item[campo] ?? "—"),
      String(patch[campo] ?? "—"),
    ),
  );
}

export function adicionarItem(nunota: number, item: DocumentoItem, usuario: Usuario) {
  patchDocumento(
    nunota,
    (d) => ({ itens: [...d.itens, item] }),
    novoHistorico(
      nunota,
      usuario.nome,
      "Item incluído",
      item.descricao,
      "—",
      `${item.quantidade} ${item.unidade}`,
    ),
  );
}

/** Exclusão permitida apenas em orçamentos — em pedidos vai para o PCE. */
export function removerItem(nunota: number, itemId: string, usuario: Usuario): boolean {
  const doc = documentoPorNunota(dbStore.getState(), nunota);
  if (!doc || doc.tipo === "PEDIDO") return false;
  const item = doc.itens.find((i) => i.id === itemId);
  patchDocumento(
    nunota,
    (d) => ({ itens: d.itens.filter((i) => i.id !== itemId) }),
    novoHistorico(nunota, usuario.nome, "Item removido", item?.descricao ?? itemId),
  );
  return true;
}

/* ── criação / duplicação ────────────────────────────────── */

export function criarOrcamento(
  parceiro: Parceiro,
  codEmp: string,
  empresa: string,
  usuario: Usuario,
): number {
  const s = dbStore.getState();
  const nunota = s.proximoNunota;
  const dadosEmp = parceiro.dadosPorEmpresa.find((d) => d.codEmp === codEmp);
  const doc: Documento = {
    nunota,
    tipo: "ORCAMENTO",
    status: "ORCAMENTO_ABERTO",
    codParc: parceiro.codParc,
    parceiro: parceiro.razaoSocial,
    codEmp,
    empresa,
    codTop: "1010",
    top: "Venda de Mercadoria",
    codTipoNegociacao: "TN-01",
    tipoNegociacao: "Venda Interna",
    codCentroCusto: "CC-01",
    centroCusto: "Comercial",
    codNatureza: "1.01.001",
    natureza: "Receita de Venda",
    dtNeg: hojeISO(),
    vendedor: usuario.nome,
    comissaoPct: 5,
    comissaoReduzida: false,
    codCondicao: dadosEmp?.codCondicaoPadrao ?? "30D",
    descontoCabecalhoPct: 0,
    modalidadeEntrega: "ENTREGA",
    eventos: [],
    itens: [],
  };
  dbStore.setState({
    documentos: [...s.documentos, doc],
    proximoNunota: nunota + 1,
    historico: [...s.historico, novoHistorico(nunota, usuario.nome, "Orçamento criado")],
  });
  return nunota;
}

/**
 * Duplicação de orçamento (pedidos nunca são duplicáveis):
 *  - flag ligada: atualiza toda a cadeia de preços (base + praticado);
 *  - flag desligada: atualiza somente o preço base;
 *  - sempre mantém descontos, comissão reduzida e ajustes do original.
 */
export function duplicarOrcamento(
  nunotaOrigem: number,
  atualizarCadeia: boolean,
  usuario: Usuario,
): number | null {
  const s = dbStore.getState();
  const origem = documentoPorNunota(s, nunotaOrigem);
  if (!origem || origem.tipo !== "ORCAMENTO") return null;

  const fator = condicaoPorCodigo(origem.codCondicao).fatorPreco;
  const nunota = s.proximoNunota;
  const itens = origem.itens.map((item) => {
    const produto = s.produtos.find((p) => p.codProd === item.codProd);
    const baseAtual = produto?.precoBase ?? item.precoBase;
    return {
      ...item,
      precoBase: baseAtual,
      // cadeia completa recalcula o praticado; senão preserva o digitado (preço líquido)
      precoUnitario: atualizarCadeia
        ? Math.round(baseAtual * fator * 100) / 100
        : item.precoUnitario,
    };
  });

  const novo: Documento = {
    ...origem,
    nunota,
    status: "ORCAMENTO_ABERTO",
    dtNeg: hojeISO(),
    duplicadoDe: nunotaOrigem,
    precosAtualizados: atualizarCadeia,
    condicaoAnterior: undefined,
    dtFat: undefined,
    chaveNfe: undefined,
    eventos: [],
    itens,
  };
  dbStore.setState({
    documentos: [...s.documentos, novo],
    proximoNunota: nunota + 1,
    historico: [
      ...s.historico,
      novoHistorico(
        nunota,
        usuario.nome,
        `Duplicado do orçamento ${nunotaOrigem} (${
          atualizarCadeia ? "cadeia de preços atualizada" : "apenas preço base atualizado"
        })`,
      ),
    ],
  });
  return nunota;
}

/* ── condição de pagamento ───────────────────────────────── */

/** Troca a condição e recalcula os preços pela nova condição,
 *  guardando snapshot p/ o botão "restaurar preços". */
export function alterarCondicaoPagamento(nunota: number, novoCodigo: string, usuario: Usuario) {
  const doc = documentoPorNunota(dbStore.getState(), nunota);
  if (!doc || doc.codCondicao === novoCodigo) return;
  const fator = condicaoPorCodigo(novoCodigo).fatorPreco;
  const snapshot: Record<string, number> = {};
  doc.itens.forEach((i) => (snapshot[i.id] = i.precoUnitario));

  patchDocumento(
    nunota,
    (d) => ({
      codCondicao: novoCodigo,
      condicaoAnterior: { codigo: d.codCondicao, precos: snapshot },
      itens: d.itens.map((i) => ({
        ...i,
        precoUnitario: Math.round(i.precoBase * fator * 100) / 100,
      })),
    }),
    novoHistorico(
      nunota,
      usuario.nome,
      "Condição de pagamento alterada (preços recalculados)",
      "Condição",
      doc.codCondicao,
      novoCodigo,
    ),
  );
}

export function restaurarCondicaoAnterior(nunota: number, usuario: Usuario) {
  const doc = documentoPorNunota(dbStore.getState(), nunota);
  if (!doc?.condicaoAnterior) return;
  const { codigo, precos } = doc.condicaoAnterior;
  patchDocumento(
    nunota,
    (d) => ({
      codCondicao: codigo,
      condicaoAnterior: undefined,
      itens: d.itens.map((i) => ({ ...i, precoUnitario: precos[i.id] ?? i.precoUnitario })),
    }),
    novoHistorico(
      nunota,
      usuario.nome,
      "Preços da condição anterior restaurados",
      "Condição",
      doc.codCondicao,
      codigo,
    ),
  );
}

/* ── estoque ─────────────────────────────────────────────── */

export function estoqueDisponivel(s: DbState, codProd: string, codEmp: string): number {
  const produto = s.produtos.find((p) => p.codProd === codProd);
  if (!produto) return 0;
  return produto.estoques
    .filter((e) => e.codEmp === codEmp)
    .reduce((acc, e) => acc + e.disponivel, 0);
}

export function itensSemEstoque(s: DbState, doc: Documento): DocumentoItem[] {
  return doc.itens.filter((i) => estoqueDisponivel(s, i.codProd, doc.codEmp) < i.quantidade);
}

/* ── confirmação / eventos / faturamento ─────────────────── */

export type ResultadoConfirmacao =
  | { resultado: "PRONTO" }
  | { resultado: "SEM_ESTOQUE"; itens: DocumentoItem[] }
  | { resultado: "AGUARDANDO_LIBERACAO"; eventos: number };

/** "Confirmar para faturamento": roda a régua de eventos de bloqueio
 *  e a checagem de estoque, definindo o status resultante. */
export function confirmarParaFaturamento(
  nunota: number,
  usuario: Usuario,
): ResultadoConfirmacao | null {
  const s = dbStore.getState();
  const doc = documentoPorNunota(s, nunota);
  if (!doc) return null;

  const semEstoque = itensSemEstoque(s, doc);
  if (semEstoque.length > 0) {
    patchDocumento(
      nunota,
      { status: "SEM_ESTOQUE" },
      novoHistorico(nunota, usuario.nome, "Confirmação bloqueada — itens sem estoque disponível"),
    );
    return { resultado: "SEM_ESTOQUE", itens: semEstoque };
  }

  const parceiro = s.parceiros.find((p) => p.codParc === doc.codParc);
  const eventos = avaliarEventos(doc, parceiro, s.produtos, s.regrasLimite);
  if (eventos.length > 0) {
    patchDocumento(
      nunota,
      { status: "AGUARDANDO_LIBERACAO", eventos },
      novoHistorico(nunota, usuario.nome, `Enviado para liberação (${eventos.length} eventos)`),
    );
    return { resultado: "AGUARDANDO_LIBERACAO", eventos: eventos.length };
  }

  patchDocumento(
    nunota,
    { status: "PRONTO_FATURAMENTO" },
    novoHistorico(nunota, usuario.nome, "Confirmado — pronto para faturamento"),
  );
  return { resultado: "PRONTO" };
}

/** Libera/recusa um evento. Último liberado → PRONTO_FATURAMENTO;
 *  qualquer recusa → volta para orçamento aberto (ajustar e reenviar). */
export function resolverEvento(
  nunota: number,
  eventoId: string,
  decisao: Extract<EventoStatus, "LIBERADO" | "RECUSADO">,
  usuario: Usuario,
) {
  const doc = documentoPorNunota(dbStore.getState(), nunota);
  if (!doc) return;
  const evento = doc.eventos.find((e) => e.id === eventoId);
  if (!evento || evento.status !== "PENDENTE") return;

  const eventos = doc.eventos.map((e) =>
    e.id === eventoId
      ? { ...e, status: decisao, resolvidoPor: usuario.nome, resolvidoEm: new Date().toISOString() }
      : e,
  );
  const pendentes = eventos.filter((e) => e.status === "PENDENTE").length;
  const recusado = eventos.some((e) => e.status === "RECUSADO");
  const status =
    pendentes > 0 ? "AGUARDANDO_LIBERACAO" : recusado ? "ORCAMENTO_ABERTO" : "PRONTO_FATURAMENTO";

  patchDocumento(
    nunota,
    { status, eventos },
    novoHistorico(
      nunota,
      usuario.nome,
      decisao === "LIBERADO" ? "Evento liberado" : "Evento recusado",
      evento.descricao,
    ),
  );
}

const gerarChaveNfe = () =>
  Array.from({ length: 44 }, () => Math.floor(Math.random() * 10)).join("");

/**
 * Faturamento: momento em que o orçamento vira pedido, o estoque é
 * reservado/baixado e o crédito do parceiro é consumido (regra 6.2 do PDF).
 */
export function faturarPedido(nunota: number, usuario: Usuario): boolean {
  const s = dbStore.getState();
  const doc = documentoPorNunota(s, nunota);
  if (!doc) return false;

  const total = calcDocumentoTotal(doc);
  const chave = gerarChaveNfe();

  // baixa de estoque por item (nos locais da empresa do documento)
  const produtos = s.produtos.map((p) => {
    const item = doc.itens.find((i) => i.codProd === p.codProd);
    if (!item) return p;
    let restante = item.quantidade;
    const estoques = p.estoques.map((e) => {
      if (e.codEmp !== doc.codEmp || restante <= 0) return e;
      const baixa = Math.min(e.disponivel, restante);
      restante -= baixa;
      return { ...e, disponivel: e.disponivel - baixa, reservado: e.reservado + baixa };
    });
    return { ...p, estoques };
  });

  // consumo de crédito do parceiro na empresa
  const parceiros = s.parceiros.map((p) =>
    p.codParc === doc.codParc
      ? {
          ...p,
          ultimaCompra: hojeISO(),
          dadosPorEmpresa: p.dadosPorEmpresa.map((d) =>
            d.codEmp === doc.codEmp ? { ...d, creditoUtilizado: d.creditoUtilizado + total } : d,
          ),
        }
      : p,
  );

  // títulos financeiros conforme a condição
  const condicao = condicaoPorCodigo(doc.codCondicao);
  const valorParcela = Math.round((total / condicao.parcelas) * 100) / 100;
  const titulos: TituloFinanceiro[] = Array.from({ length: condicao.parcelas }, (_, i) => {
    const venc = new Date();
    venc.setDate(venc.getDate() + 30 * (i + (condicao.codigo === "AV" ? 0 : 1)));
    return {
      nunota,
      parcela: i + 1,
      valor: valorParcela,
      dtVencimento: venc.toISOString().slice(0, 10),
      situacao: "Pendente" as const,
    };
  });

  dbStore.setState({
    produtos,
    parceiros,
    financeiro: [...s.financeiro, ...titulos],
    documentos: s.documentos.map((d) =>
      d.nunota === nunota
        ? {
            ...d,
            tipo: "PEDIDO" as const,
            status: "PEDIDO_FATURADO" as const,
            dtFat: hojeISO(),
            chaveNfe: chave,
          }
        : d,
    ),
    historico: [
      ...s.historico,
      novoHistorico(
        nunota,
        usuario.nome,
        "Faturado — orçamento convertido em pedido, estoque reservado e NFe emitida",
      ),
    ],
  });
  return true;
}

export function marcarRetiraColetado(nunota: number, usuario: Usuario) {
  patchDocumento(
    nunota,
    { retiraColetado: true },
    novoHistorico(nunota, usuario.nome, "Retira — coleta registrada no balcão"),
  );
}

/* ── anexos ──────────────────────────────────────────────── */

export function anexarDocumento(anexo: DocumentoAnexado) {
  dbStore.setState((s) => ({ anexados: [...s.anexados, anexo] }));
}

/* ── Flow — cadastro de parceiros ────────────────────────── */

export function criarSolicitacaoFlow(
  dados: Pick<
    SolicitacaoFlow,
    "razaoSocial" | "cnpj" | "cidade" | "uf" | "telefone" | "email" | "codEmp"
  >,
  usuario: Usuario,
): string {
  const id = `FLW-${2032 + dbStore.getState().solicitacoesFlow.length}`;
  const solicitacao: SolicitacaoFlow = {
    ...dados,
    id,
    solicitante: usuario.nome,
    dtSolicitacao: new Date().toISOString(),
    etapa: 0,
    resultado: "EM_ANDAMENTO",
    aprovacoes: [],
  };
  dbStore.setState((s) => ({ solicitacoesFlow: [solicitacao, ...s.solicitacoesFlow] }));
  return id;
}

/** Aprova/reprova a etapa atual; aprovação da Análise de Crédito
 *  conclui o Flow e cria o parceiro no cadastro único. */
export function decidirEtapaFlow(
  id: string,
  decisao: "APROVADO" | "REPROVADO",
  parecer: string,
  usuario: Usuario,
) {
  const s = dbStore.getState();
  const sol = s.solicitacoesFlow.find((f) => f.id === id);
  if (!sol || sol.resultado !== "EM_ANDAMENTO") return;

  const etapaDecidida = (sol.etapa + 1) as FlowEtapa; // decide a próxima etapa do stepper
  const aprovacoes = [
    ...sol.aprovacoes,
    {
      etapa: etapaDecidida,
      aprovador: usuario.nome,
      dataHora: new Date().toISOString(),
      parecer,
      resultado: decisao,
    },
  ];

  let parceiros = s.parceiros;
  let resultado: SolicitacaoFlow["resultado"] = "EM_ANDAMENTO";
  let etapa: FlowEtapa = etapaDecidida;

  if (decisao === "REPROVADO") {
    resultado = "REPROVADO";
    etapa = 3;
  } else if (etapaDecidida >= 2) {
    // crédito aprovado → conclui e cria o parceiro
    resultado = "APROVADO";
    etapa = 3;
    const codParc = `PARC-${7000 + s.parceiros.length}`;
    parceiros = [
      ...s.parceiros,
      {
        codParc,
        razaoSocial: sol.razaoSocial,
        nomeFantasia: sol.razaoSocial.split(" ").slice(0, 2).join(" "),
        cnpj: sol.cnpj,
        cidade: sol.cidade,
        uf: sol.uf,
        telefone: sol.telefone,
        email: sol.email,
        endereco: "—",
        inadimplente: false,
        ultimaCompra: undefined,
        contatoEntrega: { nome: "—", telefone: sol.telefone, email: sol.email, endereco: "—" },
        dadosPorEmpresa: [
          {
            codEmp: sol.codEmp,
            limiteCredito: 20_000,
            creditoUtilizado: 0,
            creditoDevolucao: 0,
            codCondicaoPadrao: "30D",
            vendedorPadrao: sol.solicitante,
          },
        ],
      },
    ];
  }

  dbStore.setState({
    parceiros,
    solicitacoesFlow: s.solicitacoesFlow.map((f) =>
      f.id === id ? { ...f, etapa, resultado, aprovacoes } : f,
    ),
  });
}

/* ── Telemarketing ───────────────────────────────────────── */

export function registrarAtividadeTm(
  id: string,
  resultado: ResultadoLigacao,
  observacao: string,
  nunotaGerado?: number,
) {
  dbStore.setState((s) => ({
    atividadesTm: s.atividadesTm.map((a) =>
      a.id === id
        ? {
            ...a,
            status: "REGISTRADA" as const,
            resultado,
            observacao,
            nunotaGerado,
            registradaEm: new Date().toISOString(),
          }
        : a,
    ),
  }));
}

export function alternarCompromisso(id: string) {
  dbStore.setState((s) => ({
    compromissos: s.compromissos.map((c) => (c.id === id ? { ...c, concluido: !c.concluido } : c)),
  }));
}

/* ── Configuração de limites ─────────────────────────────── */

export function atualizarRegraLimite(id: string, valor: number) {
  dbStore.setState((s) => ({
    regrasLimite: s.regrasLimite.map((r) => (r.id === id ? { ...r, valor } : r)),
  }));
}

/* ── Reset da demo ───────────────────────────────────────── */

export function resetarDemo() {
  dbStore.reset();
}
