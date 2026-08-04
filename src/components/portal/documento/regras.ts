import { statusEfetivo } from "@/lib/mock";
import type { Documento, DocumentoStatus } from "@/lib/mock";

export interface RegrasDocumento {
  status: DocumentoStatus;
  expirado: boolean;
  /** edição de cabeçalho/itens (qtd, preço, desconto, preço alternativo) */
  podeEditar: boolean;
  /** inclusão de itens: orçamento editável OU pedido ainda aberto */
  podeAdicionarItem: boolean;
  /** exclusão de itens: nunca em pedidos (alterações via PCE) */
  podeRemoverItem: boolean;
  /** duplicação: somente orçamentos (pedidos nunca) */
  podeDuplicar: boolean;
  /** enviar para régua de eventos ("Confirmar para faturamento") */
  podeConfirmar: boolean;
  /** faturar (converte em pedido + reserva estoque) */
  podeFaturar: boolean;
  faturado: boolean;
}

/** Regras de negócio derivadas do status efetivo (validade de 10 dias inclusa). */
export function regrasDocumento(doc: Documento): RegrasDocumento {
  const status = statusEfetivo(doc);
  const expirado = status === "ORCAMENTO_EXPIRADO";
  const orcamentoEditavel =
    doc.tipo === "ORCAMENTO" && (status === "ORCAMENTO_ABERTO" || status === "SEM_ESTOQUE");
  return {
    status,
    expirado,
    podeEditar: orcamentoEditavel,
    podeAdicionarItem: orcamentoEditavel || status === "PEDIDO_ABERTO",
    podeRemoverItem: orcamentoEditavel,
    podeDuplicar: doc.tipo === "ORCAMENTO",
    podeConfirmar: orcamentoEditavel,
    podeFaturar: status === "PRONTO_FATURAMENTO",
    faturado: status === "PEDIDO_FATURADO",
  };
}
