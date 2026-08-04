import type { RegraLimite } from "./types";

/** Parâmetros configuráveis na tela "Liberação de Limites → Configuração" */
export const regrasLimiteMock: RegraLimite[] = [
  {
    id: "rl-1",
    eventoTipo: "VALOR_MINIMO",
    descricao: "Valor mínimo do pedido",
    parametro: "Valor mínimo para faturamento sem liberação",
    valor: 500,
    unidade: "R$",
  },
  {
    id: "rl-2",
    eventoTipo: "DESCONTO_PRODUTO",
    descricao: "Desconto máximo por produto",
    parametro: "Percentual máximo de desconto por item",
    valor: 10,
    unidade: "%",
  },
  {
    id: "rl-3",
    eventoTipo: "DESCONTO_ITEM_NOTA",
    descricao: "Desconto máximo da nota",
    parametro: "Percentual máximo de desconto no total da nota",
    valor: 8,
    unidade: "%",
  },
  {
    id: "rl-4",
    eventoTipo: "COMISSAO_REDUZIDA",
    descricao: "Comissão padrão do vendedor",
    parametro: "Percentual padrão — abaixo disso exige liberação",
    valor: 5,
    unidade: "%",
  },
  {
    id: "rl-5",
    eventoTipo: "TEMPO_INATIVO",
    descricao: "Tempo de inatividade do parceiro",
    parametro: "Dias sem compra que exigem liberação",
    valor: 90,
    unidade: "dias",
  },
];
