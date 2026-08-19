import type { Documento, DocumentoItem, DocumentoStatus } from "./types";

/* ── Formatação ──────────────────────────────────────────── */
export const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const fmtDate = (iso: string) => new Date(iso + "T00:00:00").toLocaleDateString("pt-BR");

export const fmtDateTime = (iso: string) => new Date(iso).toLocaleString("pt-BR");

export const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/* ── Datas relativas (mantêm o mock sempre "fresco") ─────── */
const isoDate = (d: Date) => d.toISOString().slice(0, 10);

export function diasAtras(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return isoDate(d);
}

export function diasAFrente(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return isoDate(d);
}

export function hojeISO(): string {
  return isoDate(new Date());
}

/* ── Simulação de processamento (POC) ────────────────────── */
/**
 * Delay artificial para simular chamadas reais ao ERP.
 * Aleatório entre min/max, sempre limitado a 5s.
 */
export function delayOperacao(minMs = 600, maxMs = 2000): Promise<void> {
  const ms = Math.min(5000, minMs + Math.random() * (maxMs - minMs));
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* ── Cálculos de documento ───────────────────────────────── */
export function precoLiquidoItem(item: DocumentoItem): number {
  // Preço Alternativo e Desconto são regras independentes e exclusivas por item
  if (item.precoAlternativo != null) return item.precoAlternativo;
  return item.precoUnitario * (1 - item.descontoPct / 100);
}

export function calcItemTotal(item: DocumentoItem): number {
  return item.quantidade * precoLiquidoItem(item);
}

export function calcSubtotalBruto(itens: DocumentoItem[]): number {
  return itens.reduce((acc, it) => acc + it.quantidade * it.precoUnitario, 0);
}

export function calcTotalItens(itens: DocumentoItem[]): number {
  return itens.reduce((acc, it) => acc + calcItemTotal(it), 0);
}

export function calcDocumentoTotal(doc: Pick<Documento, "itens" | "descontoCabecalhoPct">): number {
  return calcTotalItens(doc.itens) * (1 - (doc.descontoCabecalhoPct ?? 0) / 100);
}

/* ── Validade do orçamento (10 dias a partir da Data Neg.) ─ */
export const VALIDADE_ORCAMENTO_DIAS = 10;

export function dataValidade(doc: Pick<Documento, "dtNeg">): Date {
  const d = new Date(doc.dtNeg + "T23:59:59");
  d.setDate(d.getDate() + VALIDADE_ORCAMENTO_DIAS);
  return d;
}

export function diasParaExpirar(doc: Pick<Documento, "dtNeg">): number {
  const diff = dataValidade(doc).getTime() - Date.now();
  return Math.ceil(diff / 86_400_000);
}

export function isOrcamentoExpirado(doc: Pick<Documento, "dtNeg" | "tipo">): boolean {
  return doc.tipo === "ORCAMENTO" && diasParaExpirar(doc) < 0;
}

/**
 * Status efetivo: orçamentos abertos passam a "expirado" automaticamente
 * quando a validade de 10 dias vence (derivado, nunca gravado).
 */
export function statusEfetivo(doc: Documento): DocumentoStatus {
  if (
    (doc.status === "ORCAMENTO_ABERTO" || doc.status === "PRONTO_FATURAMENTO") &&
    isOrcamentoExpirado(doc)
  ) {
    return "ORCAMENTO_EXPIRADO";
  }
  return doc.status;
}

/** Status simplificado exibido na listagem (convenção Sankhya):
 *  Pendente · Confirmado · Aguardando liberação. */
export type StatusSimplificado = "PENDENTE" | "CONFIRMADO" | "AGUARDANDO_LIBERACAO";

export function statusSimplificado(doc: Documento): StatusSimplificado {
  const st = statusEfetivo(doc);
  if (st === "AGUARDANDO_LIBERACAO") return "AGUARDANDO_LIBERACAO";
  if (st === "PRONTO_FATURAMENTO" || st === "PEDIDO_ABERTO" || st === "PEDIDO_FATURADO") {
    return "CONFIRMADO";
  }
  return "PENDENTE";
}

export const STATUS_SIMPLIFICADO_LABEL: Record<StatusSimplificado, string> = {
  PENDENTE: "Pendente",
  CONFIRMADO: "Confirmado",
  AGUARDANDO_LIBERACAO: "Aguardando liberação",
};

/** Rótulos amigáveis por status (padrão visual do portal) */
export const STATUS_LABEL: Record<DocumentoStatus, string> = {
  ORCAMENTO_ABERTO: "Orçamento aberto",
  ORCAMENTO_EXPIRADO: "Expirado",
  AGUARDANDO_LIBERACAO: "Aguard. liberação",
  PRONTO_FATURAMENTO: "Pronto p/ faturar",
  SEM_ESTOQUE: "Sem estoque",
  PEDIDO_ABERTO: "Pedido aberto",
  PEDIDO_FATURADO: "Faturado",
  CANCELADO: "Cancelado",
};
