/* Tipos de domínio do Portal de Vendas (mock estilo Sankhya) */

/* ── Organização ─────────────────────────────────────────── */
export interface Empresa {
  codEmp: string;
  nome: string;
  cidade: string;
  uf: string;
  cnpj: string;
}

export interface LocalEstoque {
  codLocal: string;
  descricao: string;
  pce: boolean; // locais de controle do PCE (bloqueados p/ vendedores)
}

export interface Top {
  codTop: string;
  descricao: string;
  remessa: boolean; // TOPs de remessa p/ consumo (uso restrito)
}

/* ── Usuários e permissões ───────────────────────────────── */
export type CardDashboard = "flow" | "retira" | "powerbi" | "liberacoes" | "agenda";

export interface Perfil {
  nome: string;
  empresasAutorizadas: string[];
  linhasProdutoAutorizadas: string[];
  locaisEstoqueBloqueados: string[]; // codLocal
  topsPermitidas: string[]; // codTop
  podeAprovarLiberacoes: boolean;
  podeAprovarFlow: boolean;
  podeConfigurarLimites: boolean;
  podeFaturar: boolean;
  cardsDashboard: CardDashboard[];
}

export interface Usuario {
  id: string;
  nome: string;
  iniciais: string;
  cargo: string;
  email: string;
  perfil: Perfil;
}

/* ── Parceiros ───────────────────────────────────────────── */
export interface ContatoEntrega {
  nome: string;
  telefone: string;
  email: string;
  endereco: string;
}

export interface ParceiroEmpresaDados {
  codEmp: string;
  limiteCredito: number;
  creditoUtilizado: number;
  creditoDevolucao: number; // crédito de depósito/devolução
  codCondicaoPadrao: string;
  vendedorPadrao: string;
}

export interface Parceiro {
  codParc: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  cidade: string;
  uf: string;
  telefone: string;
  email: string;
  endereco: string;
  inadimplente: boolean;
  ultimaCompra?: string; // ISO date — p/ evento de tempo inativo
  /* Modelo TGFPAR (Sankhya) */
  codParcMatriz?: string; // parceiro matriz — filiais apontam p/ a matriz
  tipoPessoa?: "J" | "F"; // jurídica/física (padrão: J)
  inscricaoEstadual?: string;
  cliente?: boolean; // padrão: true
  fornecedor?: boolean; // padrão: false
  contatoEntrega: ContatoEntrega;
  dadosPorEmpresa: ParceiroEmpresaDados[]; // cadastro único, dados segregados
}

/* ── Produtos e estoque ──────────────────────────────────── */
export interface EstoqueLocal {
  codEmp: string;
  codLocal: string;
  disponivel: number;
  reservado: number;
}

export interface Produto {
  codProd: string;
  descricao: string;
  unidade: string;
  linhaProduto: string;
  precoBase: number;
  precoMinimo: number;
  estoques: EstoqueLocal[];
}

/* ── Condições de pagamento ──────────────────────────────── */
export interface CondicaoPagamento {
  codigo: string;
  descricao: string;
  parcelas: number;
  /** multiplicador aplicado sobre o preço base ao selecionar a condição */
  fatorPreco: number;
}

/* ── Eventos de bloqueio/liberação ───────────────────────── */
export type EventoTipo =
  | "VALOR_MINIMO"
  | "PRECO_MINIMO"
  | "COMISSAO_REDUZIDA"
  | "LIMITE_CREDITO"
  | "INADIMPLENTE"
  | "DESCONTO_ITEM_NOTA"
  | "DESCONTO_PRODUTO"
  | "TEMPO_INATIVO";

export type EventoStatus = "PENDENTE" | "LIBERADO" | "RECUSADO";

export interface EventoOcorrencia {
  id: string;
  tipo: EventoTipo;
  descricao: string;
  status: EventoStatus;
  solicitadoEm: string; // ISO datetime
  resolvidoPor?: string;
  resolvidoEm?: string;
  motivoRecusa?: string; // obrigatório ao recusar
}

/* ── Documento (orçamento/pedido unificado) ──────────────── */
export type DocumentoTipo = "ORCAMENTO" | "PEDIDO";

export type DocumentoStatus =
  | "ORCAMENTO_ABERTO"
  | "ORCAMENTO_EXPIRADO"
  | "AGUARDANDO_LIBERACAO"
  | "PRONTO_FATURAMENTO"
  | "SEM_ESTOQUE"
  | "PEDIDO_ABERTO"
  | "PEDIDO_FATURADO"
  | "CANCELADO";

export interface DocumentoItem {
  id: string;
  codProd: string;
  descricao: string;
  unidade: string;
  linhaProduto: string;
  quantidade: number;
  precoBase: number; // preço de tabela vigente no documento
  precoUnitario: number; // preço praticado (digitado/calculado)
  descontoPct: number;
  /** Preço Alternativo de Venda — mutuamente exclusivo com descontoPct */
  precoAlternativo: number | null;
}

export type ModalidadeEntrega = "ENTREGA" | "RETIRA";

export interface Documento {
  nunota: number; // Nro. Único (chave interna)
  /** NUMNOTA — número do documento; 0 até a geração da nota (faturamento) */
  numNota: number;
  tipo: DocumentoTipo;
  status: DocumentoStatus;
  codParc: string;
  parceiro: string;
  codEmp: string;
  empresa: string;
  codTop: string;
  top: string;
  codTipoNegociacao: string;
  tipoNegociacao: string;
  codCentroCusto: string;
  centroCusto: string;
  codNatureza: string;
  natureza: string;
  dtNeg: string; // ISO date — validade do orçamento = dtNeg + 10 dias
  vendedor: string;
  comissaoPct: number;
  comissaoReduzida: boolean;
  codCondicao: string;
  /** snapshot p/ botão "restaurar preços da condição anterior" */
  condicaoAnterior?: { codigo: string; precos: Record<string, number> };
  descontoCabecalhoPct: number; // desconto aplicado na aba de totais
  duplicadoDe?: number;
  /** flag da duplicação: true = cadeia de preços atualizada; false = só preço base */
  precosAtualizados?: boolean;
  modalidadeEntrega: ModalidadeEntrega;
  retiraColetado?: boolean; // p/ card "Pedidos Retira Não Coletados"
  dtFat?: string;
  chaveNfe?: string;
  observacao?: string;
  eventos: EventoOcorrencia[];
  itens: DocumentoItem[];
}

/* ── Histórico de alterações ─────────────────────────────── */
export interface HistoricoAlteracao {
  id: string;
  nunota: number;
  dataHora: string; // ISO datetime
  usuario: string;
  acao: string;
  campo?: string;
  de?: string;
  para?: string;
}

/* ── Flow — Cadastro de Parceiros ────────────────────────── */
export type FlowEtapa = 0 | 1 | 2 | 3; // Solicitado → Análise Cadastral → Análise de Crédito → Concluído
export type FlowResultado = "EM_ANDAMENTO" | "APROVADO" | "REPROVADO";

export interface FlowAprovacao {
  etapa: FlowEtapa;
  aprovador: string;
  dataHora: string;
  parecer: string;
  resultado: "APROVADO" | "REPROVADO";
}

export interface SolicitacaoFlow {
  id: string;
  razaoSocial: string;
  cnpj: string;
  cidade: string;
  uf: string;
  telefone: string;
  email: string;
  codEmp: string;
  solicitante: string;
  dtSolicitacao: string; // ISO datetime
  etapa: FlowEtapa;
  resultado: FlowResultado;
  aprovacoes: FlowAprovacao[];
}

/* ── Telemarketing ───────────────────────────────────────── */
export type TipoCompromisso = "Ligação" | "Visita" | "Retorno" | "Reunião";

export interface CompromissoAgenda {
  id: string;
  data: string; // ISO date
  hora: string; // HH:mm
  codParc?: string;
  parceiro: string;
  assunto: string;
  tipo: TipoCompromisso;
  responsavel: string;
  concluido: boolean;
}

export type ResultadoLigacao =
  "Sem contato" | "Retornar depois" | "Orçamento gerado" | "Sem interesse";

export interface AtividadeTelemarketing {
  id: string;
  codParc: string;
  parceiro: string;
  telefone: string;
  motivo: string;
  responsavel: string;
  status: "PENDENTE" | "REGISTRADA";
  resultado?: ResultadoLigacao;
  observacao?: string;
  registradaEm?: string; // ISO datetime
  nunotaGerado?: number;
}

/* ── Liberação de limites — configuração ─────────────────── */
export interface RegraLimite {
  id: string;
  eventoTipo: EventoTipo;
  descricao: string;
  parametro: string;
  valor: number;
  unidade: "R$" | "%" | "dias";
}

/* ── Anexos / transporte / financeiro (legado) ───────────── */
export interface DocumentoAnexado {
  nunota: number;
  sequencia: number;
  nomeArquivo: string;
  extensao: string;
  tamanhoBytes: number;
  usuario: string;
  dataHora: string;
}

export type SituacaoTransporte = "A Faturar" | "Faturado" | "Em Transporte" | "Entregue";

export interface Transporte {
  nunota: number;
  transportadora: string;
  placa: string;
  volumes: number;
  pesoKg: number;
  dtEmbarque: string;
  situacao: SituacaoTransporte;
}

export type SituacaoFinanceiro = "Pago" | "Pendente" | "Vencido";

export interface TituloFinanceiro {
  nunota: number;
  parcela: number;
  valor: number;
  dtVencimento: string;
  situacao: SituacaoFinanceiro;
  dtPagamento?: string;
}
