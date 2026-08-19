import { brl, calcDocumentoTotal, precoLiquidoItem } from "./helpers";
import type {
  Documento,
  EventoOcorrencia,
  EventoTipo,
  Parceiro,
  Produto,
  RegraLimite,
} from "./types";

export const EVENTO_LABEL: Record<EventoTipo, string> = {
  VALOR_MINIMO: "Liberação de valor mínimo",
  PRECO_MINIMO: "Liberação de preço mínimo",
  COMISSAO_REDUZIDA: "Liberação de comissão reduzida",
  LIMITE_CREDITO: "Limite de crédito excedido",
  INADIMPLENTE: "Atraso do parceiro",
  DESCONTO_ITEM_NOTA: "Desconto por item da nota",
  DESCONTO_PRODUTO: "Desconto de produto",
  TEMPO_INATIVO: "Parceiro com tempo inativo",
};

/** Número do evento de liberação (convenção Sankhya — ex.: 3 = limite
 *  de crédito, 7 = atraso do parceiro). */
export const EVENTO_NUM: Record<EventoTipo, number> = {
  DESCONTO_ITEM_NOTA: 1,
  DESCONTO_PRODUTO: 2,
  LIMITE_CREDITO: 3,
  PRECO_MINIMO: 5,
  INADIMPLENTE: 7,
  VALOR_MINIMO: 9,
  COMISSAO_REDUZIDA: 14,
  TEMPO_INATIVO: 21,
};

export const eventoTitulo = (tipo: EventoTipo) =>
  `Evento ${EVENTO_NUM[tipo]} — ${EVENTO_LABEL[tipo]}`;

const regra = (regras: RegraLimite[], tipo: EventoTipo) =>
  regras.find((r) => r.eventoTipo === tipo)?.valor;

const pct = (n: number) => `${String(n).replace(".", ",")}%`;

/**
 * Avalia os eventos de bloqueio do documento no momento do
 * "Confirmar para faturamento" — replica as regras da Central
 * de Certificação descritas no levantamento do Grupo HL.
 */
export function avaliarEventos(
  doc: Documento,
  parceiro: Parceiro | undefined,
  produtos: Produto[],
  regras: RegraLimite[],
): EventoOcorrencia[] {
  const ocorrencias: Omit<EventoOcorrencia, "id" | "status" | "solicitadoEm">[] = [];
  const total = calcDocumentoTotal(doc);

  // 1. Valor mínimo do pedido
  const valorMinimo = regra(regras, "VALOR_MINIMO");
  if (valorMinimo != null && total < valorMinimo) {
    ocorrencias.push({
      tipo: "VALOR_MINIMO",
      descricao: `Total de ${brl(total)} abaixo do valor mínimo de ${brl(valorMinimo)}`,
    });
  }

  // 2. Preço mínimo por produto (preço líquido praticado)
  for (const item of doc.itens) {
    const produto = produtos.find((p) => p.codProd === item.codProd);
    if (!produto) continue;
    const liquido = precoLiquidoItem(item);
    if (liquido < produto.precoMinimo) {
      ocorrencias.push({
        tipo: "PRECO_MINIMO",
        descricao: `${item.descricao} abaixo do preço mínimo (${brl(liquido)} < ${brl(produto.precoMinimo)})`,
      });
    }
  }

  // 3. Comissão reduzida
  const comissaoPadrao = regra(regras, "COMISSAO_REDUZIDA");
  if (comissaoPadrao != null && doc.comissaoPct < comissaoPadrao) {
    ocorrencias.push({
      tipo: "COMISSAO_REDUZIDA",
      descricao: `Comissão reduzida de ${pct(comissaoPadrao)} para ${pct(doc.comissaoPct)}`,
    });
  }

  // 4. Limite de crédito da empresa
  const dadosEmp = parceiro?.dadosPorEmpresa.find((d) => d.codEmp === doc.codEmp);
  if (dadosEmp) {
    const disponivel = dadosEmp.limiteCredito - dadosEmp.creditoUtilizado;
    if (total > disponivel) {
      ocorrencias.push({
        tipo: "LIMITE_CREDITO",
        descricao: `Pedido de ${brl(total)} excede o crédito disponível (${brl(disponivel)})`,
      });
    }
  }

  // 5. Parceiro inadimplente
  if (parceiro?.inadimplente) {
    ocorrencias.push({
      tipo: "INADIMPLENTE",
      descricao: `${parceiro.razaoSocial} possui títulos em aberto vencidos`,
    });
  }

  // 6. Desconto por item da nota (desconto de cabeçalho/totais)
  const maxDescNota = regra(regras, "DESCONTO_ITEM_NOTA");
  if (maxDescNota != null && doc.descontoCabecalhoPct > maxDescNota) {
    ocorrencias.push({
      tipo: "DESCONTO_ITEM_NOTA",
      descricao: `Desconto da nota de ${pct(doc.descontoCabecalhoPct)} acima do máximo (${pct(maxDescNota)})`,
    });
  }

  // 7. Desconto de produto acima do permitido
  const maxDescItem = regra(regras, "DESCONTO_PRODUTO");
  if (maxDescItem != null) {
    for (const item of doc.itens) {
      if (item.descontoPct > maxDescItem) {
        ocorrencias.push({
          tipo: "DESCONTO_PRODUTO",
          descricao: `${item.descricao} com desconto de ${pct(item.descontoPct)} (máx. ${pct(maxDescItem)})`,
        });
      }
    }
  }

  // 8. Tempo inativo do parceiro
  const diasInatividade = regra(regras, "TEMPO_INATIVO");
  if (diasInatividade != null && parceiro?.ultimaCompra) {
    const dias = Math.floor(
      (Date.now() - new Date(parceiro.ultimaCompra + "T00:00:00").getTime()) / 86_400_000,
    );
    if (dias > diasInatividade) {
      ocorrencias.push({
        tipo: "TEMPO_INATIVO",
        descricao: `Parceiro sem compras há ${dias} dias (limite: ${diasInatividade} dias)`,
      });
    }
  }

  const agora = new Date().toISOString();
  return ocorrencias.map((o, i) => ({
    ...o,
    id: `ev-${doc.nunota}-${Date.now()}-${i}`,
    status: "PENDENTE" as const,
    solicitadoEm: agora,
  }));
}
